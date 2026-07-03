import { cloudAmountOptions } from "../constants/weather";
import { weatherButtonClass } from "../constants/ui";
import type { CloudLayer } from "../types/taf";
import CloudDeleteButton from "./buttons/CloudDeleteButton";
import NumericControl from "./inputs/NumericControl";

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
      id="tour-clouds"
      className={`taf-block condition-block cloud-block ${cloudEnabled ? "" : "is-inactive"}`}
    >
      {!isBase && cloudEnabled && (
        <button
          type="button"
          aria-label="Deactivate clouds"
          onClick={() => onSetEnabled(false)}
          className="condition-block-deactivate"
        >
          X
        </button>
      )}
      {!cloudEnabled && (
        <div className="condition-block-overlay">
          <button
            type="button"
            aria-label="Activate clouds to edit"
            onClick={() => onSetEnabled(true)}
            className="condition-block-activate"
          >
            <span className="condition-block-activate-icon" aria-hidden="true">+</span>
            <span className="condition-block-activate-copy">
              <strong>Activate cloud layers</strong>
              <small>Include this section in the change</small>
            </span>
          </button>
        </div>
      )}

      <h4 className="condition-block-title">
        <span className="condition-block-icon" aria-hidden="true">☁</span>
        Cloud layers
      </h4>

      <div className="cloud-layers-controls">
        {clouds.map((c) => (
          <div key={c.id} className="cloud-layer-row">
            <NumericControl
              value={Math.max(0, cloudAmountOptions.indexOf(c.amount))}
              min={0}
              max={cloudAmountOptions.length - 1}
              step={1}
              formatValue={(v) => cloudAmountOptions[v] ?? cloudAmountOptions[0]}
              onChange={(value) =>
                onUpdateCloud(c.id, "amount", cloudAmountOptions[value] ?? cloudAmountOptions[0])
              }
            />
            <NumericControl
              value={c.height}
              min={0}
              max={999}
              step={1}
              formatValue={(v) => String(v).padStart(3, "0")}
              onChange={(value) => onUpdateCloud(c.id, "height", value)}
            />
            <span className="cloud-height-unit">hundreds ft</span>
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

      </div>

      <div className="cloud-add-row">
        <button
          type="button"
          onClick={onAddCloud}
          className={`${weatherButtonClass} cloud-add-button`}
        >
          Add Layer
        </button>
      </div>
    </div>
  );
}
