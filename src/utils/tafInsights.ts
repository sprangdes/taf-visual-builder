import type { Translation } from "../features/i18n/translations";
import type { TAF, TAFChange, WeatherState } from "../types/taf";
import { hasIncludedBlocks } from "./taf";
import { getBaseForecastPeriod } from "./time";
import { formatHour } from "./timeline";
import { getWeatherGroups } from "./weather";

export type CheckLevel = "ok" | "warn" | "info";

export interface TafCheck {
  level: CheckLevel;
  message: string;
  changeIndex: number | null;
}

function formatDayHour(dayHour: string): string {
  return `${dayHour.slice(0, 2)}/${dayHour.slice(2, 4)}Z`;
}

export function describePeriod(change: TAFChange, copy: Translation["decode"]): string {
  const from = `${formatHour(Number(change.from))}Z`;
  const to = `${formatHour(Number(change.to))}Z`;
  if (change.type === "FM") return copy.period.FM(from);
  return copy.period[change.type](from, to);
}

export function describeBase(issueTime: string, copy: Translation["decode"]): string {
  const { from, to } = getBaseForecastPeriod(issueTime);
  return copy.period.base(formatDayHour(from), formatDayHour(to));
}

function isValidIssueTime(issueTime: string): boolean {
  if (!/^\d{6}$/.test(issueTime)) return false;
  const day = Number(issueTime.slice(0, 2));
  const hour = Number(issueTime.slice(2, 4));
  const minute = Number(issueTime.slice(4, 6));
  return day >= 1 && day <= 31 && hour < 24 && minute < 60;
}

function gustIsOmitted(state: WeatherState): boolean {
  const gust = state.wind?.gust;
  return typeof gust === "number" && gust > 0 && Math.round(gust) - Math.round(state.wind.speed) < 15;
}

export function getTafChecks(taf: TAF, text: Translation): TafCheck[] {
  const checks: TafCheck[] = [];
  const stationOk = /^[A-Z]{4}$/.test(taf.station.trim().toUpperCase());
  const timeOk = isValidIssueTime(taf.issueTime);
  if (!stationOk) checks.push({ level: "warn", message: text.checks.stationInvalid, changeIndex: null });
  if (!timeOk) checks.push({ level: "warn", message: text.checks.issueTimeInvalid, changeIndex: null });
  if (stationOk && timeOk) checks.push({ level: "ok", message: text.checks.contextOk, changeIndex: null });

  const periods: { label: string; state: WeatherState; vis: boolean; wind: boolean; changeIndex: number | null }[] = [
    { label: describeBase(taf.issueTime, text.decode), state: taf.base, vis: true, wind: true, changeIndex: null },
  ];
  const notices: TafCheck[] = [];
  taf.changes.forEach((change, changeIndex) => {
    const label = describePeriod(change, text.decode);
    if (!hasIncludedBlocks(change)) {
      notices.push({ level: "info", message: text.checks.emptyChange(label), changeIndex });
      return;
    }
    const eb = change.state.enabledBlocks ?? { wind: true, vis: true, clouds: true };
    periods.push({ label, state: change.state, vis: Boolean(eb.vis), wind: Boolean(eb.wind), changeIndex });
  });

  let visibilityProblem = false;
  for (const period of periods) {
    if (period.vis && period.state.visibility <= 5000 && getWeatherGroups(period.state.weather).length === 0) {
      visibilityProblem = true;
      checks.push({ level: "warn", message: text.checks.visibilityNeedsWeather(period.label), changeIndex: period.changeIndex });
    }
    if (period.wind && gustIsOmitted(period.state)) {
      notices.push({
        level: "info",
        message: text.checks.gustOmitted(period.label, Math.round(period.state.wind.gust ?? 0), Math.round(period.state.wind.speed)),
        changeIndex: period.changeIndex,
      });
    }
  }
  if (!visibilityProblem) checks.push({ level: "ok", message: text.checks.visibilityOk, changeIndex: null });

  return [...checks, ...notices];
}

function describeWeatherGroup(group: string, copy: Translation["decode"]): string {
  let rest = group;
  const parts: string[] = [];
  for (const prefix of ["VC", "-", "+"] as const) {
    if (rest.startsWith(prefix)) {
      parts.push(copy.intensity[prefix]);
      rest = rest.slice(prefix.length);
    }
  }
  for (let i = 0; i < rest.length; i += 2) {
    const code = rest.slice(i, i + 2);
    parts.push(copy.phenomena[code] ?? code);
  }
  return copy.joinPhenomena(parts);
}

function describeState(
  state: WeatherState,
  include: { wind: boolean; vis: boolean; clouds: boolean },
  copy: Translation["decode"],
): string[] {
  const parts: string[] = [];
  if (include.wind) {
    const { dir, speed, gust } = state.wind;
    if (speed === 0 && (dir === 0 || dir === 360)) {
      parts.push(copy.calm);
    } else {
      const direction = copy.compass[Math.round((dir % 360) / 22.5) % 16];
      const showGust = typeof gust === "number" && gust - speed >= 15 ? gust : null;
      parts.push(copy.wind(direction, speed, showGust));
    }
  }
  if (include.vis) {
    parts.push(state.visibility >= 9999 ? copy.visibilityTenKm : copy.visibility(state.visibility.toLocaleString("en-US")));
    const weather = getWeatherGroups(state.weather).map((group) => describeWeatherGroup(group, copy));
    if (weather.length) parts.push(copy.list(weather));
  }
  if (include.clouds && state.clouds?.length) {
    parts.push(
      copy.list(
        state.clouds.map((cloud) =>
          copy.cloud(copy.amounts[cloud.amount] ?? cloud.amount, (cloud.height * 100).toLocaleString("en-US"), Boolean(cloud.cb), Boolean(cloud.tcu)),
        ),
      ),
    );
  }
  return parts;
}

export interface TafSummaryLine {
  type: "BASE" | TAFChange["type"];
  text: string;
  changeIndex: number | null;
}

export function getTafSummary(taf: TAF, copy: Translation["decode"]): TafSummaryLine[] {
  const lines: TafSummaryLine[] = [
    {
      type: "BASE",
      text: copy.sentence(describeBase(taf.issueTime, copy), describeState(taf.base, { wind: true, vis: true, clouds: true }, copy)),
      changeIndex: null,
    },
  ];
  taf.changes.forEach((change, changeIndex) => {
    if (!hasIncludedBlocks(change)) return;
    const eb = change.state.enabledBlocks ?? { wind: true, vis: true, clouds: true };
    const parts = describeState(change.state, { wind: Boolean(eb.wind), vis: Boolean(eb.vis), clouds: Boolean(eb.clouds) }, copy);
    lines.push({ type: change.type, text: copy.sentence(describePeriod(change, copy), parts), changeIndex });
  });
  return lines;
}
