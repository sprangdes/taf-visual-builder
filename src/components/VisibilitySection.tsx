import { weatherOptions } from "../constants/weather";
import type { CSSProperties } from "react";

interface VisibilitySectionProps {
  isBase: boolean;
  visEnabled: boolean;
  visibility: number;
  weatherArr: string[];
  showError: boolean;
  weatherDisabled: boolean;
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
  showError,
  weatherDisabled,
  minVis,
  maxVis,
  onSetEnabled,
  onUpdateVisibility,
  onAddWeather,
  onRemoveWeather,
}: Readonly<VisibilitySectionProps>) {
  return (
    <div
      id="tour-visibility"
      className={`taf-block condition-block visibility-block ${visEnabled ? "" : "is-inactive"}`}
    >
      {!isBase && visEnabled && (
        <button
          type="button"
          aria-label="Deactivate visibility and weather"
          onClick={() => onSetEnabled(false)}
          className="condition-block-deactivate"
        >
          X
        </button>
      )}
      {!visEnabled && (
        <div className="condition-block-overlay">
          <button
            type="button"
            aria-label="Activate visibility and weather to edit"
            onClick={() => onSetEnabled(true)}
            className="condition-block-activate"
          >
            <span className="condition-block-activate-icon" aria-hidden="true">+</span>
            <span className="condition-block-activate-copy">
              <strong>Activate visibility &amp; weather</strong>
              <small>Include this section in the change</small>
            </span>
          </button>
        </div>
      )}
      <h4 className="condition-block-title">
        <span className="condition-block-icon" aria-hidden="true">◉</span>
        Visibility &amp; weather
      </h4>
      <label htmlFor="visibility" className="block text-sm">
        <div className="visibility-summary">
          <span id="visibility-label" className="visually-hidden">Visibility</span>
          <span className="visibility-value ml-2 text-[14px] font-medium text-gray-800">
            {visibility.toLocaleString("en-US")} m
          </span>
          <span className="visibility-context">
            {isBase
              ? `Maximum ${maxVis.toLocaleString("en-US")} m`
              : weatherArr.length > 0
                ? `Weather: ${weatherArr.join(" ")}`
                : ""}
          </span>
        </div>
        <div className="w-full mt-2">
          <input
            id="visibility"
            aria-labelledby="visibility-label"
            type="range"
            min={minVis}
            max={maxVis}
            step={50}
            className="w-full accent-gray-400"
            value={visibility}
            onChange={(e) => onUpdateVisibility(Number(e.target.value))}
            style={{
              "--visibility-progress": `${((visibility - minVis) / (maxVis - minVis)) * 100}%`,
              zIndex: 1,
            } as CSSProperties}
          />
        </div>
      </label>

      <div className="block text-sm">
        <div className="mb-1">Weather</div>
        <div className="weather-options">
          {weatherOptions.map((opt) => (
            <button
              key={opt.code === " " ? "space" : opt.code}
              type="button"
              className={`weather-option ${opt.color}`}
              onClick={() => onAddWeather(opt.code)}
              disabled={weatherDisabled}
              tabIndex={0}
              aria-label={`Add ${opt.code === " " ? "space" : opt.code}`}
            >
              {opt.code === " " ? (
                <span className="inline-block" style={{ minWidth: "3em" }}>
                  space
                </span>
              ) : (
                opt.code
              )}
            </button>
          ))}
        </div>

        <div className="selected-weather-box weather-selection">
          {weatherArr.map((w, idx) => {
            const opt = weatherOptions.find((o) => o.code === w);
            const bgClass = opt ? opt.color : "bg-white";
            return (
              <button
                key={`${idx}-${w}-tag`}
                type="button"
                className={`weather-selected-option ${bgClass} ${
                  w === " " ? "font-mono" : ""
                }`}
                onClick={() => onRemoveWeather(idx)}
                aria-label={`Remove ${w === " " ? "space" : w}`}
              >
                {w === " " ? (
                  <span className="font-mono" style={{ minWidth: "3em" }}>
                    space
                  </span>
                ) : (
                  w
                )}
              </button>
            );
          })}
          {showError && (
            <span className="inline-error" role="alert">
              Visibility 5000m Or Below, Weather Must Be Selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
