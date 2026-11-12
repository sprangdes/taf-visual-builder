const HOUR = 3_600_000;
const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC. */
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value * 50) / 50;
/** UTC instant of a stored forecast hour (values below the issue hour or ≥ 24 fall on later days). */
export function getForecastInstant(issueTime, hour, now = new Date()) {
    const issueDay = Number(issueTime.slice(0, 2)) || now.getUTCDate();
    const issueHour = Number(issueTime.slice(2, 4)) || 0;
    let year = now.getUTCFullYear();
    let month = now.getUTCMonth();
    // An issue day far ahead of today belongs to the previous month (e.g. issued on the 31st, viewed on the 1st).
    if (issueDay - now.getUTCDate() > 15)
        month -= 1;
    if (now.getUTCDate() - issueDay > 15)
        month += 1;
    if (month < 0) {
        month = 11;
        year -= 1;
    }
    if (month > 11) {
        month = 0;
        year += 1;
    }
    const h = hour < issueHour ? hour + 24 : hour;
    return new Date(Date.UTC(year, month, issueDay) + h * HOUR);
}
/** Middle of a change period (FM groups use their first hour). */
export function getChangeInstant(issueTime, change, now = new Date()) {
    const from = getForecastInstant(issueTime, Number(change.from), now);
    if (change.type === "FM")
        return new Date(from.getTime() + HOUR / 2);
    let to = getForecastInstant(issueTime, Number(change.to), now);
    if (to.getTime() <= from.getTime())
        to = new Date(to.getTime() + 24 * HOUR);
    return new Date((from.getTime() + to.getTime()) / 2);
}
export function getMoonAge(date) {
    const days = (date.getTime() - NEW_MOON_EPOCH) / (24 * HOUR);
    return ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
}
/** Daylight at a moment, in the browser's local time zone. */
export function getDaylight(date) {
    const hour = date.getHours() + date.getMinutes() / 60;
    const sun = Math.sin((Math.PI * (hour - 6)) / 12);
    const night = clamp((-0.05 - sun) / 0.25);
    const twilight = sun < 0.35 ? clamp(1 - Math.abs(sun - 0.02) / 0.3) : 0;
    let phase = "day";
    if (night >= 0.5)
        phase = "night";
    else if (twilight >= 0.5)
        phase = hour < 12 ? "dawn" : "dusk";
    const age = getMoonAge(date);
    const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
    // The moon rises roughly 50 minutes later each day after new moon.
    const moonrise = 6 + (age / SYNODIC_MONTH) * 24;
    const moonHeight = Math.sin((Math.PI * (hour - moonrise)) / 12);
    const moonProgress = ((((hour - moonrise) % 24) + 24) % 24) / 12;
    return {
        phase,
        sun: round(sun),
        sunX: round(clamp((hour - 6) / 12)),
        twilight: round(twilight),
        night: round(night),
        moon: moonHeight > 0.05 && illumination > 0.03
            ? { x: round(clamp(moonProgress, 0.08, 0.92)), height: round(moonHeight), illumination: round(illumination), waxing: age < SYNODIC_MONTH / 2 }
            : null,
    };
}
export function formatLocalTime(date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
