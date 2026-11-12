import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../features/i18n/LanguageContext";
const keywordPattern = /^(TAF|TEMPO|BECMG|FM\d{6})$/;
const accentPattern = /^(\d{3}(\d{2}|P\d{2})(G\d{2})?KT|\d{4}|FEW\d{3}(CB|TCU)?|SCT\d{3}(CB|TCU)?|BKN\d{3}(CB|TCU)?|OVC\d{3}(CB|TCU)?|VV\d{3}|[-+]?(VC)?(SH|TS)?(RA|DZ|SN)?(BR|FG|HZ)?)$/;
function tokenClass(token, station) {
    if (!token.trim())
        return undefined;
    if (keywordPattern.test(token))
        return "taf-code-keyword";
    if (token === station || accentPattern.test(token))
        return "taf-code-accent";
    return undefined;
}
export default function GeneratedTafOutput({ lines, station, changes, selectedChangeIndex }) {
    const { text } = useLanguage();
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);
    const fullText = lines.map((line) => line.text).join("\n");
    useEffect(() => () => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
    }, []);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(fullText);
            setCopied(true);
            if (timerRef.current)
                clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 1800);
        }
        catch {
            setCopied(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "output-header", children: [_jsxs("div", { className: "output-title", children: [_jsx("h2", { children: text.sections.output.title }), _jsxs("span", { className: "live-indicator", children: [_jsx("i", { "aria-hidden": "true" }), text.output.live] })] }), _jsxs("button", { type: "button", className: "copy-button", "aria-label": text.output.copyAria, onClick: copy, children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }), _jsx("path", { d: "M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" })] }), _jsx("span", { "aria-live": "polite", children: copied ? text.output.copied : text.output.copy })] })] }), _jsx("pre", { "data-testid": "generated-taf", className: "taf-code", children: lines.map((line, lineIndex) => {
                    const type = line.changeIndex === null ? "base" : changes[line.changeIndex]?.type.toLowerCase();
                    const selected = line.changeIndex !== null && line.changeIndex === selectedChangeIndex;
                    return (_jsx("span", { className: `taf-code-line taf-code-line--${type} ${selected ? "is-selected" : ""}`, children: line.text.split(/(\s+)/).map((token, index) => (_jsx("span", { className: tokenClass(token, station), children: token }, `${index}-${token}`))) }, lineIndex));
                }) })] }));
}
