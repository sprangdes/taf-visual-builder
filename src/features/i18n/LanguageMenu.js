import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageContext";
const options = [
    { value: "en", label: "English" },
    { value: "zh-TW", label: "繁體中文" },
];
export function LanguageMenu() {
    const { language, setLanguage, text } = useLanguage();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target))
                setOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [open]);
    return (_jsxs("div", { className: "language-menu-root", ref: rootRef, children: [_jsx("button", { ref: triggerRef, type: "button", className: "theme-toggle icon-button", "aria-controls": "language-menu", "aria-expanded": open, "aria-haspopup": "menu", "aria-label": text.language.open, title: text.language.open, onClick: () => setOpen((current) => !current), children: _jsxs("svg", { viewBox: "0 0 24 24", className: "w-5 h-5", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18" })] }) }), open && (_jsx("div", { id: "language-menu", className: "language-menu", role: "menu", "aria-label": text.language.menu, children: options.map((option) => (_jsxs("button", { type: "button", role: "menuitemradio", "aria-checked": language === option.value, onClick: () => {
                        setLanguage(option.value);
                        setOpen(false);
                    }, children: [_jsx("span", { children: option.label }), _jsx("i", { "aria-hidden": "true", children: language === option.value ? "✓" : "" })] }, option.value))) }))] }));
}
