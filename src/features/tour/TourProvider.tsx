import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ACTIONS, EVENTS, Joyride, type EventData, type Step } from "react-joyride";
import FlightStripTooltip from "./FlightStripTooltip";
import { getTourSteps } from "./tourDefinitions";
import { cloneTourSnapshot } from "./tourDemo";
import { TourExitDialog } from "./TourMenu";
import { TourContext, type TourContextValue } from "./TourContext";
import type { TourEditorAdapter, TourEditorSnapshot, TourId } from "./types";
import { useLanguage } from "../i18n/LanguageContext";

function getMobileQuery(): MediaQueryList | null {
  return typeof window === "undefined" || !window.matchMedia ? null : window.matchMedia("(max-width: 639px)");
}

interface TourProviderProps {
  children: ReactNode;
  editor: TourEditorAdapter;
}

export function TourProvider({ children, editor }: Readonly<TourProviderProps>) {
  const { text } = useLanguage();
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [snapshot, setSnapshot] = useState<TourEditorSnapshot | null>(null);
  const [exitPending, setExitPending] = useState(false);
  const [isMobile, setIsMobile] = useState(() => getMobileQuery()?.matches ?? false);
  const finishingRef = useRef(false);

  useEffect(() => {
    const query = getMobileQuery();
    if (!query) return;
    const update = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const startTour = useCallback((id: TourId) => {
    finishingRef.current = false;
    setExitPending(false);
    if (id === "quick-start") {
      setSnapshot(cloneTourSnapshot(editor.capture()));
      editor.loadDemo();
    } else {
      setSnapshot(null);
    }
    setActiveTour(id);
  }, [editor]);

  const finishTour = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setActiveTour(null);
    if (snapshot) setExitPending(true);
  }, [snapshot]);

  const onEvent = useCallback((event: EventData, controls: Parameters<NonNullable<React.ComponentProps<typeof Joyride>["onEvent"]>>[1]) => {
    if (event.type === EVENTS.TARGET_NOT_FOUND || event.type === EVENTS.ERROR) {
      console.warn(`[guided-tour] Skipping unavailable step: ${event.step?.id ?? "unknown"}`);
      controls.next();
      return;
    }
    if (event.type === EVENTS.TOUR_END || event.action === ACTIONS.CLOSE) finishTour();
  }, [finishTour]);

  const steps = useMemo<Step[]>(() => {
    if (!activeTour) return [];
    return getTourSteps(activeTour, isMobile, text.tour).map((step) => ({
      content: step.content,
      data: {
        id: step.id,
        isMobile,
      },
      id: step.id,
      isFixed: true,
      placement: "center",
      skipBeacon: true,
      target: step.target,
      title: step.title,
    }));
  }, [activeTour, isMobile, text.tour]);

  const contextValue = useMemo<TourContextValue>(() => ({
    startTour,
    isRunning: activeTour !== null,
  }), [activeTour, startTour]);

  const resolveExit = (decision: "keep" | "restore") => {
    if (decision === "restore" && snapshot) editor.restore(snapshot);
    setSnapshot(null);
    setExitPending(false);
    finishingRef.current = false;
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <Joyride
        continuous
        locale={{ back: text.tour.controls.back, close: text.tour.controls.close, last: text.tour.controls.done, next: text.tour.controls.next, open: text.tour.controls.open, skip: text.tour.controls.skip }}
        onEvent={onEvent}
        options={{
          blockTargetInteraction: false,
          buttons: ["back", "close", "primary", "skip"],
          closeButtonAction: "skip",
          overlayClickAction: false,
          scrollOffset: 180,
          showProgress: true,
          spotlightPadding: 8,
          spotlightRadius: 10,
          targetWaitTimeout: 1500,
          zIndex: 1200,
        }}
        run={activeTour !== null}
        scrollToFirstStep
        steps={steps}
        tooltipComponent={FlightStripTooltip}
      />
      {exitPending && <TourExitDialog onResolve={resolveExit} />}
    </TourContext.Provider>
  );
}
