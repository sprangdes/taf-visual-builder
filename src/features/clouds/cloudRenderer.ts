/**
 * Realistic cloud renderer, run in a Web Worker (OffscreenCanvas) or on the main thread as a fallback.
 *
 * Each layer is a deck at its own altitude seen from the ground: screen rows are projected onto the deck,
 * so clouds shrink and flatten towards the horizon and fade into its haze. Density is domain-warped
 * fractal noise, eroded at the edges by finer noise so cloud margins break into wisps. Lighting marches a
 * few samples from each point towards the sun or moon and applies Beer–Lambert extinction, with a
 * "powder" term (thin edges glow, thick cores darken) and forward scattering when the light is behind the
 * cloud — the cues that make the sky read as volumetric rather than painted.
 */

export type CloudKind = "cumulus" | "stratus" | "cirrus";

export type Rgb = [number, number, number];

export interface CloudLight {
  /** Light position on screen, 0–1 (y may exceed 1 when the sun/moon is at the horizon). */
  x: number;
  y: number;
  /** Lit colour (sRGB 0–255). */
  color: Rgb;
  /** Colour of shaded sides and bases. */
  shade: Rgb;
  /** Sky colour near the horizon, for aerial perspective. */
  haze: Rgb;
  /** 0 = light high in the sky, 1 = on the horizon (warm, glowing edges). */
  low: number;
}

export interface CloudLayerSpec {
  width: number;
  height: number;
  seed: number;
  /** Share of the sky covered: FEW 0.18 … OVC 1. */
  cover: number;
  /** Cloud base in hundreds of feet. */
  altitude: number;
  kind: CloudKind;
  /** Cumulonimbus / towering cumulus rising from the horizon. */
  tower: "none" | "tcu" | "cb";
  light: CloudLight;
  /** 0 = clear daylight … 1 = dark storm. */
  darkness: number;
}

export type Ctx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
export type CanvasFactory = (width: number, height: number) => Ctx;

/* ---------- noise ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRAD = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1];

function createNoise(seed: number) {
  const random = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) p[i] = i;
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i += 1) perm[i] = p[i & 255];

  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const aa = (perm[perm[X] + Y] & 7) * 2;
    const ab = (perm[perm[X] + Y + 1] & 7) * 2;
    const ba = (perm[perm[X + 1] + Y] & 7) * 2;
    const bb = (perm[perm[X + 1] + Y + 1] & 7) * 2;
    const gaa = GRAD[aa] * xf + GRAD[aa + 1] * yf;
    const gba = GRAD[ba] * (xf - 1) + GRAD[ba + 1] * yf;
    const gab = GRAD[ab] * xf + GRAD[ab + 1] * (yf - 1);
    const gbb = GRAD[bb] * (xf - 1) + GRAD[bb + 1] * (yf - 1);
    const x1 = gaa + u * (gba - gaa);
    const x2 = gab + u * (gbb - gab);
    return (x1 + v * (x2 - x1)) * 1.4;
  };

  const fbm = (x: number, y: number, octaves: number) => {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < octaves; o += 1) {
      sum += amp * noise(x * freq + o * 17.3, y * freq - o * 9.1);
      freq *= 2.02;
      amp *= 0.5;
    }
    return sum;
  };

  /** Billowy noise in about [0, 1] (folded absolute values give rounded, cauliflower-like heaps). */
  const billow = (x: number, y: number, octaves: number) => {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o += 1) {
      sum += amp * (1 - Math.abs(noise(x * freq + o * 31.7, y * freq + o * 5.3)));
      norm += amp;
      freq *= 2.07;
      amp *= 0.5;
    }
    return sum / norm;
  };

  return { fbm, billow };
}

type Noise = ReturnType<typeof createNoise>;

/* ---------- helpers ---------- */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Screen row of the horizon (the ground line sits just below the bottom edge of the scene). */
const HORIZON_V = 1.03;
/** Vertical angle the sky spans, top of the screen to the horizon (radians). */
const FOV = 0.95;

/* ---------- density ---------- */

interface Deck {
  spec: CloudLayerSpec;
  n: Noise;
  threshold: number;
  soft: number;
  towerX: number;
}

/** Deck coordinates (lateral, distance) and elevation for a screen point; null below the haze line. */
function project(spec: CloudLayerSpec, u: number, v: number): [number, number, number] | null {
  const elevation = (HORIZON_V - v) * FOV;
  if (elevation <= 0.012) return null;
  const altitude = 1 + Math.min(spec.altitude, 300) / 40;
  const ground = altitude / Math.tan(elevation);
  const lateral = ((u - 0.5) * 2.1 * altitude) / Math.sin(elevation);
  return [lateral, ground, elevation];
}

