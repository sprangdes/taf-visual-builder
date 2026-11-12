import { describe, expect, it } from "vitest";
import { getChangeInstant, getDaylight, getForecastInstant, getMoonAge } from "./daylight";
import { getSceneLight } from "./sceneLight";
const at = (hour, minute = 0) => new Date(2026, 10, 12, hour, minute);
describe("daylight", () => {
    it("moves through night, dawn, day and dusk over a local day", () => {
        expect(getDaylight(at(2)).phase).toBe("night");
        expect(getDaylight(at(6, 15)).phase).toBe("dawn");
        expect(getDaylight(at(12)).phase).toBe("day");
        expect(getDaylight(at(17, 45)).phase).toBe("dusk");
        expect(getDaylight(at(22)).phase).toBe("night");
        expect(getDaylight(at(9)).sunX).toBeLessThan(getDaylight(at(15)).sunX);
    });
    it("follows the lunar cycle", () => {
        const full = getDaylight(new Date("2024-01-25T17:54:00Z"));
        expect(getMoonAge(new Date("2024-01-11T11:57:00Z"))).toBeLessThan(0.5);
        const nearFullAge = getMoonAge(new Date("2024-01-25T17:54:00Z"));
        expect(nearFullAge).toBeGreaterThan(14);
        expect(nearFullAge).toBeLessThan(15.5);
        if (full.moon)
            expect(full.moon.illumination).toBeGreaterThan(0.95);
    });
    it("places forecast hours on the right UTC day", () => {
        const now = new Date("2026-11-12T12:00:00Z");
        expect(getForecastInstant("121121", 15, now).toISOString()).toBe("2026-11-12T15:00:00.000Z");
        expect(getForecastInstant("121121", 3, now).toISOString()).toBe("2026-11-13T03:00:00.000Z");
        expect(getForecastInstant("121121", 27, now).toISOString()).toBe("2026-11-13T03:00:00.000Z");
        expect(getForecastInstant("311800", 20, new Date("2026-11-01T02:00:00Z")).toISOString()).toBe("2026-10-31T20:00:00.000Z");
        const tempo = { type: "TEMPO", from: "15", to: "18", state: { wind: { dir: 0, speed: 0, gust: null }, visibility: 9999, weather: [], clouds: [] } };
        expect(getChangeInstant("121121", tempo, now).toISOString()).toBe("2026-11-12T16:30:00.000Z");
    });
    it("lights clouds with warm twilight and cool moonlight", () => {
        const dusk = getSceneLight(getDaylight(at(17, 45)), 0);
        const night = getSceneLight(getDaylight(at(23)), 0);
        const noon = getSceneLight(getDaylight(at(12)), 0);
        expect(noon.cloudLight).toBe("#ffffff");
        expect(Number.parseInt(dusk.cloudLight.slice(5, 7), 16)).toBeLessThan(200);
        expect(night.sky[0] < noon.sky[0]).toBe(true);
        expect(dusk.azimuth).toBeGreaterThan(noon.azimuth);
    });
});
