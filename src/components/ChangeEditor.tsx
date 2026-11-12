import { visibilityOptions } from "../constants/weather";
import type {
  BaseForecast,
  EditableBlockKey,
  TAFChange,
  WeatherState,
  WeatherTrendType,
  Wind,
} from "../types/taf";
import { toBoundedNonNegativeInt, toWindDirection } from "../utils/number";
import {
  TIMELINE_HOURS,
  formatHour,
  getChangeRange,
  getTimelineHours,
  indexToHour,
  rangesOverlap,
} from "../utils/timeline";
import {
  createCloudLayer,
  emptyWeather,
  formatClouds,
  formatVisibility,
  getWeatherGroups,
} from "../utils/weather";
import CloudSection from "./CloudSection";
import VisibilitySection from "./VisibilitySection";
import WindSection from "./WindSection";
import { useLanguage } from "../features/i18n/LanguageContext";

const TYPES: WeatherTrendType[] = ["TEMPO", "BECMG", "FM"];

function nearestVisibility(val: number): number {
  return visibilityOptions.reduce(
    (prev, curr) => (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev),
    visibilityOptions[0],
  );
}

interface ChangeEditorProps {
  change: TAFChange | BaseForecast;
  /** Base forecast weather, used to show what an excluded section falls back to. */
  base: WeatherState;
  periodLabel: string;
  startHour: number;
  changes: readonly TAFChange[];
  onUpdate: (updated: TAFChange | BaseForecast) => void;
  onDelete?: () => void;
  onChangeType?: (type: WeatherTrendType) => void;
}

