import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLanguage } from "../features/i18n/LanguageContext";
import { getTafChecks, getTafSummary } from "../utils/tafInsights";
const CHECK_ICON = { ok: "✓", warn: "!", info: "i" };
export function TafChecks({ taf }) {
    const { text } = useLanguage();
    const checks = getTafChecks(taf, text);
    return (_jsxs("section", { className: "glass-panel insight-panel", "aria-labelledby": "taf-checks-title", children: [_jsx("h2", { id: "taf-checks-title", children: text.output.checks }), _jsx("ul", { className: "check-list", children: checks.map((check, index) => (_jsxs("li", { className: `check-item check-item--${check.level}`, children: [_jsx("span", { className: "check-icon", "aria-hidden": "true", children: CHECK_ICON[check.level] }), _jsx("span", { children: check.message })] }, index))) })] }));
}
export function TafSummary({ taf }) {
    const { text } = useLanguage();
    const lines = getTafSummary(taf, text.decode);
    return (_jsxs("section", { className: "glass-panel insight-panel", "aria-labelledby": "taf-summary-title", children: [_jsx("h2", { id: "taf-summary-title", children: text.output.summary }), _jsx("div", { className: "summary-list", children: lines.map((line, index) => (_jsx("p", { className: `summary-line summary-line--${line.type.toLowerCase()}`, children: line.text }, index))) })] }));
}
