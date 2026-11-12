export const TIMELINE_HOURS = 24;
export function getTimelineHours(startHour) {
    return Array.from({ length: TIMELINE_HOURS }, (_, index) => (startHour + index) % 24);
}
/** Position of a stored hour value (0–47) on a timeline that starts at `startHour`. */
export function hourToIndex(hour, startHour) {
    return (((hour % 24) - startHour) % 24 + 24) % 24;
}
/**
 * Stored hour value for a timeline position. Values past midnight are kept above 24
 * so the TAF generator can place them on the following day.
 */
export function indexToHour(index, startHour) {
    return startHour + index;
}
export function formatHour(hour) {
    return String(((hour % 24) + 24) % 24).padStart(2, "0");
}
/** Visible range of a change on the timeline. FM groups run until the next FM group or the end of validity. */
export function getChangeRange(change, changes, startHour) {
    const start = hourToIndex(Number(change.from), startHour);
    if (change.type === "FM") {
        const nextStarts = changes
            .filter((other) => other !== change && other.type === "FM")
            .map((other) => hourToIndex(Number(other.from), startHour))
            .filter((index) => index > start);
        return { start, end: nextStarts.length ? Math.min(...nextStarts) : TIMELINE_HOURS };
    }
    let end = hourToIndex(Number(change.to), startHour);
    if (end <= start)
        end += TIMELINE_HOURS;
    return { start, end: Math.min(end, TIMELINE_HOURS) };
}
export function rangesOverlap(a, b) {
    return a.start < b.end && b.start < a.end;
}
