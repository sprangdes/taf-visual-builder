import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { getCurrentIssueTimeUTC } from "../utils/time";
import { useLanguage } from "../features/i18n/LanguageContext";
export default function IssueTimeInput({ id, value, onChange }) {
    const { text } = useLanguage();
    const didInitRef = useRef(false);
    useEffect(() => {
        if (didInitRef.current)
            return;
        if (!value || value.length < 6) {
            onChange(getCurrentIssueTimeUTC());
        }
        didInitRef.current = true;
    }, [onChange, value]);
    const handleChange = (e) => {
        let val = e.target.value.replaceAll(/\D/g, "");
        if (val.length > 6)
            val = val.slice(0, 6);
        onChange(val);
    };
    return (_jsxs("span", { className: "issue-time-input", children: [_jsx("input", { id: id, type: "text", inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, value: value.slice(0, 6), onChange: handleChange, "aria-label": text.fields.issueTime.replace(" · ", " (") + ")", placeholder: value.slice(0, 6) ? undefined : "DDHHMM" }), _jsx("span", { "aria-hidden": "true", children: "Z" })] }));
}
