import type { CSSProperties } from "react";
import { weatherGroups } from "../constants/weather";
import { useLanguage } from "../features/i18n/LanguageContext";
import { formatVisibility, getWeatherGroups } from "../utils/weather";
import ConditionCard from "./ConditionCard";

interface VisibilitySectionProps {
  isBase: boolean;
  visEnabled: boolean;
  visibility: number;
  weatherArr: string[];
  baseCode: string;
  showError: boolean;
  minVis: number;
  maxVis: number;
  onSetEnabled: (enabled: boolean) => void;
  onUpdateVisibility: (value: number) => void;
  onAddWeather: (weatherCode: string) => void;
  onRemoveWeather: (index: number) => void;
}

export default function VisibilitySection({
  isBase,
  visEnabled,
  visibility,
  weatherArr,
  baseCode,
  showError,
  minVis,
  maxVis,
  onSetEnabled,
  onUpdateVisibility,
  onAddWeather,
  onRemoveWeather,
}: Readonly<VisibilitySectionProps>) {
  const { language, text } = useLanguage();
  const locale = language === "zh-TW" ? "zh-TW" : "en-US";
  const label = (code: string) => (code === " " ? text.conditions.space : code);
  const output = [formatVisibility(visibility), ...getWeatherGroups(weatherArr)].join(" ");

  return (
    <ConditionCard
      tourId="visibility"
      className="visibility-card"
      title={text.conditions.visibilityWeather}
      isBase={isBase}
      enabled={visEnabled}
      onSetEnabled={onSetEnabled}
      output={output}
      inherited={baseCode}
    >
      <label htmlFor={isBase ? "visibility-base" : "visibility-change"} className="visibility-slider">
        <span className="visibility-summary">
          <span className="visually-hidden">{text.conditions.visibility}</span>
          <span className="visibility-value">{visibility.toLocaleString(locale)} <small>m</small></span>
          <span className="visibility-context">{text.conditions.maximum(maxVis.toLocaleString(locale))}</span>
        </span>
        <input
          id={isBase ? "visibility-base" : "visibility-change"}
          aria-label={text.conditions.visibility}
          type="range"
          min={minVis}
          max={maxVis}
          step={50}
          value={visibility}
          onChange={(e) => onUpdateVisibility(Number(e.target.value))}
          style={{ "--visibility-progress": `${((visibility - minVis) / (maxVis - minVis)) * 100}%` } as CSSProperties}
        />
      </label>

      <div className="weather-picker">
        {weatherGroups.map((group) => (
          <div key={group.id} className="weather-group">
            <span className="field-label">{text.editor.groups[group.id]}</span>
            <div className="weather-options">
              {group.codes.map((code) => (
                <button
                  key={code === " " ? "space" : code}
                  type="button"
                  className="weather-option chip"
                  onClick={() => onAddWeather(code)}
                  aria-label={text.conditions.addWeather(label(code))}
                >
                  {label(code)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="weather-selection" aria-label={text.conditions.weather}>
        <span className="field-label">{text.editor.selected}</span>
        <div className="weather-selection-tokens">
          {weatherArr.length === 0 && <span className="weather-selection-empty">—</span>}
          {weatherArr.map((w, idx) => (
            <button
              key={`${idx}-${w}-tag`}
              type="button"
              className="weather-selected-option chip is-on"
              onClick={() => onRemoveWeather(idx)}
              aria-label={text.conditions.removeWeather(label(w))}
            >
              {label(w)}
              <span aria-hidden="true" className="chip-remove">×</span>
            </button>
          ))}
        </div>
        {showError && (
          <span className="inline-error" role="alert">
            {text.conditions.visibilityError}
          </span>
        )}
      </div>
    </ConditionCard>
  );
}
