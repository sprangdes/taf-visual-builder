import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTourSteps } from "./tourDefinitions";
import { cloneTourSnapshot } from "./tourDemo";
import { TourExitDialog } from "./TourMenu";
import { TourContext } from "./TourContext";
import { useLanguage } from "../i18n/LanguageContext";
import { centerTourTarget } from "./tourScroll";
// react-joyride and its positioning engine are only needed once a tour starts.
const TourRunner = lazy(() => import("./TourRunner"));
function getMobileQuery() {
    return typeof window === "undefined" || !window.matchMedia ? null : window.matchMedia("(max-width: 639px)");
}
export function TourProvider({ children, editor }) {
    const { text } = useLanguage();
    const [activeTour, setActiveTour] = useState(null);
    const [snapshot, setSnapshot] = useState(null);
    const [exitPending, setExitPending] = useState(false);
    const [isMobile, setIsMobile] = useState(() => getMobileQuery()?.matches ?? false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const finishingRef = useRef(false);
    useEffect(() => {
        const query = getMobileQuery();
        if (!query)
            return;
        const update = (event) => {
            setIsMobile(event.matches);
            if (!event.matches)
                setIsCollapsed(false);
        };
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);
    const startTour = useCallback((id) => {
        finishingRef.current = false;
        setExitPending(false);
        setIsCollapsed(false);
        if (id === "quick-start") {
            setSnapshot(cloneTourSnapshot(editor.capture()));
            editor.loadDemo();
        }
        else {
            setSnapshot(null);
        }
        setActiveTour(id);
    }, [editor]);
    const finishTour = useCallback(() => {
        if (finishingRef.current)
            return;
        finishingRef.current = true;
        setIsCollapsed(false);
        setActiveTour(null);
        if (snapshot)
            setExitPending(true);
    }, [snapshot]);
    const steps = useMemo(() => {
        if (!activeTour)
            return [];
        return getTourSteps(activeTour, isMobile, text.tour).map((step) => ({
            before: () => centerTourTarget(step.target),
            content: step.content,
            data: {
                id: step.id,
                isMobile,
            },
            id: step.id,
            placement: "center",
            skipScroll: true,
            skipBeacon: true,
            target: step.target,
            title: step.title,
        }));
    }, [activeTour, isMobile, text.tour]);
    const contextValue = useMemo(() => ({
        startTour,
        isRunning: activeTour !== null,
        isMobile,
        isCollapsed,
        toggleCollapsed: () => setIsCollapsed((current) => !current),
    }), [activeTour, isCollapsed, isMobile, startTour]);
    const resolveExit = (decision) => {
        if (decision === "restore" && snapshot)
            editor.restore(snapshot);
        setSnapshot(null);
        setExitPending(false);
        finishingRef.current = false;
    };
    return (_jsxs(TourContext.Provider, { value: contextValue, children: [children, activeTour !== null && (_jsx(Suspense, { fallback: null, children: _jsx(TourRunner, { steps: steps, isMobile: isMobile, isCollapsed: isCollapsed, onFinish: finishTour }) })), exitPending && _jsx(TourExitDialog, { onResolve: resolveExit })] }));
}
