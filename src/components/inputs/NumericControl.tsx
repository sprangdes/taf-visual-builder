import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../features/i18n/LanguageContext";

interface NumericControlProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  mobileEditor?: "select";
  mobileOptions?: readonly { value: number; label: string }[];
}

export default function NumericControl({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  mobileEditor,
  mobileOptions = [],
}: Readonly<NumericControlProps>) {
  const { text } = useLanguage();
  const holdDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(value);
  const [draft, setDraft] = useState<string | null>(null);

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

  const applyDelta = (delta: number) => {
    const next = Math.max(min, Math.min(max, valueRef.current + delta));
    valueRef.current = next;
    onChange(next);
  };

  const startHold = (delta: number) => {
    applyDelta(delta);
    clearHoldTimers();
    holdDelayTimerRef.current = setTimeout(() => {
      repeatTimerRef.current = setInterval(() => {
        applyDelta(delta);
      }, 70);
    }, 300);
  };

  const valueText = formatValue ? formatValue(value) : String(value);

  const commitDraft = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setDraft(null);
    if (!digits) return;
    const parsed = Math.round(Number.parseInt(digits, 10) / step) * step;
    const next = Math.max(min, Math.min(max, parsed));
    valueRef.current = next;
    if (next !== value) onChange(next);
  };

  return (
    <div className={`numeric-control ${mobileEditor ? "numeric-control--has-mobile-editor" : ""}`}>
      <button
        type="button"
        className="numeric-control-btn"
        onPointerDown={(e) => {
          e.preventDefault();
          startHold(-step);
        }}
        onPointerUp={clearHoldTimers}
        onPointerLeave={clearHoldTimers}
        onPointerCancel={clearHoldTimers}
        onBlur={clearHoldTimers}
        aria-label={text.actions.decrease}
      >
        -
      </button>
      <input
        type="text"
        inputMode="numeric"
        className="numeric-control-display"
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        maxLength={String(max).length}
        value={draft ?? valueText}
        onFocus={(e) => {
          setDraft(valueText);
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={(e) => commitDraft(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft(e.currentTarget.value);
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setDraft(null);
            e.currentTarget.blur();
          } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            applyDelta(e.key === "ArrowUp" ? step : -step);
            setDraft(null);
          }
        }}
      />
      {mobileEditor === "select" && (
        <select
          className="numeric-control-mobile-editor"
          value={value}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            valueRef.current = next;
            onChange(next);
          }}
        >
          {mobileOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className="numeric-control-btn"
        onPointerDown={(e) => {
          e.preventDefault();
          startHold(step);
        }}
        onPointerUp={clearHoldTimers}
        onPointerLeave={clearHoldTimers}
        onPointerCancel={clearHoldTimers}
        onBlur={clearHoldTimers}
        aria-label={text.actions.increase}
      >
        +
      </button>
    </div>
  );
}
