import { weatherOptions } from "../constants/weather";

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
      className={`taf-block condition-block visibility-block ${
        visEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"
      }`}
    >
      {!isBase && visEnabled && (
        <button
          type="button"
          aria-label="Deactivate visibility and weather"
          onClick={() => onSetEnabled(false)}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
          style={{ zIndex: 20 }}
        >
          X
        </button>
      )}
      {!visEnabled && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
          <button
            type="button"
            onClick={() => onSetEnabled(true)}
            className="bg-gray-800 text-white px-3 py-1 rounded-lg text-xs sm:text-sm cursor-pointer"
          >
            Active Visibility/Weather to Edit
          </button>
        </div>
      )}
      <label htmlFor="visibility" className="block text-sm">
        <div className="flex flex-wrap items-center gap-1">
          <span id="visibility-label">Visibility</span>
          <span className="visibility-value ml-2 text-[14px] font-medium text-gray-800">
            {visibility} m
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
            style={{ zIndex: 1 }}
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
              className={`px-2 py-1 rounded-lg border border-slate-200 ${opt.color} text-black cursor-pointer`}
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
                className={`inline-flex items-center justify-center h-6 leading-none ${bgClass} text-black px-2 py-0 rounded-lg border border-slate-200 ${
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
      {!visEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-lg" />}
    </div>
  );
}
