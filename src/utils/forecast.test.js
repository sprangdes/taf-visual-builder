import { describe, expect, it } from "vitest";
import { en, zhTW } from "../features/i18n/translations";
import { addChange, generateTAF, generateTAFLines } from "./taf";
import { getTafChecks, getTafSummary } from "./tafInsights";
import { getChangeRange, hourToIndex, indexToHour } from "./timeline";
import { getEffectiveState, getWeatherGroups } from "./weather";
import { getWeatherSceneParams } from "./weatherScene";
function include(taf) {
    return { ...taf, changes: taf.changes.map((c) => ({ ...c, state: { ...c.state, enabledBlocks: { wind: true, vis: true, clouds: true } } })) };
}
function makeTaf(changes = []) {
    return {
        station: "RCTP",
        issueTime: "121121",
        base: {
            wind: { dir: 240, speed: 15, gust: null },
            visibility: 10000,
            weather: [],
            clouds: [{ id: "a", amount: "FEW", height: 20 }],
        },
        changes,
    };
}
const storm = {
    type: "TEMPO",
    from: "15",
    to: "18",
    state: {
        wind: { dir: 240, speed: 15, gust: 30 },
        visibility: 3000,
        weather: ["-", "TS", "RA"],
        clouds: [{ id: "b", amount: "BKN", height: 30, cb: true }],
        enabledBlocks: { wind: true, vis: true, clouds: true },
    },
};
describe("timeline positions", () => {
    it("keeps hours after midnight on the following day", () => {
        expect(hourToIndex(12, 12)).toBe(0);
        expect(hourToIndex(3, 12)).toBe(15);
        expect(indexToHour(15, 12)).toBe(27);
        const taf = addChange(makeTaf(), "TEMPO", indexToHour(15, 12), indexToHour(18, 12)).taf;
        expect(generateTAF(include(taf))).toContain("TEMPO 1303/1306");
    });
    it("ends a change at the validity boundary on the next day", () => {
        const taf = addChange(makeTaf(), "BECMG", indexToHour(22, 12), indexToHour(24, 12)).taf;
        expect(generateTAF(include(taf))).toContain("BECMG 1310/1312");
    });
    it("extends FM groups until the next FM group", () => {
        const first = { ...storm, type: "FM", from: "18", to: "18" };
        const second = { ...storm, type: "FM", from: "27", to: "27" };
        expect(getChangeRange(first, [first, second], 12)).toEqual({ start: 6, end: 15 });
        expect(getChangeRange(second, [first, second], 12)).toEqual({ start: 15, end: 24 });
        expect(generateTAF(makeTaf([second]))).toContain("FM130300");
    });
    it("maps generated lines back to their change", () => {
        const empty = { ...storm, state: { ...storm.state, enabledBlocks: { wind: false, vis: false, clouds: false } } };
        const lines = generateTAFLines(makeTaf([empty, storm]));
        expect(lines.map((line) => line.changeIndex)).toEqual([null, 1]);
        expect(lines[1].text).toBe("TEMPO 1215/1218 24015G30KT 3000 -TSRA BKN030CB");
    });
});
describe("weather helpers", () => {
    it("groups weather tokens and applies included sections over the base", () => {
        expect(getWeatherGroups(["-", "TS", "RA", " ", "BR"])).toEqual(["-TSRA", "BR"]);
        const partial = { ...storm, state: { ...storm.state, enabledBlocks: { wind: false, vis: true, clouds: false } } };
        const effective = getEffectiveState(makeTaf().base, partial);
        expect(effective.wind.gust).toBeNull();
        expect(effective.visibility).toBe(3000);
        expect(effective.clouds[0].amount).toBe("FEW");
    });
});
describe("weather scene", () => {
    it("renders a thunderstorm as dark, rainy and slanted downwind", () => {
        const params = getWeatherSceneParams(storm.state);
        expect(params.thunder).toBe(true);
        expect(params.precipitation).toEqual({ kind: "rain", intensity: 0, showers: false });
        expect(params.darkness).toBeGreaterThan(0.6);
        expect(params.layers[0].convective).toBe(true);
        expect(params.fog).toBeGreaterThan(0);
        expect(params.slant).toBeGreaterThan(0);
    });
    it("renders fair weather as a bright sky without precipitation", () => {
        const params = getWeatherSceneParams(makeTaf().base);
        expect(params.thunder).toBe(false);
        expect(params.precipitation).toBeNull();
        expect(params.fog).toBe(0);
        expect(params.darkness).toBeLessThan(0.2);
    });
    it("treats fog and snow as their own phenomena", () => {
        const params = getWeatherSceneParams({ ...storm.state, visibility: 9000, weather: ["+", "SN", " ", "FG"], clouds: [] });
        expect(params.precipitation).toEqual({ kind: "snow", intensity: 2, showers: false });
        expect(params.fog).toBeGreaterThanOrEqual(0.75);
    });
});
describe("TAF insights", () => {
    it("reports omitted gusts, empty changes and visibility conflicts", () => {
        const gusty = { ...storm, type: "BECMG", from: "20", to: "22", state: { ...storm.state, wind: { dir: 300, speed: 10, gust: 20 }, visibility: 4000, weather: [] } };
        const empty = { ...storm, state: { ...storm.state, enabledBlocks: { wind: false, vis: false, clouds: false } } };
        const checks = getTafChecks(makeTaf([gusty, empty]), en);
        const messages = checks.map((check) => check.message);
        expect(messages).toContain("Becoming 20Z–22Z: visibility 5000 m or below needs a weather phenomenon.");
        expect(messages).toContain("Becoming 20Z–22Z: gust 20 KT is less than 15 KT above 10 KT, so no G group is output.");
        expect(messages).toContain("Temporarily 15Z–18Z: no sections are included, so this change is omitted.");
        expect(messages).toContain("Station code and issue time are complete.");
    });
    it("flags an incomplete station code", () => {
        const checks = getTafChecks({ ...makeTaf(), station: "RC" }, en);
        expect(checks[0]).toMatchObject({ level: "warn", message: "Enter a 4-letter ICAO station code." });
    });
    it("decodes the forecast in plain language", () => {
        const summary = getTafSummary(makeTaf([storm]), en.decode).map((line) => line.text);
        expect(summary[0]).toBe("12/12Z–13/12Z: west-southwest wind 15 KT; visibility 10 km or more; few 2,000 ft.");
        expect(summary[1]).toBe("Temporarily 15Z–18Z: west-southwest wind 15 KT, gusting 30 KT; visibility 3,000 m; light thunderstorm rain; broken 3,000 ft cumulonimbus.");
        const zh = getTafSummary(makeTaf([storm]), zhTW.decode).map((line) => line.text);
        expect(zh[1]).toBe("15Z–18Z 短暫：西南西風 15 KT，陣風 30 KT，能見度 3,000 公尺，弱雷暴雨，裂雲 3,000 呎（積雨雲）。");
    });
});
