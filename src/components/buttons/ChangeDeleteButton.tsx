import { useEffect } from "react";
import type { ChangeDeleteButtonProps } from "../../types/taf";
import { useHoverTooltip } from "../../hooks/useHoverTooltip";

export default function ChangeDeleteButton({
  onClick,
  setShowTooltip,
  showTooltip,
}: Readonly<ChangeDeleteButtonProps>) {
  const {
    btnRef,
    tooltipPos,
    onMouseEnter,
    onMouseLeave,
    setShowTooltip: setLocalShowTooltip,
  } = useHoverTooltip({ delayMs: 500 });

  useEffect(() => {
    setLocalShowTooltip(showTooltip);
  }, [setLocalShowTooltip, showTooltip]);

  useEffect(() => {
    if (showTooltip) onMouseEnter();
    else onMouseLeave();
  }, [onMouseEnter, onMouseLeave, showTooltip]);

  return (
    <>
      <button
        ref={btnRef}
        className="bg-red-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => {
          onMouseEnter();
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          onMouseLeave();
          setShowTooltip(false);
        }}
        style={{ zIndex: 10 }}
        type="button"
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
          Delete Change
        </div>
      )}
    </>
  );
}
