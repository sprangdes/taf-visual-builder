/**
 * Illustrated cloud renderer: clouds are built from soft, individually shaded "puffs" drawn with Canvas 2D
 * gradients, the way hand-painted weather illustrations are, rather than from thresholded noise (which reads
 * as flat cut-outs). It only needs a 2D canvas context, so it runs in a Web Worker on an OffscreenCanvas,
 * or on the main thread as a fallback.
 *
 * Each layer is a deck at its own altitude seen from the ground. Clouds are placed in ground space and
 * projected: they shrink, crowd and flatten towards the horizon and fade into its haze, while overhead
 * clouds are large. Coverage (FEW … OVC) sets how much of the sky the clouds fill.
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
  /** 0 = light high in the sky, 1 = on the horizon (warm rims, glowing edges). */
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

/* ---------- helpers ---------- */

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

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const rgba = (c: Rgb, alpha: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${clamp01(alpha).toFixed(3)})`;

/** Screen row of the horizon (the ground line sits just below the bottom edge of the scene). */
const HORIZON_V = 1.02;
/** Vertical angle spanned by the sky from the top of the screen to the horizon (radians). */
const FOV = 0.95;

const elevationAt = (v: number) => (HORIZON_V - v) * FOV;
/** Fraction of haze colour mixed into a cloud at this elevation (aerial perspective). */
const hazeAt = (elevation: number) => {
  const t = 1 - clamp01((elevation - 0.02) / 0.42);
  return t * t * 0.65;
};

/* ---------- puffs ---------- */

interface Palette {
  lit: Rgb;
  shade: Rgb;
  base: Rgb;
}

function palette(spec: CloudLayerSpec, elevation: number): Palette {
  const { light, darkness } = spec;
  const haze = hazeAt(elevation);
  const lit = mixRgb(light.color, light.haze, haze);
  const shade = mixRgb(mixRgb(light.shade, [70, 76, 92], darkness * 0.55), light.haze, haze * 0.8);
  const base = mixRgb(shade, [40, 44, 58], 0.25 + darkness * 0.45);
  return { lit, shade, base: mixRgb(base, light.haze, haze * 0.7) };
}

/** One soft, round heap: a disc of cloud that thins out towards its rim (shading is applied per cloud). */
function drawPuff(ctx: Ctx, x: number, y: number, r: number, color: Rgb, alpha: number) {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  // Feather a fixed band at the rim so big heaps keep a crisp edge instead of a blur that grows with size.
  const edge = Math.max(0.6, 1 - 16 / Math.max(1, r));
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(edge, rgba(color, alpha * 0.92));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Lights a cloud already drawn on `ctx`: tops in the light colour, sides and base in shade, a soft
 * highlight on the side facing the light. Uses source-atop so only the cloud's own pixels change.
 */
function shadeCloud(ctx: Ctx, cx: number, topY: number, baseY: number, width: number, pal: Palette, lightDir: [number, number], glow: number) {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const body = ctx.createLinearGradient(0, topY, 0, baseY);
  body.addColorStop(0, rgba(pal.lit, 1));
  body.addColorStop(0.6, rgba(mixRgb(pal.lit, pal.shade, 0.3), 1));
  body.addColorStop(1, rgba(pal.shade, 1));
  ctx.fillStyle = body;
  ctx.fillRect(cx - width, topY - width, width * 2, baseY - topY + width * 2);
  // Highlight where the light strikes, and a warm/bright rim when the light is low.
  const hx = cx + lightDir[0] * width * 0.3;
  const hy = topY + (baseY - topY) * 0.3;
  const hi = ctx.createRadialGradient(hx, hy, 0, hx, hy, width * 0.55);
  hi.addColorStop(0, rgba(pal.lit, 0.65 + glow * 0.3));
  hi.addColorStop(1, rgba(pal.lit, 0));
  ctx.fillStyle = hi;
  ctx.fillRect(cx - width, topY - width, width * 2, baseY - topY + width * 2);
  ctx.restore();
}

/** A cumulus: heaps stacked into a dome over a flat base, then lit as one body. */
function drawCumulus(
  ctx: Ctx,
  rand: () => number,
  cx: number,
  baseY: number,
  width: number,
  pal: Palette,
  lightDir: [number, number],
  alpha: number,
  glow: number,
  tall: number,
) {
  const white: Rgb = [255, 255, 255];
  // Columns of heaps standing on the base line, tallest in the middle: the body is continuous from the
  // flat bottom up to the dome, and the column tops give the cauliflower outline.
  const columns = 4 + Math.min(tall > 1 ? 12 : 7, Math.floor(width / 34));
  let topY = baseY;
  for (let i = 0; i < columns; i += 1) {
    const t = (i / (columns - 1)) * 2 - 1;
    const dome = Math.sqrt(Math.max(0, 1 - t * t * 0.9));
    const x = cx + t * width * 0.38 + (rand() - 0.5) * width * 0.05;
    const columnTop = baseY - width * (0.12 + dome * tall * (0.55 + rand() * 0.45));
    let r = width * (0.1 + 0.05 * dome) * (0.85 + rand() * 0.3);
    let y = baseY - r * 0.85;
    while (true) {
      drawPuff(ctx, x + (rand() - 0.5) * r * 0.4, y, r, white, alpha);
      topY = Math.min(topY, y - r);
      if (y - r * 0.6 <= columnTop) break;
      y -= r * 0.65;
      r *= 1.04;
    }
  }
  shadeCloud(ctx, cx, topY, baseY, width, pal, lightDir, glow);

  // Flat base: trim the bottom to a soft straight edge.
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  const band = width * 0.05;
  const cut = ctx.createLinearGradient(0, baseY - band, 0, baseY + band * 1.5);
  cut.addColorStop(0, "rgba(0,0,0,0)");
  cut.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = cut;
  ctx.fillRect(cx - width, baseY - band, width * 2, width);
  ctx.restore();
}

/* ---------- layers ---------- */

/**
 * Cumulus field: walk rows from the horizon (far, drawn first) up past the top of the screen (overhead,
 * drawn last); at each row the projected size follows the distance to the deck.
 */
function cumulusDeck(ctx: Ctx, spec: CloudLayerSpec, rand: () => number, scratch: () => Ctx) {
  const { width: W, height: H } = spec;
  const altitude = 1 + Math.min(spec.altitude, 250) / 45;
  const glow = clamp01(spec.light.low) * 0.5;
  let v = 0.995;
  while (v > -0.15) {
    const e = Math.max(0.03, elevationAt(v));
    const scale = Math.sin(e) / altitude;
    const cloudW = W * (0.45 + spec.cover * 0.5) * scale * 0.85;
    const cloudH = cloudW * (0.32 + 0.25 * Math.sin(e));
    const rowStep = Math.max(0.006, (cloudH / H) * 0.6);
    // Expected share of this row band covered = count × cloud area / band area ≈ cover.
    const perRow = (spec.cover * W * rowStep * H) / Math.max(4, cloudW * cloudH * 0.62);
    let count = Math.floor(perRow) + (rand() < perRow % 1 ? 1 : 0);
    const pal = palette(spec, e);
    const alpha = clamp01(0.35 + Math.sin(e) * 2.2) * 0.98;
    while (count-- > 0) {
      const w = cloudW * (0.6 + rand() * 0.8);
      const cx = rand() * (W + w) - w / 2;
      const baseY = (v + (rand() - 0.5) * rowStep) * H;
      const lx = spec.light.x * W - cx;
      const ly = spec.light.y * H - baseY;
      const ll = Math.hypot(lx, ly) || 1;
      // Each cloud is drawn alone first, so its base trim and shading do not cut into its neighbours.
      const c = scratch();
      c.clearRect(0, 0, W, H);
      drawCumulus(c, rand, cx, baseY, w, pal, [lx / ll, ly / ll], alpha, glow, 0.3 + Math.sin(e) * 0.25);
      ctx.drawImage(c.canvas as CanvasImageSource, 0, 0);
    }
    v -= rowStep;
  }
}

function stratusDeck(ctx: Ctx, spec: CloudLayerSpec, rand: () => number) {
  const { width: W, height: H } = spec;
  // A closed grey deck, darker overhead, lighter and hazier towards the horizon…
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  for (const stop of [0, 0.5, 0.8, 1]) {
    const pal = palette(spec, elevationAt(stop));
    sky.addColorStop(stop, rgba(mixRgb(pal.shade, pal.lit, 0.3 + stop * 0.4), 0.97));
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // …with soft rolls and thinner, lighter patches giving it structure, smaller towards the horizon.
  let v = 0.98;
  while (v > -0.1) {
    const e = Math.max(0.03, elevationAt(v));
    const size = W * 0.55 * Math.sin(e);
    const pal = palette(spec, e);
    for (let i = 0; i < 4; i += 1) {
      const cx = rand() * W;
      const cy = v * H + (rand() - 0.5) * size * 0.2;
      const rx = size * (0.6 + rand() * 0.8);
      const ry = rx * (0.16 + Math.sin(e) * 0.2);
      const light = rand() < 0.5;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      g.addColorStop(0, rgba(light ? pal.lit : pal.base, light ? 0.22 : 0.28));
      g.addColorStop(1, rgba(light ? pal.lit : pal.base, 0));
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / rx);
      ctx.translate(-cx, -cy);
      ctx.beginPath();
      ctx.arc(cx, cy, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    v -= Math.max(0.02, Math.sin(e) * 0.09);
  }
}

function cirrusDeck(ctx: Ctx, spec: CloudLayerSpec, rand: () => number) {
  const { width: W, height: H } = spec;
  const strands = Math.round(10 + spec.cover * 26);
  ctx.save();
  ctx.lineCap = "round";
  for (let s = 0; s < strands; s += 1) {
    const v = 0.05 + Math.pow(rand(), 0.8) * 0.8;
    const e = elevationAt(v);
    const pal = palette(spec, e);
    const len = W * (0.25 + rand() * 0.45) * (0.4 + Math.sin(e));
    const x0 = rand() * (W + len) - len;
    const y0 = v * H;
    const curl = (rand() - 0.5) * H * 0.08;
    // A fibrous streak: several fine, faint strokes along a gentle curve, fading at both ends.
    for (let f = 0; f < 7; f += 1) {
      const off = (f - 3) * (2 + Math.sin(e) * 4);
      const g = ctx.createLinearGradient(x0, y0, x0 + len, y0 + curl);
      const a = (0.14 + rand() * 0.16) * (0.5 + Math.sin(e));
      g.addColorStop(0, rgba(pal.lit, 0));
      g.addColorStop(0.3 + rand() * 0.2, rgba(pal.lit, a));
      g.addColorStop(1, rgba(pal.lit, 0));
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5 + rand() * 4 * (0.4 + Math.sin(e));
      ctx.beginPath();
      ctx.moveTo(x0, y0 + off);
      ctx.bezierCurveTo(x0 + len * 0.35, y0 + off - curl * 0.6, x0 + len * 0.7, y0 + off + curl, x0 + len, y0 + off + curl * 0.4 + (rand() - 0.5) * 10);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * A towering cumulus / cumulonimbus rising from the horizon: built like any cumulus, only far taller, so it
 * shares the cauliflower outline and lighting. A CB also carries an anvil sheared downwind (to the left).
 */
function tower(ctx: Ctx, spec: CloudLayerSpec, rand: () => number, scratch: () => Ctx) {
  const { width: W, height: H } = spec;
  const cb = spec.tower === "cb";
  const cx = W * (0.62 + (rand() - 0.5) * 0.24);
  const baseY = H * 1.0;
  const width = W * (cb ? 0.3 : 0.22);
  const crownY = H * (cb ? 0.2 : 0.45);
  // Column height ≈ width × (0.12 + tall × ~0.8) → choose `tall` so the crown reaches crownY.
  const tall = ((baseY - crownY) / width - 0.12) / 0.8;
  const pal = palette({ ...spec, darkness: Math.min(1, spec.darkness + (cb ? 0.25 : 0.1)) }, elevationAt(0.55));
  const lx = spec.light.x * W - cx;
  const ly = spec.light.y * H - crownY;
  const ll = Math.hypot(lx, ly) || 1;
  const c = scratch();
  c.clearRect(0, 0, W, H);
  if (cb) {
    // Anvil lobes behind the crown, flattened and thinning out downwind.
    for (let i = 0; i < 12; i += 1) {
      const t = i / 11;
      const x = cx + width * 0.15 - width * 1.05 * t + (rand() - 0.5) * width * 0.08;
      const rx = width * (0.32 - 0.14 * t) * (0.85 + rand() * 0.3);
      c.save();
      c.translate(x, crownY + H * 0.03 + t * H * 0.02);
      c.scale(1, 0.38);
      drawPuff(c, 0, 0, rx, [255, 255, 255], 0.95 - t * 0.4);
      c.restore();
    }
  }
  drawCumulus(c, rand, cx, baseY, width, pal, [lx / ll, ly / ll], 0.98, clamp01(spec.light.low) * 0.4, tall);
  ctx.drawImage(c.canvas as CanvasImageSource, 0, 0);
}

/* ---------- render ---------- */

/** Draws one cloud layer onto `ctx` (a transparent canvas of spec.width × spec.height). */
export function renderCloudLayer(ctx: Ctx, spec: CloudLayerSpec, createContext: CanvasFactory): void {
  const rand = mulberry32(spec.seed);
  ctx.clearRect(0, 0, spec.width, spec.height);
  let scratch: Ctx | null = null;
  const getScratch = () => (scratch ??= createContext(spec.width, spec.height));

  if (spec.kind === "stratus") stratusDeck(ctx, spec, rand);
  else if (spec.kind === "cirrus") cirrusDeck(ctx, spec, rand);
  else cumulusDeck(ctx, spec, rand, getScratch);
  if (spec.tower !== "none") tower(ctx, spec, rand, getScratch);

  // Haze swallows the clouds right at the horizon.
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  const fade = ctx.createLinearGradient(0, spec.height * 0.9, 0, spec.height);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, spec.height * 0.9, spec.width, spec.height * 0.1);
  ctx.restore();
}
