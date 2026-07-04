import { useRef } from "react";
import type { TooltipRenderProps } from "react-joyride";
import { useLanguage } from "../i18n/LanguageContext";
import { useTour } from "./TourContext";
import { getTourGesture } from "./tourGesture";

export default function FlightStripTooltip({
  backProps,
  closeProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: Readonly<TooltipRenderProps>) {
  const { text } = useLanguage();
  const { isCollapsed, isMobile, toggleCollapsed } = useTour();
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerEnd = (clientX: number, clientY: number) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || !isMobile) return;
    const gesture = getTourGesture(clientX - start.x, clientY - start.y);
    if ((gesture === "collapse" && !isCollapsed) || (gesture === "expand" && isCollapsed)) {
      toggleCollapsed();
    }
  };

  return (
    <div
      className={`tour-flight-strip ${isCollapsed ? "is-collapsed" : ""}`}
      onPointerDown={(event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => handlePointerEnd(event.clientX, event.clientY)}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
      {...tooltipProps}
    >
      {isMobile && (
        <button
          type="button"
          className="tour-flight-toggle"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? text.tour.controls.expand : text.tour.controls.collapse}
          onClick={toggleCollapsed}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={isCollapsed ? "m7 15 5-5 5 5" : "m7 9 5 5 5-5"} />
          </svg>
        </button>
      )}
      <div className="tour-flight-strip-inner">
        <div className="tour-flight-copy">
          <div className="tour-flight-kicker">
            <span>{String(index + 1).padStart(2, "0")} / {String(size).padStart(2, "0")}</span>
            <span>{text.tour.menuLabel}</span>
          </div>
          {step.title && <h2>{step.title}</h2>}
          <div className="tour-flight-description">{step.content}</div>
        </div>

        <div className="tour-flight-actions">
          <button type="button" className="tour-flight-close" {...closeProps}>{text.tour.controls.close}</button>
          <div className="tour-flight-progress" aria-hidden="true">
            {Array.from({ length: size }, (_, progressIndex) => (
              <i className={progressIndex <= index ? "is-complete" : ""} key={progressIndex} />
            ))}
          </div>
          <div className="tour-flight-buttons">
            <button type="button" className="tour-flight-skip" {...skipProps}>{text.tour.controls.skip}</button>
            {index > 0 && <button type="button" className="tour-flight-back" {...backProps}>{text.tour.controls.back}</button>}
            {continuous && (
              <button
                type="button"
                className="tour-flight-next"
                {...primaryProps}
              >
                {isLastStep ? text.tour.controls.done : text.tour.controls.next}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
