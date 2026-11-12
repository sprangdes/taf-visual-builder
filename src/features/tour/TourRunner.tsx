import { useCallback } from "react";
import { ACTIONS, EVENTS, Joyride, type EventData, type Step } from "react-joyride";
import FlightStripTooltip from "./FlightStripTooltip";
import { useLanguage } from "../i18n/LanguageContext";

type JoyrideControls = Parameters<NonNullable<React.ComponentProps<typeof Joyride>["onEvent"]>>[1];

interface TourRunnerProps {
  steps: Step[];
  isMobile: boolean;
  isCollapsed: boolean;
  onFinish: () => void;
}

/** Loaded on demand so react-joyride is not part of the initial bundle. */
export default function TourRunner({ steps, isMobile, isCollapsed, onFinish }: Readonly<TourRunnerProps>) {
  const { text } = useLanguage();

  const onEvent = useCallback((event: EventData, controls: JoyrideControls) => {
    if (event.type === EVENTS.TARGET_NOT_FOUND || event.type === EVENTS.ERROR) {
      console.warn(`[guided-tour] Skipping unavailable step: ${event.step?.id ?? "unknown"}`);
      controls.next();
      return;
    }
    if (event.type === EVENTS.TOUR_END || event.action === ACTIONS.CLOSE) onFinish();
  }, [onFinish]);

  return (
    <Joyride
      continuous
      locale={{ back: text.tour.controls.back, close: text.tour.controls.close, last: text.tour.controls.done, next: text.tour.controls.next, open: text.tour.controls.open, skip: text.tour.controls.skip }}
      onEvent={onEvent}
      options={{
        blockTargetInteraction: false,
        buttons: ["back", "close", "primary", "skip"],
        closeButtonAction: "skip",
        hideOverlay: isMobile && isCollapsed,
        overlayClickAction: false,
        scrollOffset: 180,
        showProgress: true,
        spotlightPadding: 8,
        spotlightRadius: 10,
        targetWaitTimeout: 1500,
        zIndex: 1200,
      }}
      run
      scrollToFirstStep
      steps={steps}
      tooltipComponent={FlightStripTooltip}
    />
  );
}
