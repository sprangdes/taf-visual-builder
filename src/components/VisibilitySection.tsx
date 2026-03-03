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
      className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${
        visEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"
      }`}
    >
      {!isBase && visEnabled && (
        <button
          type="button"
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
            className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
          >
            Active Visibility/Weather to Edit
          </button>
        </div>
      )}
      <label htmlFor="visibility" className="block text-sm">
        <div className="flex items-center">
          <span id="visibility-label">Visibility</span>
          <span style={{ marginLeft: "8px", fontSize: "14px", fontWeight: 500, color: "#333" }}>
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
        <div className="flex flex-wrap gap-2 mb-2 items-center">
          {weatherOptions.map((opt) => (
            <button
              key={opt.code === " " ? "space" : opt.code}
              type="button"
              className={`px-2 py-1 rounded-xl border ${opt.color} text-black cursor-pointer`}
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

        <div className="border p-2 rounded-xl bg-white flex flex-wrap gap-2 items-center mt-2 h-10">
          {weatherArr.map((w, idx) => {
            const opt = weatherOptions.find((o) => o.code === w);
            const bgClass = opt ? opt.color : "bg-white";
            return (
              <button
                key={`${idx}-${w}-tag`}
                type="button"
                className={`inline-flex items-center ${bgClass} text-black px-2 py-0.5 rounded-xl border border-gray-300 ${
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
            <span className="text-red-500 text-sm ml-2">Visibility 5000m Or Below, Weather Must Be Selected</span>
          )}
        </div>
      </div>
      {!visEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl" />}
    </div>
  );
}
