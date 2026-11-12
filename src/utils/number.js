export function keepDigits(value) {
    return value.replaceAll(/\D/g, "");
}
export function toNonNegativeInt(value) {
    const n = typeof value === "number" ? value : Number(keepDigits(value));
    if (Number.isNaN(n))
        return 0;
    return Math.max(0, Math.round(n));
}
export function clampInt(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function toBoundedNonNegativeInt(value, max) {
    return clampInt(toNonNegativeInt(value), 0, max);
}
export function toWindDirection(value) {
    const n = toNonNegativeInt(value);
    return Math.max(0, Math.min(360, Math.round(n / 10) * 10));
}
export function toNullableNonNegativeInt(value) {
    if (value === "")
        return null;
    const parsed = typeof value === "number" ? value : Number(keepDigits(value));
    if (Number.isNaN(parsed))
        return null;
    return Math.max(0, Math.round(parsed));
}
export function sanitizeNumericInput(raw) {
    return keepDigits(raw);
}
