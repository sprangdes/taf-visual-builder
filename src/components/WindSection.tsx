import type { Wind } from "../types/taf";
import NumericControl from "./inputs/NumericControl";

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
  return (
    <div
      id="tour-wind"
      className={`taf-block condition-block wind-block ${windEnabled ? "" : "is-inactive"}`}
    >
      {!isBase && windEnabled && (
        <button
          type="button"
          aria-label="Deactivate wind"
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
            aria-label="Activate wind to edit"
            onClick={() => onSetEnabled(true)}
            className="condition-block-activate"
          >
            <span className="condition-block-activate-icon" aria-hidden="true">+</span>
            <span className="condition-block-activate-copy">
              <strong>Activate wind</strong>
              <small>Include this section in the change</small>
            </span>
          </button>
        </div>
      )}
      <h4 className="condition-block-title">
        <span className="condition-block-icon" aria-hidden="true">↗</span>
        Wind
      </h4>
      <label className="text-sm flex flex-wrap items-center gap-2">
        <span className="inline-block w-24 sm:w-28">Wind Direction</span>
        <NumericControl
          value={wind.dir}
          min={0}
          max={360}
          step={10}
          onChange={(value) => onUpdateWind("dir", value)}
        />
        <span className="text-sm">°</span>
      </label>
      <label className="text-sm flex flex-wrap items-center gap-2">
        <span className="inline-block w-24 sm:w-28">Wind Speed</span>
        <NumericControl
          value={wind.speed}
          min={0}
          max={99}
          step={1}
          formatValue={(v) => String(v).padStart(2, "0")}
          onChange={(value) => onUpdateWind("speed", value)}
        />
        <span className="text-sm">KT</span>
      </label>
      <label className="text-sm flex flex-wrap items-center gap-2">
        <span className="inline-block w-24 sm:w-28">Wind Gust</span>
        <NumericControl
          value={wind.gust ?? 0}
          min={0}
          max={99}
          step={1}
          formatValue={(v) => String(v).padStart(2, "0")}
          onChange={(value) => onUpdateWind("gust", value)}
        />
        <span className="text-sm">KT</span>
      </label>
    </div>
  );
}
