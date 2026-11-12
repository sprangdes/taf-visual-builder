import { useLanguage } from "../features/i18n/LanguageContext";
import type { Wind } from "../types/taf";
import { formatWind } from "../utils/weather";
import ConditionCard from "./ConditionCard";
import NumericControl from "./inputs/NumericControl";

const windDirectionOptions = Array.from({ length: 37 }, (_, index) => ({
  value: index * 10,
  label: String(index * 10),
}));

const twoDigitWindOptions = Array.from({ length: 100 }, (_, value) => ({
  value,
  label: String(value).padStart(2, "0"),
}));

interface WindSectionProps {
  isBase: boolean;
  windEnabled: boolean;
  wind: Wind;
  baseWind: Wind;
  onSetEnabled: (enabled: boolean) => void;
  onUpdateWind: (field: keyof Wind, value: number | string) => void;
}

function WindCompass({ wind, calmLabel }: Readonly<{ wind: Wind; calmLabel: string }>) {
  const calm = wind.speed === 0;
  const angle = ((wind.dir % 360) * Math.PI) / 180;
  const fromX = 60 + Math.sin(angle) * 46;
  const fromY = 60 - Math.cos(angle) * 46;
  const toX = 60 - Math.sin(angle) * 34;
  const toY = 60 + Math.cos(angle) * 34;
  const headAngle = Math.atan2(toY - fromY, toX - fromX);
  const head = [
    [toX, toY],
    [toX - 11 * Math.cos(headAngle - 0.45), toY - 11 * Math.sin(headAngle - 0.45)],
    [toX - 11 * Math.cos(headAngle + 0.45), toY - 11 * Math.sin(headAngle + 0.45)],
  ]
    .map((point) => point.map((value) => value.toFixed(1)).join(","))
    .join(" ");

  return (
    <svg className="wind-compass" viewBox="0 0 120 120" role="img" aria-label={calm ? calmLabel : `${wind.dir}°`}>
      <circle cx="60" cy="60" r="50" className="wind-compass-ring" />
      <circle cx="60" cy="60" r="34" className="wind-compass-inner" />
      <text x="60" y="21" textAnchor="middle">N</text>
      <text x="103" y="64" textAnchor="middle">E</text>
      <text x="60" y="107" textAnchor="middle">S</text>
      <text x="17" y="64" textAnchor="middle">W</text>
      {calm ? (
        <circle cx="60" cy="60" r="6" className="wind-compass-calm" />
      ) : (
        <>
          <line x1={fromX} y1={fromY} x2={toX} y2={toY} className="wind-compass-arrow" />
          <polygon points={head} className="wind-compass-head" />
          <circle cx={fromX} cy={fromY} r="5" className="wind-compass-origin" />
        </>
      )}
    </svg>
  );
}

export default function WindSection({
  isBase,
  windEnabled,
  wind,
  baseWind,
  onSetEnabled,
  onUpdateWind,
}: Readonly<WindSectionProps>) {
  const { text } = useLanguage();
  const rows = [
    { field: "dir" as const, label: text.conditions.windDirection, value: wind.dir, max: 360, step: 10, unit: "°", options: windDirectionOptions, format: undefined },
    { field: "speed" as const, label: text.conditions.windSpeed, value: wind.speed, max: 99, step: 1, unit: "KT", options: twoDigitWindOptions, format: (v: number) => String(v).padStart(2, "0") },
    { field: "gust" as const, label: text.conditions.windGust, value: wind.gust ?? 0, max: 99, step: 1, unit: "KT", options: twoDigitWindOptions, format: (v: number) => String(v).padStart(2, "0") },
  ];

  return (
    <ConditionCard
      tourId="wind"
      className="wind-card"
      title={text.conditions.wind}
      isBase={isBase}
      enabled={windEnabled}
      onSetEnabled={onSetEnabled}
      output={formatWind(wind)}
      inherited={formatWind(baseWind)}
    >
      <div className="wind-layout">
        <WindCompass wind={wind} calmLabel={text.editor.calm} />
        <div className="wind-fields">
          {rows.map((row) => (
            <div key={row.field} className="wind-field">
              <span className="field-label">{row.label}</span>
              <span className="wind-control-group">
                <NumericControl
                  value={row.value}
                  min={0}
                  max={row.max}
                  step={row.step}
                  mobileEditor="select"
                  mobileOptions={row.options}
                  formatValue={row.format}
                  onChange={(value) => onUpdateWind(row.field, value)}
                />
                <span className="field-unit">{row.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </ConditionCard>
  );
}
