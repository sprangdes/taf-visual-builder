import type { TAF, TAFChange, WeatherState, WeatherTrendType } from "../types/taf";
import { getBaseForecastPeriod } from "./time";
import { formatWeatherState } from "./weather";

export function getForecastDateHour(baseIssueTime: string, hour: string | number): string {
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

export function hasIncludedBlocks(change: TAFChange): boolean {
  const eb = change.state.enabledBlocks;
  return eb ? Boolean(eb.wind || eb.vis || eb.clouds) : true;
}

export interface TafLine {
  text: string;
  /** Index into `taf.changes`, or null for the header/base line. */
  changeIndex: number | null;
}

export function generateTAFLines(taf: TAF): TafLine[] {
  const { from: baseFrom, to: baseTo } = getBaseForecastPeriod(taf.issueTime);
  const header = `TAF ${taf.station} ${taf.issueTime}Z ${baseFrom}/${baseTo}`;
  const baseLine = formatWeatherState(
    { ...taf.base, enabledBlocks: { wind: true, vis: true, clouds: true } },
    true,
  );

  const lines: TafLine[] = [{ text: `${header} ${baseLine}`, changeIndex: null }];
  (taf.changes || []).forEach((c, changeIndex) => {
    if (!hasIncludedBlocks(c)) return;
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

export function generateTAF(taf: TAF): string {
  return generateTAFLines(taf).map((line) => line.text).join("\n");
}

export function addChange(
  taf: TAF,
  type: WeatherTrendType,
  from: number,
  to: number,
): { taf: TAF; index: number } {
  let defaultState: WeatherState = taf.base;

  for (let i = taf.changes.length - 1; i >= 0; i -= 1) {
    if (taf.changes[i].type === "BECMG") {
      defaultState = taf.changes[i].state;
      break;
    }
  }

  const deepCopyState: WeatherState = {
    wind: { ...defaultState.wind },
    visibility: defaultState.visibility,
    weather: [...(defaultState.weather || [])],
    clouds: (defaultState.clouds || []).map((cloud) => ({ ...cloud })),
    enabledBlocks: { wind: false, vis: false, clouds: false },
  };

  const newChange: TAFChange = {
    type,
    from: String(from),
    to: String(to),
    state: deepCopyState,
  };

  const updatedChanges = [...taf.changes, newChange];
  return { taf: { ...taf, changes: updatedChanges }, index: updatedChanges.length - 1 };
}

export function addTempo(taf: TAF, from: number, to: number): { taf: TAF; index: number } {
  return addChange(taf, "TEMPO", from, to);
}
