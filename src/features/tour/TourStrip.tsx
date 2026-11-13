import { forwardRef, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { getTourGesture } from "./tourGesture";

interface TourStripProps {
  index: number;
  size: number;
  title: string;
  content: string;
  isMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}

/** Bottom card that narrates the current tour step. */
const TourStrip = forwardRef<HTMLDivElement, TourStripProps>(function TourStrip(
  { index, size, title, content, isMobile, isCollapsed, onToggleCollapsed, onBack, onNext, onClose },
  ref,
) {
  const { text } = useLanguage();
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const isLast = index === size - 1;

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, []);

  const handlePointerEnd = (clientX: number, clientY: number) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || !isMobile) return;
    const gesture = getTourGesture(clientX - start.x, clientY - start.y);
    if ((gesture === "collapse" && !isCollapsed) || (gesture === "expand" && isCollapsed)) onToggleCollapsed();
  };

  return (
    <div
      ref={ref}
      className={`tour-flight-strip ${isCollapsed ? "is-collapsed" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-description"
      onPointerDown={(event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => handlePointerEnd(event.clientX, event.clientY)}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
    >
      {isMobile && (
        <button
          type="button"
          className="tour-flight-toggle"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? text.tour.controls.expand : text.tour.controls.collapse}
          onClick={onToggleCollapsed}
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
          <h2 id="tour-step-title">{title}</h2>
          <div id="tour-step-description" className="tour-flight-description" aria-live="polite">{content}</div>
        </div>

        <div className="tour-flight-actions">
          <button type="button" className="tour-flight-close" onClick={onClose}>{text.tour.controls.close}</button>
          <div className="tour-flight-progress" aria-hidden="true">
            {Array.from({ length: size }, (_, progressIndex) => (
              <i className={progressIndex <= index ? "is-complete" : ""} key={progressIndex} />
            ))}
          </div>
          <div className="tour-flight-buttons">
            {!isLast && <button type="button" className="tour-flight-skip" onClick={onClose}>{text.tour.controls.skip}</button>}
            {index > 0 && <button type="button" className="tour-flight-back" onClick={onBack}>{text.tour.controls.back}</button>}
            <button ref={nextRef} type="button" className="tour-flight-next" onClick={onNext}>
              {isLast ? text.tour.controls.done : text.tour.controls.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TourStrip;