/** Raw shape value before thresholding (higher = more cloud). */
function shape(spec: CloudLayerSpec, n: Noise, x: number, y: number): number {
  if (spec.kind === "cirrus") {
    const sx = x * 0.09;
    const sy = y * 1.0;
    const curl = n.fbm(sx * 1.4, sy * 0.3, 3) * 1.3;
    return n.fbm(sx * 0.6, sy * 0.4, 3) * 0.55 + n.fbm((sx + curl * 0.4) * 1.3, (sy + curl) * 2.4, 5) * 0.45;
  }
  if (spec.kind === "stratus") {
    return n.fbm(x * 0.2, y * 0.26, 5) * 0.85 + n.fbm(x * 1.1, y * 1.4, 3) * 0.15;
  }
  const sx = x * 0.42;
  const sy = y * 0.42;
  const wx = n.fbm(sx * 0.7 + 3.1, sy * 0.7 + 7.7, 3);
  const wy = n.fbm(sx * 0.7 - 5.2, sy * 0.7 + 1.3, 3);
  const mass = n.fbm(sx + wx * 0.55, sy + wy * 0.55, 5);
  const heaps = n.billow(sx * 2.2 + wx * 0.3, sy * 2.2, 4);
  const florets = n.billow(sx * 6.5 + wy * 0.5, sy * 6.5, 3);
  return mass + (heaps - 0.55) * 0.28 + (florets - 0.55) * 0.07;
}

/** Fine erosion noise: breaks cloud margins into wisps without touching thick cores. */
function erosion(n: Noise, x: number, y: number): number {
  return n.fbm(x * 3.1, y * 3.1, 3);
}

/**
 * Samples a noise function so the result tiles horizontally: the value at u is cross-faded with the value one
 * screen-width earlier, so u = 0 and u = 1 match and a drifting layer can wrap round without a seam. Dividing
 * by the blend's norm keeps the contrast (and so the coverage) the same across the screen.
 */
function periodic(spec: CloudLayerSpec, u: number, v: number, f: (x: number, y: number) => number): number {
  const a = project(spec, u, v);
  const b = project(spec, u - 1, v);
  if (!a || !b) return 0;
  const t = u;
  return (f(a[0], a[1]) * (1 - t) + f(b[0], b[1]) * t) / Math.hypot(1 - t, t);
}

function makeDeck(spec: CloudLayerSpec): Deck {
  const n = createNoise(spec.seed);
  const rand = mulberry32(spec.seed ^ 0x5bd1e995);
  const samples: number[] = [];
  for (let i = 0; i < 1800; i += 1) {
    const p = project(spec, rand(), rand() * 0.88);
    if (p) samples.push(periodic(spec, rand(), rand() * 0.88, (x, y) => shape(spec, n, x, y)));
  }
  samples.sort((a, b) => a - b);
  const soft = spec.kind === "cirrus" ? 0.12 : spec.kind === "stratus" ? 0.16 : 0.1;
  // Pick the threshold so the requested share of the visible sky is cloud.
  const threshold =
    spec.cover >= 0.99 ? samples[0] - soft * 3 : samples[Math.min(samples.length - 1, Math.floor((1 - spec.cover) * samples.length))];
  return { spec, n, threshold, soft, towerX: 0.6 + (mulberry32(spec.seed + 99)() - 0.5) * 0.3 };
}

/** How far inside the cloud a point is (0 at the margin … 1 deep in a thick core), plus puff texture. */
function deckBody(d: Deck, u: number, v: number): [number, number] {
  const { spec, n } = d;
  const p = project(spec, u, v);
  if (!p) return [0, 0.5];
  const s = periodic(spec, u, v, (x, y) => shape(spec, n, x, y));
  const scale = spec.kind === "stratus" ? 1.1 : spec.kind === "cirrus" ? 2 : 2.8;
  const puff = 0.5 + periodic(spec, u, v, (x, y) => n.billow(x * scale + 40, y * scale, 4) - 0.5);
  // A closed deck: thickness follows the noise itself, giving darker rolls and thinner, brighter patches.
  const depth = spec.kind === "stratus" ? 0.5 + s * 1.6 : (s - d.threshold) / 0.32;
  return [clamp01(depth), puff];
}

