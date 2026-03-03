import { cloudAmountOptions } from "../constants/weather";
import { weatherButtonClass } from "../constants/ui";
import type { CloudLayer } from "../types/taf";
import CloudDeleteButton from "./buttons/CloudDeleteButton";

interface CloudSectionProps {
  isBase: boolean;
  cloudEnabled: boolean;
  clouds: CloudLayer[];
  onSetEnabled: (enabled: boolean) => void;
  onUpdateCloud: (
    id: string,
    field: "amount" | "height" | "cb" | "tcu",
    value: string | number | boolean,
  ) => void;
  onAddCloud: () => void;
  onRemoveCloud: (id: string) => void;
}

export default function CloudSection({
  isBase,
  cloudEnabled,
  clouds,
  onSetEnabled,
  onUpdateCloud,
  onAddCloud,
  onRemoveCloud,
}: Readonly<CloudSectionProps>) {
  return (
    <div
      className={`block text-sm mt-2 border p-2 rounded-xl bg-white relative ${
        cloudEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"
      }`}
    >
      {!isBase && cloudEnabled && (
        <button
          type="button"
          onClick={() => onSetEnabled(false)}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
          style={{ zIndex: 20 }}
        >
          X
        </button>
      )}
      {!cloudEnabled && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
          <button
            type="button"
            onClick={() => onSetEnabled(true)}
            className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
          >
            Active Clouds to Edit
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <span>Clouds</span>
      </div>

      <div className="space-y-2 mt-2">
        {clouds.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <select
              value={c.amount}
              onChange={(e) => onUpdateCloud(c.id, "amount", e.target.value)}
              className="border p-1 rounded-xl px-3 w-20"
            >
              {cloudAmountOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={c.height}
              min={0}
              step={1}
              onChange={(e) => onUpdateCloud(c.id, "height", e.target.value)}
              className="border p-1 rounded-xl px-3 w-20"
            />
            <span className="text-sm">(hundreds ft)</span>
            <label className="inline-flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={!!c.cb}
                onChange={(e) => onUpdateCloud(c.id, "cb", e.target.checked)}
              />
              <span>CB</span>
            </label>
            <label className="inline-flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={!!c.tcu}
                onChange={(e) => onUpdateCloud(c.id, "tcu", e.target.checked)}
              />
              <span>TCU</span>
            </label>
            {clouds.length > 1 && <CloudDeleteButton onClick={() => onRemoveCloud(c.id)} />}
          </div>
        ))}

        <button
          type="button"
          onClick={onAddCloud}
          className={`${weatherButtonClass} text-xs`}
        >
          Add Layer
        </button>
      </div>

      {!cloudEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl" />}
    </div>
  );
}
