import { useEffect, useRef } from "react";
import { useLanguage } from "../../features/i18n/LanguageContext";

interface NumericControlProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  mobileEditor?: "numeric" | "select";
  mobileOptions?: readonly string[];
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

  const display = formatValue ? formatValue(value) : String(value);
  const valueText = formatValue ? formatValue(value) : String(value);

  const handleNumericChange = (rawValue: string) => {
    const digits = rawValue.replaceAll(/\D/g, "");
    if (!digits) return;

    const next = Math.max(min, Math.min(max, Number.parseInt(digits, 10)));
    valueRef.current = next;
    onChange(next);
  };

  return (
    <div
      className={`numeric-control ${mobileEditor ? "numeric-control--has-mobile-editor" : ""}`}
      tabIndex={0}
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          applyDelta(step);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          applyDelta(-step);
        }
      }}
    >
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
      <div className="numeric-control-display">{display}</div>
      {mobileEditor === "numeric" && (
        <input
          type="text"
          className="numeric-control-mobile-editor"
          inputMode="numeric"
          pattern="[0-9]*"
          min={min}
          max={max}
          value={display}
          onChange={(event) => handleNumericChange(event.target.value)}
        />
      )}
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
          {mobileOptions.map((option, index) => (
            <option key={option} value={index}>
              {option}
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
