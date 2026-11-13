import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { getTourSteps } from "./tourDefinitions";
import { cloneTourSnapshot } from "./tourDemo";
import { TourExitDialog } from "./TourMenu";
import TourRunner from "./TourRunner";
import { TourContext, type TourContextValue } from "./TourContext";
import type { TourEditorAdapter, TourEditorSnapshot, TourId, TourPeriod } from "./types";
import { useLanguage } from "../i18n/LanguageContext";

const MOBILE_QUERY = "(max-width: 639px)";

function subscribeMobile(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readMobile(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
}

interface TourProviderProps {
  children: ReactNode;
  editor: TourEditorAdapter;
}

export function TourProvider({ children, editor }: Readonly<TourProviderProps>) {
  const { text } = useLanguage();
  const editorRef = useRef(editor);
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [runId, setRunId] = useState(0);
  const [snapshot, setSnapshot] = useState<TourEditorSnapshot | null>(null);
  const [exitPending, setExitPending] = useState(false);
  const [collapsedSetting, setCollapsedSetting] = useState(false);
  const isMobile = useSyncExternalStore(subscribeMobile, readMobile, () => false);
  const isCollapsed = isMobile && collapsedSetting;

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const startTour = useCallback((id: TourId) => {
    setExitPending(false);
    setCollapsedSetting(false);
    const current = editorRef.current.capture();
    // Quick start always uses the demo; other tours need it only to have a change period to point at.
    const needsChange = getTourSteps(id, false).some((step) => step.period === "change");
    if (id === "quick-start" || (needsChange && current.taf.changes.length === 0)) {
      setSnapshot(cloneTourSnapshot(current));
      editorRef.current.loadDemo();
    } else {
      setSnapshot(null);
    }
    setActiveTour(id);
    setRunId((current) => current + 1);
  }, []);

  const finishTour = useCallback(() => {
    setActiveTour(null);
    setCollapsedSetting(false);
    if (snapshot) setExitPending(true);
  }, [snapshot]);

  const selectPeriod = useCallback((period: TourPeriod) => {
    editorRef.current.selectPeriod(period);
  }, []);

  const toggleCollapsed = useCallback(() => setCollapsedSetting((current) => !current), []);

  const steps = useMemo(
    () => (activeTour ? getTourSteps(activeTour, isMobile, text.tour) : []),
    [activeTour, isMobile, text.tour],
  );

  const contextValue = useMemo<TourContextValue>(() => ({
    startTour,
    isRunning: activeTour !== null,
    isMobile,
    isCollapsed,
    toggleCollapsed,
  }), [activeTour, isCollapsed, isMobile, startTour, toggleCollapsed]);

  const resolveExit = (decision: "keep" | "restore") => {
    if (decision === "restore" && snapshot) editorRef.current.restore(snapshot);
    setSnapshot(null);
    setExitPending(false);
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {activeTour !== null && (
        <TourRunner
          key={runId}
          steps={steps}
          isMobile={isMobile}
          isCollapsed={isCollapsed}
          onToggleCollapsed={toggleCollapsed}
          onSelectPeriod={selectPeriod}
          onFinish={finishTour}
        />
      )}
      {exitPending && <TourExitDialog onResolve={resolveExit} />}
    </TourContext.Provider>
  );
}