function deckDensity(d: Deck, u: number, v: number): number {
  const { spec, n } = d;
  const p = project(spec, u, v);
  if (!p) return 0;
  const s = periodic(spec, u, v, (x, y) => shape(spec, n, x, y));
  // Overhead clouds are magnified by perspective; tighten their margin in noise space to keep them sharp.
  const soft = d.soft * (0.4 + 0.6 * (1 - p[2] / FOV));
  let density = smoothstep(d.threshold - soft, d.threshold + soft * 2.2, s);
  if (density > 0 && density < 0.75 && spec.kind !== "stratus") {
    // Edge erosion: thin parts are eaten away by fine noise into ragged wisps.
    const e = periodic(spec, u, v, (x, y) => erosion(n, x * 0.42, y * 0.42));
    density = clamp01(density - (1 - density) * (0.35 + e * 0.9) * 0.6);
  }
  if (spec.kind === "cirrus") density *= 0.55;
  // The farthest clouds dissolve into the horizon haze.
  return density * smoothstep(0.012, 0.1, p[2]);
}

function towerDensity(d: Deck, u: number, v: number): number {
  const { spec, n } = d;
  if (spec.tower === "none") return 0;
  const cb = spec.tower === "cb";
  const top = cb ? 0.16 : 0.44;
  if (v < top - 0.08) return 0;
  const aspect = spec.width / spec.height;
  const t = clamp01((v - top) / (1 - top)); // 0 at the crown, 1 at the base
  let half = (cb ? 0.1 : 0.075) * (0.72 + 0.4 * Math.sqrt(t));
  let centre = d.towerX;
  if (cb) {
    // Anvil: a flat-topped shelf under the tropopause, sheared downwind (left).
    const shelf = smoothstep(top + 0.13, top + 0.025, v);
    half += 0.17 * shelf;
    centre -= 0.12 * shelf;
  }
  const x = u * aspect * 5;
  const y = v * 5;
  const heaps = n.billow(x, y, 5);
  const wobble = n.fbm(x * 0.5 + 11, y * 0.5, 3);
  const dx = Math.abs(u - centre + wobble * 0.025) / half;
  const crown = cb ? top + (heaps - 0.5) * 0.015 : top + (heaps - 0.5) * 0.09;
  let density = smoothstep(0, 0.28, 1 - dx + (heaps - 0.55) * 0.75);
  density *= smoothstep(crown - 0.015, crown + 0.03, v);
  return density;
}

/* ---------- render ---------- */

