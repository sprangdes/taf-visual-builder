import { cloudAmountOptions } from "../constants/weather";
import type { CloudLayer } from "../types/taf";
import { formatClouds } from "../utils/weather";
import ConditionCard from "./ConditionCard";
import NumericControl from "./inputs/NumericControl";
import { useLanguage } from "../features/i18n/LanguageContext";

const cloudHeightPickerOptions = Array.from({ length: 1000 }, (_, value) => ({
  value,
  label: String(value).padStart(3, "0"),
}));

interface CloudSectionProps {
  isBase: boolean;
  cloudEnabled: boolean;
  clouds: CloudLayer[];
  baseCode: string;
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
  baseCode,
  onSetEnabled,
  onUpdateCloud,
  onAddCloud,
  onRemoveCloud,
}: Readonly<CloudSectionProps>) {
  const { text } = useLanguage();
  return (
    <ConditionCard
      tourId="clouds"
      className="cloud-card"
      title={text.conditions.clouds}
      isBase={isBase}
      enabled={cloudEnabled}
      onSetEnabled={onSetEnabled}
      output={formatClouds(clouds)}
      inherited={baseCode}
    >
      <div className="cloud-layers">
        {clouds.map((c) => (
          <div key={c.id} className="cloud-layer-row">
            <div className="segmented segmented--small" role="group" aria-label={text.editor.cloudAmount}>
              {cloudAmountOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  aria-pressed={c.amount === amount}
                  className={c.amount === amount ? "is-on" : ""}
                  onClick={() => onUpdateCloud(c.id, "amount", amount)}
                >
                  {amount}
                </button>
              ))}
            </div>
            <span className="cloud-measurement-group" aria-label={text.editor.cloudHeight}>
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
              <span className="field-unit">{text.conditions.hundredsFeet}</span>
            </span>
            <span className="cloud-type-group">
              <button
                type="button"
                className={`chip ${c.cb ? "is-on" : ""}`}
                aria-pressed={!!c.cb}
                onClick={() => onUpdateCloud(c.id, "cb", !c.cb)}
              >
                CB
              </button>
              <button
                type="button"
                className={`chip ${c.tcu ? "is-on" : ""}`}
                aria-pressed={!!c.tcu}
                onClick={() => onUpdateCloud(c.id, "tcu", !c.tcu)}
              >
                TCU
              </button>
            </span>
            {clouds.length > 1 && (
              <button
                type="button"
                aria-label={text.actions.deleteCloud}
                title={text.actions.deleteLayer}
                onClick={() => onRemoveCloud(c.id)}
                className="cloud-delete-button"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={onAddCloud} className="cloud-add-button">
        {text.conditions.addLayer}
      </button>
    </ConditionCard>
  );
}
