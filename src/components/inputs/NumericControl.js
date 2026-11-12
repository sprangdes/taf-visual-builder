import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../features/i18n/LanguageContext";
export default function NumericControl({ value, min, max, step = 1, onChange, formatValue, mobileEditor, mobileOptions = [], }) {
    const { text } = useLanguage();
    const holdDelayTimerRef = useRef(null);
    const repeatTimerRef = useRef(null);
    const valueRef = useRef(value);
    const [draft, setDraft] = useState(null);
    useEffect(() => {
        valueRef.current = value;
    }, [value]);
    const clearHoldTimers = () => {
        if (holdDelayTimerRef.current) {
            clearTimeout(holdDelayTimerRef.current);
            holdDelayTimerRef.current = null;
        }
        if (repeatTimerRef.current) {
            clearInterval(repeatTimerRef.current);
            repeatTimerRef.current = null;
        }
    };
    useEffect(() => {
        return () => {
            clearHoldTimers();
        };
    }, []);
    const applyDelta = (delta) => {
        const next = Math.max(min, Math.min(max, valueRef.current + delta));
        valueRef.current = next;
        onChange(next);
    };
    const startHold = (delta) => {
        applyDelta(delta);
        clearHoldTimers();
        holdDelayTimerRef.current = setTimeout(() => {
            repeatTimerRef.current = setInterval(() => {
                applyDelta(delta);
            }, 70);
        }, 300);
    };
    const valueText = formatValue ? formatValue(value) : String(value);
    const commitDraft = (raw) => {
        const digits = raw.replace(/\D/g, "");
        setDraft(null);
        if (!digits)
            return;
        const parsed = Math.round(Number.parseInt(digits, 10) / step) * step;
        const next = Math.max(min, Math.min(max, parsed));
        valueRef.current = next;
        if (next !== value)
            onChange(next);
    };
    return (_jsxs("div", { className: `numeric-control ${mobileEditor ? "numeric-control--has-mobile-editor" : ""}`, children: [_jsx("button", { type: "button", className: "numeric-control-btn", onPointerDown: (e) => {
                    e.preventDefault();
                    startHold(-step);
                }, onPointerUp: clearHoldTimers, onPointerLeave: clearHoldTimers, onPointerCancel: clearHoldTimers, onBlur: clearHoldTimers, "aria-label": text.actions.decrease, children: "-" }), _jsx("input", { type: "text", inputMode: "numeric", className: "numeric-control-display", role: "spinbutton", "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": value, "aria-valuetext": valueText, maxLength: String(max).length, value: draft ?? valueText, onFocus: (e) => {
                    setDraft(valueText);
                    e.currentTarget.select();
                }, onChange: (e) => setDraft(e.target.value.replace(/\D/g, "")), onBlur: (e) => commitDraft(e.currentTarget.value), onKeyDown: (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        commitDraft(e.currentTarget.value);
                        e.currentTarget.blur();
                    }
                    else if (e.key === "Escape") {
                        e.preventDefault();
                        setDraft(null);
                        e.currentTarget.blur();
                    }
                    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                        applyDelta(e.key === "ArrowUp" ? step : -step);
                        setDraft(null);
                    }
                } }), mobileEditor === "select" && (_jsx("select", { className: "numeric-control-mobile-editor", value: value, onChange: (event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    valueRef.current = next;
                    onChange(next);
                }, children: mobileOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })), _jsx("button", { type: "button", className: "numeric-control-btn", onPointerDown: (e) => {
                    e.preventDefault();
                    startHold(step);
                }, onPointerUp: clearHoldTimers, onPointerLeave: clearHoldTimers, onPointerCancel: clearHoldTimers, onBlur: clearHoldTimers, "aria-label": text.actions.increase, children: "+" })] }));
}
