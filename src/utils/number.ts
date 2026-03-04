export function keepDigits(value: string): string {
  return value.replaceAll(/\D/g, "");
}

export function toNonNegativeInt(value: string | number): number {
  const n = typeof value === "number" ? value : Number(keepDigits(value));
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.round(n));
}

export function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function toBoundedNonNegativeInt(value: string | number, max: number): number {
  return clampInt(toNonNegativeInt(value), 0, max);
}

export function toWindDirection(value: string | number): number {
  const n = toNonNegativeInt(value);
  return Math.max(0, Math.min(360, Math.round(n / 10) * 10));
}

export function toNullableNonNegativeInt(value: string | number): number | null {
  if (value === "") return null;
  const parsed = typeof value === "number" ? value : Number(keepDigits(value));
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}

export function sanitizeNumericInput(raw: string): string {
  return keepDigits(raw);
}
