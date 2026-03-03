import type { Wind } from "../types/taf";

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
      className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${
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
            className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
          >
            Active Wind to Edit
          </button>
        </div>
      )}
      <label className="text-sm">
        <span className="inline-block w-28">Wind Direction</span>
        <input
          type="number"
          className="border p-1 mr-2 rounded-xl px-3 w-20"
          value={wind.dir}
          step={10}
          min={0}
          max={360}
          onChange={(e) => onUpdateWind("dir", e.target.value)}
        />
        <span className="ml-1 text-sm">°</span>
      </label>
      <label className="text-sm">
        <span className="inline-block w-28">Wind Speed</span>
        <input
          type="number"
          className="border p-1 mr-2 rounded-xl px-3 w-20"
          value={wind.speed}
          min={0}
          step={1}
          onChange={(e) => onUpdateWind("speed", e.target.value)}
        />
        <span className="ml-1 text-sm">KT</span>
      </label>
      <label className="text-sm">
        <span className="inline-block w-28">Wind Gust</span>
        <input
          type="number"
          className="border p-1 mr-2 rounded-xl px-3 w-20"
          value={wind.gust ?? ""}
          min={0}
          step={1}
          onChange={(e) => onUpdateWind("gust", e.target.value)}
        />
        <span className="ml-1 text-sm">KT</span>
      </label>
      {!windEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl" />}
    </div>
  );
}
