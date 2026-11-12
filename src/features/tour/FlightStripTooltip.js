import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTour } from "./TourContext";
import { getTourGesture } from "./tourGesture";
export default function FlightStripTooltip({ backProps, closeProps, continuous, index, isLastStep, primaryProps, size, skipProps, step, tooltipProps, }) {
    const { text } = useLanguage();
    const { isCollapsed, isMobile, toggleCollapsed } = useTour();
    const pointerStartRef = useRef(null);
    const handlePointerEnd = (clientX, clientY) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (!start || !isMobile)
            return;
        const gesture = getTourGesture(clientX - start.x, clientY - start.y);
        if ((gesture === "collapse" && !isCollapsed) || (gesture === "expand" && isCollapsed)) {
            toggleCollapsed();
        }
    };
    return (_jsxs("div", { className: `tour-flight-strip ${isCollapsed ? "is-collapsed" : ""}`, onPointerDown: (event) => {
            pointerStartRef.current = { x: event.clientX, y: event.clientY };
        }, onPointerUp: (event) => handlePointerEnd(event.clientX, event.clientY), onPointerCancel: () => {
            pointerStartRef.current = null;
        }, ...tooltipProps, children: [isMobile && (_jsx("button", { type: "button", className: "tour-flight-toggle", "aria-expanded": !isCollapsed, "aria-label": isCollapsed ? text.tour.controls.expand : text.tour.controls.collapse, onClick: toggleCollapsed, children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: isCollapsed ? "m7 15 5-5 5 5" : "m7 9 5 5 5-5" }) }) })), _jsxs("div", { className: "tour-flight-strip-inner", children: [_jsxs("div", { className: "tour-flight-copy", children: [_jsxs("div", { className: "tour-flight-kicker", children: [_jsxs("span", { children: [String(index + 1).padStart(2, "0"), " / ", String(size).padStart(2, "0")] }), _jsx("span", { children: text.tour.menuLabel })] }), step.title && _jsx("h2", { children: step.title }), _jsx("div", { className: "tour-flight-description", children: step.content })] }), _jsxs("div", { className: "tour-flight-actions", children: [_jsx("button", { type: "button", className: "tour-flight-close", ...closeProps, children: text.tour.controls.close }), _jsx("div", { className: "tour-flight-progress", "aria-hidden": "true", children: Array.from({ length: size }, (_, progressIndex) => (_jsx("i", { className: progressIndex <= index ? "is-complete" : "" }, progressIndex))) }), _jsxs("div", { className: "tour-flight-buttons", children: [_jsx("button", { type: "button", className: "tour-flight-skip", ...skipProps, children: text.tour.controls.skip }), index > 0 && _jsx("button", { type: "button", className: "tour-flight-back", ...backProps, children: text.tour.controls.back }), continuous && (_jsx("button", { type: "button", className: "tour-flight-next", ...primaryProps, children: isLastStep ? text.tour.controls.done : text.tour.controls.next }))] })] })] })] }));
}
