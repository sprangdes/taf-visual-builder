import { colorByType } from "../../constants/weather";
import type { TypeButtonProps, WeatherTrendType } from "../../types/taf";
import { useHoverTooltip } from "../../hooks/useHoverTooltip";

function nextType(type: WeatherTrendType): WeatherTrendType {
  if (type === "TEMPO") return "BECMG";
  if (type === "BECMG") return "FM";
  return "TEMPO";
}

export default function TypeButton({
  showActionButtons,
  onChangeType,
  change,
}: Readonly<TypeButtonProps>) {
  const { btnRef, showTooltip, tooltipPos, onMouseEnter, onMouseLeave } = useHoverTooltip({
    delayMs: 500,
    width: 120,
    height: 32,
  });

  const isBase = !("type" in change);

  if (isBase) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-xl font-semibold mr-1 bg-gray-300 text-black">
        BASE
      </span>
    );
  }

  if (!showActionButtons || !onChangeType) {
    return (
      <span
        className={`type-chip type-chip-${change.type} inline-flex items-center px-3 py-1 rounded-xl font-semibold mr-1 ${colorByType[change.type]}`}
      >
        {change.type}
      </span>
    );
  }

  const type = change.type;
  const next = nextType(type);
  const colorClass = colorByType[type];
  const tooltipText = `Switch to ${next}`;

  return (
    <>
      <button
        ref={btnRef}
        className={`type-chip type-chip-${type} px-3 py-1 rounded-xl font-semibold mr-1 ${colorClass} cursor-pointer`}
        onClick={(e) => {
          e.stopPropagation();
          onChangeType(next);
        }}
        type="button"
        aria-label="Change type"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {type}
      </button>
      {showTooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            fontSize: "0.75rem",
            borderRadius: "0.375rem",
            padding: "0.25rem 0.7rem",
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            pointerEvents: "none",
          }}
        >
          {tooltipText}
        </div>
      )}
    </>
  );
}
