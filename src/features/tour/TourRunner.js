import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback } from "react";
import { ACTIONS, EVENTS, Joyride } from "react-joyride";
import FlightStripTooltip from "./FlightStripTooltip";
import { useLanguage } from "../i18n/LanguageContext";
/** Loaded on demand so react-joyride is not part of the initial bundle. */
export default function TourRunner({ steps, isMobile, isCollapsed, onFinish }) {
    const { text } = useLanguage();
    const onEvent = useCallback((event, controls) => {
        if (event.type === EVENTS.TARGET_NOT_FOUND || event.type === EVENTS.ERROR) {
            console.warn(`[guided-tour] Skipping unavailable step: ${event.step?.id ?? "unknown"}`);
            controls.next();
            return;
        }
        if (event.type === EVENTS.TOUR_END || event.action === ACTIONS.CLOSE)
            onFinish();
    }, [onFinish]);
    return (_jsx(Joyride, { continuous: true, locale: { back: text.tour.controls.back, close: text.tour.controls.close, last: text.tour.controls.done, next: text.tour.controls.next, open: text.tour.controls.open, skip: text.tour.controls.skip }, onEvent: onEvent, options: {
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
        }, run: true, scrollToFirstStep: true, steps: steps, tooltipComponent: FlightStripTooltip }));
}
