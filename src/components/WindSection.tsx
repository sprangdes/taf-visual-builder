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
      className={`taf-block min-w-0 flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${
        windEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"
      }`}
    >
      {!isBase && windEnabled && (
        <button
          type="button"
          onClick={() => onSetEnabled(false)}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
          style={{ zIndex: 20 }}
        >
          X
        </button>
      )}
      {!windEnabled && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
          <button
            type="button"
            onClick={() => onSetEnabled(true)}
            className="bg-gray-800 text-white px-3 py-1 rounded-xl text-xs sm:text-sm cursor-pointer"
          >
            Active Wind to Edit
          </button>
        </div>
      )}
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
      {!windEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl" />}
    </div>
  );
}
