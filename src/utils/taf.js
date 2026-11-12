import { getBaseForecastPeriod } from "./time";
import { formatWeatherState } from "./weather";
export function getForecastDateHour(baseIssueTime, hour) {
    const baseDay = Number(baseIssueTime.slice(0, 2));
    const baseHour = Number(baseIssueTime.slice(2, 4));
    let h = typeof hour === "string" ? Number(hour) : hour;
    let day = baseDay;
    if (h < baseHour) {
        day = baseDay + 1;
    }
    if (h >= 24) {
        day += Math.floor(h / 24);
        h %= 24;
    }
    return `${String(day).padStart(2, "0")}${String(h).padStart(2, "0")}`;
}
export function hasIncludedBlocks(change) {
    const eb = change.state.enabledBlocks;
    return eb ? Boolean(eb.wind || eb.vis || eb.clouds) : true;
}
export function generateTAFLines(taf) {
    const { from: baseFrom, to: baseTo } = getBaseForecastPeriod(taf.issueTime);
    const header = `TAF ${taf.station} ${taf.issueTime}Z ${baseFrom}/${baseTo}`;
    const baseLine = formatWeatherState({ ...taf.base, enabledBlocks: { wind: true, vis: true, clouds: true } }, true);
    const lines = [{ text: `${header} ${baseLine}`, changeIndex: null }];
    (taf.changes || []).forEach((c, changeIndex) => {
        if (!hasIncludedBlocks(c))
            return;
        if (c.type === "FM") {
            lines.push({ text: `FM${getForecastDateHour(taf.issueTime, c.from)}00 ${formatWeatherState(c.state)}`, changeIndex });
            return;
        }
        const fromTime = getForecastDateHour(taf.issueTime, c.from);
        const toTime = getForecastDateHour(taf.issueTime, c.to);
        lines.push({ text: `${c.type} ${fromTime}/${toTime} ${formatWeatherState(c.state)}`, changeIndex });
    });
    return lines;
}
export function generateTAF(taf) {
    return generateTAFLines(taf).map((line) => line.text).join("\n");
}
export function addChange(taf, type, from, to) {
    let defaultState = taf.base;
    for (let i = taf.changes.length - 1; i >= 0; i -= 1) {
        if (taf.changes[i].type === "BECMG") {
            defaultState = taf.changes[i].state;
            break;
        }
    }
    const deepCopyState = {
        wind: { ...defaultState.wind },
        visibility: defaultState.visibility,
        weather: [...(defaultState.weather || [])],
        clouds: (defaultState.clouds || []).map((cloud) => ({ ...cloud })),
        enabledBlocks: { wind: false, vis: false, clouds: false },
    };
    const newChange = {
        type,
        from: String(from),
        to: String(to),
        state: deepCopyState,
    };
    const updatedChanges = [...taf.changes, newChange];
    return { taf: { ...taf, changes: updatedChanges }, index: updatedChanges.length - 1 };
}
export function addTempo(taf, from, to) {
    return addChange(taf, "TEMPO", from, to);
}
