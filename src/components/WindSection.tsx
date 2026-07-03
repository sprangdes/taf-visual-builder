import type { Wind } from "../types/taf";
import NumericControl from "./inputs/NumericControl";
import { useLanguage } from "../features/i18n/LanguageContext";

interface WindSectionProps {
  isBase: boolean;
  windEnabled: boolean;
  wind: Wind;
  onSetEnabled: (enabled: boolean) => void;
  onUpdateWind: (field: keyof Wind, value: number | string) => void;
}

export default function WindSection({
  isBase,
  windEnabled,
  wind,
  onSetEnabled,
  onUpdateWind,
}: Readonly<WindSectionProps>) {
  const { text } = useLanguage();
  return (
    <div
      data-tour-id="wind"
      className={`taf-block condition-block wind-block ${windEnabled ? "" : "is-inactive"}`}
    >
      {!isBase && windEnabled && (
        <button
          type="button"
          aria-label={text.conditions.deactivateWind}
          onClick={() => onSetEnabled(false)}
          className="condition-block-deactivate"
        >
          X
        </button>
      )}
      {!windEnabled && (
        <div className="condition-block-overlay">
          <button
            type="button"
            aria-label={text.conditions.activateWindAria}
            onClick={() => onSetEnabled(true)}
            className="condition-block-activate"
          >
            <span className="condition-block-activate-icon" aria-hidden="true">+</span>
            <span className="condition-block-activate-copy">
              <strong>{text.conditions.activateWind}</strong>
              <small>{text.conditions.includeInChange}</small>
            </span>
          </button>
        </div>
      )}
      <h4 className="condition-block-title">
        <span className="condition-block-icon" aria-hidden="true">↗</span>
        {text.conditions.wind}
      </h4>
      <label className="text-sm flex flex-wrap items-center gap-2">
        <span className="condition-field-label inline-block w-24 sm:w-28">{text.conditions.windDirection}</span>
        <NumericControl
          value={wind.dir}
          min={0}
          max={360}
          step={10}
          onChange={(value) => onUpdateWind("dir", value)}
        />
        <span className="condition-unit">°</span>
      </label>
      <label className="text-sm flex flex-wrap items-center gap-2">
        <span className="condition-field-label inline-block w-24 sm:w-28">{text.conditions.windSpeed}</span>
        <NumericControl
          value={wind.speed}
          min={0}
          max={99}
          step={1}
          formatValue={(v) => String(v).padStart(2, "0")}
          onChange={(value) => onUpdateWind("speed", value)}
        />
        <span className="condition-unit">KT</span>
      </label>
      <label className="text-sm flex flex-wrap items-center gap-2">
        <span className="condition-field-label inline-block w-24 sm:w-28">{text.conditions.windGust}</span>
        <NumericControl
          value={wind.gust ?? 0}
          min={0}
          max={99}
          step={1}
          formatValue={(v) => String(v).padStart(2, "0")}
          onChange={(value) => onUpdateWind("gust", value)}
        />
        <span className="condition-unit">KT</span>
      </label>
    </div>
  );
}
