import { cloudAmountOptions } from "../constants/weather";
import { weatherButtonClass } from "../constants/ui";
import type { CloudLayer } from "../types/taf";
import CloudDeleteButton from "./buttons/CloudDeleteButton";
import NumericControl from "./inputs/NumericControl";
import { useLanguage } from "../features/i18n/LanguageContext";

const cloudAmountPickerOptions = cloudAmountOptions.map((label, value) => ({ value, label }));

const cloudHeightPickerOptions = Array.from({ length: 1000 }, (_, value) => ({
  value,
  label: String(value).padStart(3, "0"),
}));

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
  const { text } = useLanguage();
  return (
    <div
      data-tour-id="clouds"
      className={`taf-block condition-block cloud-block ${cloudEnabled ? "" : "is-inactive"}`}
    >
      {!isBase && cloudEnabled && (
        <button
          type="button"
          aria-label={text.conditions.deactivateClouds}
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
            aria-label={text.conditions.activateCloudsAria}
            onClick={() => onSetEnabled(true)}
            className="condition-block-activate"
          >
            <span className="condition-block-activate-icon" aria-hidden="true">+</span>
            <span className="condition-block-activate-copy">
              <strong>{text.conditions.activateClouds}</strong>
              <small>{text.conditions.includeInChange}</small>
            </span>
          </button>
        </div>
      )}

      <h4 className="condition-block-title">
        <span className="condition-block-icon" aria-hidden="true">☁</span>
        {text.conditions.clouds}
      </h4>

      <div className="cloud-layers-controls cloud-layers-stack">
        {clouds.map((c) => (
          <div key={c.id} className="cloud-layer-row">
            <span className="cloud-measurement-group">
              <NumericControl
                value={Math.max(0, cloudAmountOptions.indexOf(c.amount))}
                min={0}
                max={cloudAmountOptions.length - 1}
                step={1}
                mobileEditor="select"
                mobileOptions={cloudAmountPickerOptions}
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
                mobileEditor="select"
                mobileOptions={cloudHeightPickerOptions}
                formatValue={(v) => String(v).padStart(3, "0")}
                onChange={(value) => onUpdateCloud(c.id, "height", value)}
              />
              <span className="cloud-height-unit">{text.conditions.hundredsFeet}</span>
            </span>
            <span className="cloud-checkbox-group">
              <label className="cloud-checkbox">
                <input
                  type="checkbox"
                  checked={!!c.cb}
                  onChange={(e) => onUpdateCloud(c.id, "cb", e.target.checked)}
                />
                <span>CB</span>
              </label>
              <label className="cloud-checkbox">
                <input
                  type="checkbox"
                  checked={!!c.tcu}
                  onChange={(e) => onUpdateCloud(c.id, "tcu", e.target.checked)}
                />
                <span>TCU</span>
              </label>
            </span>
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
          {text.conditions.addLayer}
        </button>
      </div>
    </div>
  );
}
