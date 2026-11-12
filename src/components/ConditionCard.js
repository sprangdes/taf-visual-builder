import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLanguage } from "../features/i18n/LanguageContext";
export default function ConditionCard({ tourId, className, title, isBase, enabled, onSetEnabled, output, inherited, children, }) {
    const { text } = useLanguage();
    const active = isBase || enabled;
    return (_jsxs("section", { "data-tour-id": tourId, className: `condition-card ${className} ${active ? "" : "is-inactive"}`, children: [_jsxs("header", { className: "condition-card-header", children: [_jsx("h3", { children: title }), !isBase && (_jsxs("button", { type: "button", role: "switch", "aria-checked": enabled, "aria-label": text.editor.include(title), className: "include-switch", onClick: () => onSetEnabled(!enabled), children: [_jsx("span", { className: "include-switch-label", "aria-hidden": "true", children: text.editor.included }), _jsx("span", { className: "include-switch-track", "aria-hidden": "true", children: _jsx("i", {}) })] }))] }), active ? (_jsxs(_Fragment, { children: [children, _jsxs("p", { className: "condition-output", children: [_jsx("span", { children: text.editor.output }), _jsx("code", { children: output || "—" })] })] })) : (_jsx("p", { className: "condition-inherited", children: text.editor.notIncluded(inherited) }))] }));
}