/** Draws one cloud layer onto `ctx` (a transparent canvas of spec.width × spec.height). */
/** Separable box blur (horizontal then vertical) with running sums: O(w·h) whatever the radius. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);
  const span = r * 2 + 1;
  for (let y = 0; y < h; y += 1) {
    let sum = 0;
    const row = y * w;
    // Horizontal pass wraps round: the layer tiles horizontally.
    const wrap = (x: number) => ((x % w) + w) % w;
    for (let x = -r; x <= r; x += 1) sum += src[row + wrap(x)];
    for (let x = 0; x < w; x += 1) {
      tmp[row + x] = sum / span;
      sum += src[row + wrap(x + r + 1)] - src[row + wrap(x - r)];
    }
  }
  for (let x = 0; x < w; x += 1) {
    let sum = 0;
    for (let y = -r; y <= r; y += 1) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y += 1) {
      dst[y * w + x] = sum / span;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return dst;
}

export function renderCloudLayer(ctx: Ctx, spec: CloudLayerSpec, createContext: CanvasFactory): void {
  // Render at 2/3 resolution and smooth up: enough for crisp cauliflower edges, a third of the work.
  const w = Math.max(1, Math.round((spec.width * 2) / 3));
  const h = Math.max(1, Math.round((spec.height * 2) / 3));
  const deck = makeDeck(spec);
  const { light, darkness } = spec;
  const aspect = w / h;

  // Pass 1: density, thickness (a height field: how far the cloud bulges towards us) and puff texture.
  const D = new Float32Array(w * h);
  const T = new Float32Array(w * h);
  const P = new Float32Array(w * h);
  for (let py = 0; py < h; py += 1) {
    const v = py / h;
    for (let px = 0; px < w; px += 1) {
      const u = px / w;
      const a = deckDensity(deck, u, v);
      const b = spec.tower === "none" ? 0 : towerDensity(deck, u, v);
      const d = 1 - (1 - a) * (1 - b);
      const i = py * w + px;
      D[i] = d;
      if (d < 0.004) continue;
      const [depth, puff] = deckBody(deck, u, v);
      T[i] = Math.max(depth * 0.7 + puff * 0.3 * d, b * (0.6 + puff * 0.4));
      P[i] = puff;
    }
  }
  // Large-scale height field: the density blurred over roughly one heap, so lighting follows whole
  // cloud forms (rounded, sunlit domes and shaded flanks) rather than fine wrinkles.
  const H = boxBlur(boxBlur(D, w, h, Math.max(2, Math.round(w / 90))), w, h, Math.max(2, Math.round(w / 90)));
  const Hf = boxBlur(T, w, h, Math.max(1, Math.round(w / 260)));
  const at = (arr: Float32Array, x: number, y: number) => {
    const xi = ((Math.floor(x) % w) + w) % w;
    const yi = y < 0 ? 0 : y >= h ? h - 1 : y | 0;
    return arr[yi * w + xi];
  };

  const small = createContext(w, h);
  const image = small.createImageData(w, h);
  const out = image.data;
  const steps = 6;
  const extinction = 0.75 + darkness * 1.2;
  const ambient = 0.42 - darkness * 0.16;
  // Light direction: on screen towards the sun/moon, and out of the screen by how high it stands.
  const lz = 0.35 + (1 - light.low) * 0.9;
  const relief = spec.kind === "stratus" ? 5 : spec.kind === "cirrus" ? 3 : 9;
  const sampleR = Math.max(1, Math.round(w / 300));

  const lightLen = Math.hypot((light.x - 0.5) * aspect, light.y - 0.45) || 1;
  const lightDirX = ((light.x - 0.5) * aspect) / lightLen;
  const lightDirY = (light.y - 0.45) / lightLen;

  // Pass 2: lighting.
  for (let py = 0; py < h; py += 1) {
    const v = py / h;
    const elevation = (HORIZON_V - v) * FOV;
    const haze = (1 - smoothstep(0.02, 0.5, elevation)) * 0.6;
    for (let px = 0; px < w; px += 1) {
      const i = py * w + px;
      const d = D[i];
      if (d < 0.004) continue;
      // Surface normal of the height field: bulges facing the light are bright, creases dark.
      const R = sampleR * 3;
      // Big forms from the blurred field; heap detail (stronger in closed decks) from the lightly blurred one.
      const fine = spec.kind === "stratus" ? 1.4 : 0.75;
      const gx = (at(H, px + R, py) - at(H, px - R, py)) * relief * 1.6 + (at(Hf, px + sampleR, py) - at(Hf, px - sampleR, py)) * relief * fine;
      const gy = (at(H, px, py + R) - at(H, px, py - R)) * relief * 1.6 + (at(Hf, px, py + sampleR) - at(Hf, px, py - sampleR)) * relief * fine;
      // One light direction for the whole layer (the clouds drift, and per-pixel directions would also
      // break the horizontal tiling): from mid-screen towards the sun/moon. Only vertical distance to the
      // light varies, so the layer stays seamless.
      const len = Math.max(0.05, Math.abs(light.y - v) + 0.15);
      const ldx = lightDirX;
      const ldy = lightDirY;
      const nl = Math.hypot(gx, gy, 1);
      const ll = Math.hypot(ldx, ldy, lz);
      const ndl = (-gx * ldx - gy * ldy + lz) / (nl * ll);
      // Wrapped diffuse: light bleeds round the heaps.
      const diffuse = clamp01((ndl + 0.3) / 1.3);

      // Self-shadowing: march towards the light through the density map.
      // Fixed step length: steps proportional to the distance from the light would band into rings.
      const stepPx = w * 0.012;
      let optical = 0;
      for (let k = 1; k <= steps; k += 1) optical += at(D, px + ldx * stepPx * k, py + ldy * stepPx * k);
      const transmit = Math.exp(-optical * extinction * 0.28);

      // Cloud bases (cloud above on screen, clear below) sit in their own shadow; tops catch the light.
      const vr = Math.max(3, Math.round(h * 0.03));
      const above = at(H, px, py - vr);
      const below = at(H, px, py + vr);
      const base = spec.kind === "cumulus" ? clamp01((above - below) * 1.2) : 0;

      const thick = T[i];
      const powder = 1 - Math.exp(-d * 3);
      const silver = (1 - d) * (0.12 + light.low * 0.7) * clamp01(1.5 - len * 1.6);
      let lit =
        (0.32 + 0.68 * diffuse) *
          (0.55 + 0.45 * transmit) *
          mix(1, powder, 0.25) *
          (1 - thick * (0.3 + darkness * 0.3)) *
          (1 - base * (0.35 + darkness * 0.2)) +
        silver;
      lit *= 0.84 + P[i] * 0.3;
      lit = clamp01(ambient * 0.5 + (1 - ambient * 0.5) * lit);

      const o = i * 4;
      for (let c = 0; c < 3; c += 1) {
        // Shadows are tinted by the sky; a slightly warm white where the light hits fully.
        const col = mix(light.shade[c], light.color[c], lit);
        out[o + c] = mix(col, light.haze[c], haze);
      }
      // Thin margins are translucent, cores opaque.
      out[o + 3] = Math.round(clamp01(d * 1.15) ** 0.85 * 250);
    }
  }
  small.putImageData(image, 0, 0);
  ctx.clearRect(0, 0, spec.width, spec.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small.canvas as CanvasImageSource, 0, 0, spec.width, spec.height);
}
