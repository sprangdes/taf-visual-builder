import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { getTourCatalog } from "./tourDefinitions";
import { useLanguage } from "../i18n/LanguageContext";
export function TourMenu({ onStart }) {
    const { text } = useLanguage();
    const tourCatalog = getTourCatalog(text.tour);
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const close = (returnFocus) => {
            setOpen(false);
            if (returnFocus)
                triggerRef.current?.focus();
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape")
                close(true);
        };
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target))
                close(false);
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [open]);
    return (_jsxs("div", { className: "tour-menu-root", ref: rootRef, children: [_jsx("button", { type: "button", ref: triggerRef, "aria-controls": "guided-tour-menu", "aria-expanded": open, "aria-haspopup": "menu", "aria-label": text.tour.openMenu, title: text.tour.openMenu, className: "theme-toggle icon-button", onClick: () => setOpen((current) => !current), children: _jsx("svg", { viewBox: "0 0 24 24", className: "w-5 h-5", "aria-hidden": "true", fill: "currentColor", children: _jsx("path", { d: "M12 3a9 9 0 1 0 6.36 15.36l2.14 2.14a1 1 0 0 0 1.41-1.41l-2.14-2.14A9 9 0 0 0 12 3Zm0 2a7 7 0 1 1 0 14a7 7 0 0 1 0-14Zm0 3a1 1 0 0 0 0 2a2 2 0 0 1 2 2a1 1 0 1 0 2 0a4 4 0 0 0-4-4Zm-1 6a1 1 0 1 0 2 0v-1a1 1 0 1 0-2 0v1Z" }) }) }), open && (_jsxs("div", { id: "guided-tour-menu", className: "tour-menu", role: "menu", "aria-label": text.tour.menuAria, children: [_jsx("p", { className: "tour-menu-label", children: text.tour.menuLabel }), tourCatalog.map((tour) => (_jsxs("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            onStart(tour.id);
                        }, children: [_jsx("strong", { children: tour.label }), _jsx("span", { children: tour.description })] }, tour.id)))] }))] }));
}
export function TourExitDialog({ onResolve }) {
    const { text } = useLanguage();
    return (_jsx("div", { className: "tour-exit-backdrop", children: _jsxs("section", { className: "tour-exit-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "tour-exit-title", children: [_jsx("p", { className: "tour-menu-label", children: text.tour.complete }), _jsx("h2", { id: "tour-exit-title", children: text.tour.keepTitle }), _jsx("p", { children: text.tour.keepDescription }), _jsxs("div", { className: "tour-exit-actions", children: [_jsx("button", { type: "button", className: "tour-flight-back", onClick: () => onResolve("restore"), children: text.tour.restore }), _jsx("button", { type: "button", className: "tour-flight-next", onClick: () => onResolve("keep"), children: text.tour.keep })] })] }) }));
}
