import type { TAF, TAFChange, WeatherState } from "../types/taf";
import { getBaseForecastPeriod } from "./time";
import { formatWeatherState } from "./weather";

function getForecastDateHour(baseIssueTime: string, hour: string | number): string {
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

export function generateTAF(taf: TAF): string {
  const { from: baseFrom, to: baseTo } = getBaseForecastPeriod(taf.issueTime);
  const header = `TAF ${taf.station} ${taf.issueTime}Z ${baseFrom}/${baseTo}`;
  const baseLine = `${formatWeatherState(
    { ...taf.base, enabledBlocks: { wind: true, vis: true, clouds: true } },
    true,
  )}`;

  const changes = (taf.changes || [])
    .filter((c) => {
      const eb = c.state.enabledBlocks;
      return eb ? eb.wind || eb.vis || eb.clouds : true;
    })
    .map((c) => {
      if (c.type === "FM") {
        const h = Number(c.from);
        let day = Number(taf.issueTime.slice(0, 2));
        const baseHour = Number(taf.issueTime.slice(2, 4));
        if (h < baseHour) day += 1;
        const dd = String(day).padStart(2, "0");
        const hh = String(h).padStart(2, "0");
        const fmTime = `${dd}${hh}00`;
        return `FM${fmTime} ${formatWeatherState(c.state)}`;
      }

      const fromTime = getForecastDateHour(taf.issueTime, c.from);
      const toTime = getForecastDateHour(taf.issueTime, c.to);
      return `${c.type} ${fromTime}/${toTime} ${formatWeatherState(c.state)}`;
    })
    .join("\n");

  return [header + " " + baseLine, changes].filter(Boolean).join("\n");
}

export function addTempo(taf: TAF, from: number, to: number): { taf: TAF; index: number } {
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
    type: "TEMPO",
    from: String(from),
    to: String(to),
    state: deepCopyState,
  };

  const updatedChanges = [...taf.changes, newChange];
  return { taf: { ...taf, changes: updatedChanges }, index: updatedChanges.length - 1 };
}