export default function ChangeEditor({
  change,
  base,
  periodLabel,
  startHour,
  changes,
  onUpdate,
  onDelete,
  onChangeType,
}: Readonly<ChangeEditorProps>) {
  const { text } = useLanguage();
  const isBase = !("type" in change);
  const enabledBlocks = change.state.enabledBlocks ?? {};
  const windEnabled = isBase || Boolean(enabledBlocks.wind);
  const visEnabled = isBase || Boolean(enabledBlocks.vis);
  const cloudEnabled = isBase || Boolean(enabledBlocks.clouds);

  const state = emptyWeather(change.state);
  const clouds = state.clouds.length > 0 ? state.clouds : [createCloudLayer({ amount: "FEW", height: 0 })];
  const weatherArr = state.weather || [];

  const updateChangeState = (patch: Partial<WeatherState>) => {
    onUpdate({ ...change, state: { ...change.state, ...patch } });
  };

  const setBlockEnabled = (block: EditableBlockKey, enabled: boolean) => {
    updateChangeState({ enabledBlocks: { ...enabledBlocks, [block]: enabled } });
  };

  const currentClouds = () =>
    change.state.clouds && change.state.clouds.length > 0
      ? change.state.clouds.map((c) => (c.id ? c : createCloudLayer(c)))
      : [createCloudLayer({ amount: "FEW", height: 0 })];

  const updateWind = (field: keyof Wind, value: number | string) => {
    const nextWind: Wind = { ...(change.state.wind || { dir: 0, speed: 0, gust: null }) };
    if (field === "dir") nextWind.dir = toWindDirection(value);
    if (field === "speed") nextWind.speed = toBoundedNonNegativeInt(value, 99);
    if (field === "gust") nextWind.gust = value === "" ? null : toBoundedNonNegativeInt(value, 99);
    updateChangeState({ wind: nextWind });
  };

  const updateCloud = (id: string, field: "amount" | "height" | "cb" | "tcu", value: string | number | boolean) => {
    const nextClouds = currentClouds().map((c) => {
      if (c.id !== id) return c;
      const target = { ...c };
      if (field === "amount") target.amount = String(value);
      if (field === "height") target.height = toBoundedNonNegativeInt(value as string | number, 999);
      if (field === "cb") {
        target.cb = Boolean(value);
        if (target.cb) target.tcu = false;
      }
      if (field === "tcu") {
        target.tcu = Boolean(value);
        if (target.tcu) target.cb = false;
      }
      return target;
    });
    updateChangeState({ clouds: nextClouds });
  };

  const addCloud = () => updateChangeState({ clouds: [...currentClouds(), createCloudLayer({ amount: "FEW", height: 0 })] });

  const removeCloud = (id: string) => {
    const prev = currentClouds();
    if (prev.length <= 1) return;
    updateChangeState({ clouds: prev.filter((c) => c.id !== id) });
  };

  const hours = getTimelineHours(startHour);
  const trend = isBase ? null : (change as TAFChange);
  const range = trend ? getChangeRange(trend, changes, startHour) : null;

  const typeConflicts = (type: WeatherTrendType) => {
    if (!trend || !range) return false;
    const candidate = type === "FM" || trend.type === "FM" ? { start: range.start, end: range.start + 1 } : range;
    return changes.some(
      (other) => other !== trend && other.type === type && rangesOverlap(getChangeRange(other, changes, startHour), candidate),
    );
  };

  const setRange = (start: number, end: number) => {
    if (!trend) return;
    const safeEnd = Math.min(TIMELINE_HOURS, Math.max(end, start + 1));
    onUpdate({ ...trend, from: String(indexToHour(start, startHour)), to: String(indexToHour(safeEnd, startHour)) });
  };

  const baseVisCode = [formatVisibility(base.visibility), ...getWeatherGroups(base.weather || [])].join(" ");

  return (
    <div className="period-editor">
      <div className="period-editor-header">
        {trend && range ? (
          <div className="period-controls">
            <div className="segmented" role="group" aria-label={text.actions.changeType} data-tour-id="change-type">
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={trend.type === type}
                  disabled={trend.type !== type && typeConflicts(type)}
                  title={trend.type !== type && typeConflicts(type) ? text.editor.typeConflict(type) : undefined}
                  className={`type-option type-option--${type.toLowerCase()} ${trend.type === type ? "is-on" : ""}`}
                  onClick={() => onChangeType?.(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="period-range">
              <label className="time-select">
                <span className="visually-hidden">{text.editor.from}</span>
                <select value={range.start} onChange={(e) => setRange(Number(e.target.value), range.end)}>
                  {hours.map((hour, index) => (
                    <option key={hour} value={index}>{formatHour(hour)}Z</option>
                  ))}
                </select>
              </label>
              <span aria-hidden="true">→</span>
              {trend.type === "FM" ? (
                <span className="period-range-end">{text.timeline.untilEnd}</span>
              ) : (
                <label className="time-select">
                  <span className="visually-hidden">{text.editor.to}</span>
                  <select value={range.end} onChange={(e) => setRange(range.start, Number(e.target.value))}>
                    {hours.map((_, index) => {
                      const boundary = index + 1;
                      return (
                        <option key={boundary} value={boundary} disabled={boundary <= range.start}>
                          {formatHour(startHour + boundary)}Z
                        </option>
                      );
                    })}
                  </select>
                </label>
              )}
            </div>
            <p className="period-note">{text.editor.note}</p>
          </div>
        ) : (
          <div className="period-controls">
            <span className="period-badge">BASE</span>
            <span className="period-range-text">{periodLabel}</span>
          </div>
        )}
        {onDelete && (
          <button type="button" className="change-delete-button" onClick={onDelete}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
            {text.actions.deleteChange}
          </button>
        )}
      </div>

      <div className="condition-grid">
        <WindSection
          isBase={isBase}
          windEnabled={windEnabled}
          wind={state.wind}
          baseWind={base.wind}
          onSetEnabled={(enabled) => setBlockEnabled("wind", enabled)}
          onUpdateWind={updateWind}
        />
        <VisibilitySection
          isBase={isBase}
          visEnabled={visEnabled}
          visibility={state.visibility}
          weatherArr={weatherArr}
          baseCode={baseVisCode}
          showError={state.visibility <= 5000 && weatherArr.length === 0}
          minVis={50}
          maxVis={10000}
          onSetEnabled={(enabled) => setBlockEnabled("vis", enabled)}
          onUpdateVisibility={(value) => updateChangeState({ visibility: nearestVisibility(Number(value)) })}
          onAddWeather={(w) => updateChangeState({ weather: [...(change.state.weather || []), w] })}
          onRemoveWeather={(idx) => {
            const arr = [...(change.state.weather || [])];
            arr.splice(idx, 1);
            updateChangeState({ weather: arr });
          }}
        />
        <CloudSection
          isBase={isBase}
          cloudEnabled={cloudEnabled}
          clouds={clouds}
          baseCode={formatClouds(base.clouds || [])}
          onSetEnabled={(enabled) => setBlockEnabled("clouds", enabled)}
          onUpdateCloud={updateCloud}
          onAddCloud={addCloud}
          onRemoveCloud={removeCloud}
        />
      </div>
    </div>
  );
}
