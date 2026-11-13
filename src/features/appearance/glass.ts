export const GLASS_STORAGE_KEY = "taf-glass-clarity";
/** 0 = most frosted, 100 = clearest. The default is clearer than the original 22px / full-tint glass. */
export const DEFAULT_GLASS_CLARITY = 40;

export interface GlassStyle {
  /** How much of the theme's glass tint is kept, in percent. */
  fill: number;
  /** Backdrop blur radius in pixels. */
  blur: number;
}

export function clampClarity(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Clearer glass keeps less tint and blurs the background less. */
export function getGlassStyle(clarity: number): GlassStyle {
  const t = clampClarity(clarity) / 100;
  return {
    fill: Math.round(100 - t * 75),
    blur: Math.round((26 - t * 18) * 10) / 10,
  };
}

export function readStoredClarity(): number {
  try {
    const raw = globalThis.localStorage?.getItem(GLASS_STORAGE_KEY);
    const value = raw === null || raw === undefined ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? clampClarity(value) : DEFAULT_GLASS_CLARITY;
  } catch {
    return DEFAULT_GLASS_CLARITY;
  }
}

/** Writes the glass variables on <html> so a drag never re-renders the app. */
export function applyGlassClarity(clarity: number): void {
  if (typeof document === "undefined") return;
  const { fill, blur } = getGlassStyle(clarity);
  const style = document.documentElement.style;
  style.setProperty("--lg-fill", `${fill}%`);
  style.setProperty("--glass-blur", `blur(${blur}px) saturate(180%)`);
}
