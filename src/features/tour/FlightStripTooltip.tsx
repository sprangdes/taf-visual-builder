import type { TooltipRenderProps } from "react-joyride";
import { useTour } from "./TourContext";
import type { TourTaskEvent } from "./types";

interface FlightStripData {
  isMobile?: boolean;
  taskEvent?: TourTaskEvent;
}

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
  const data = (step.data ?? {}) as FlightStripData;
  const tour = useTour();
  const taskLocked = Boolean(data.taskEvent && !data.isMobile && !tour.isTaskComplete(data.taskEvent));

  return (
    <div className="tour-flight-strip" {...tooltipProps}>
      <div className="tour-flight-strip-inner">
        <div className="tour-flight-copy">
          <div className="tour-flight-kicker">
            <span>{String(index + 1).padStart(2, "0")} / {String(size).padStart(2, "0")}</span>
            <span>Guided briefing</span>
          </div>
          {step.title && <h2>{step.title}</h2>}
          <div className="tour-flight-description">{step.content}</div>
          {taskLocked && <p className="tour-flight-task">Complete the highlighted action to continue.</p>}
        </div>

        <div className="tour-flight-actions">
          <button type="button" className="tour-flight-close" {...closeProps}>Close</button>
          <div className="tour-flight-progress" aria-hidden="true">
            {Array.from({ length: size }, (_, progressIndex) => (
              <i className={progressIndex <= index ? "is-complete" : ""} key={progressIndex} />
            ))}
          </div>
          <div className="tour-flight-buttons">
            <button type="button" className="tour-flight-skip" {...skipProps}>Skip</button>
            {index > 0 && <button type="button" className="tour-flight-back" {...backProps}>Back</button>}
            {continuous && (
              <button
                type="button"
                className="tour-flight-next"
                {...primaryProps}
                disabled={taskLocked}
              >
                {isLastStep ? "Done" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
