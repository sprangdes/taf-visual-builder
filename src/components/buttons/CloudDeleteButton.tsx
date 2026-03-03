import type { CloudDeleteButtonProps } from "../../types/taf";
import { useHoverTooltip } from "../../hooks/useHoverTooltip";

export default function CloudDeleteButton({ onClick }: Readonly<CloudDeleteButtonProps>) {
  const { btnRef, showTooltip, tooltipPos, onMouseEnter, onMouseLeave } = useHoverTooltip({ delayMs: 500 });

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        className="bg-red-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ zIndex: 10 }}
      >
        X
      </button>
      {showTooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            fontSize: "0.75rem",
            borderRadius: "0.375rem",
            padding: "0.25rem 0.5rem",
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            pointerEvents: "none",
          }}
        >
          Delete Layer
        </div>
      )}
    </div>
  );
}
