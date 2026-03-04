import { useEffect, useRef } from "react";

interface NumericControlProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export default function NumericControl({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}: Readonly<NumericControlProps>) {
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

  return (
    <div
      className="numeric-control inline-flex items-center border rounded-xl overflow-hidden h-8 focus-within:ring-2 focus-within:ring-blue-400"
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
        className="numeric-control-btn w-7 h-8 text-sm border-r bg-gray-100 hover:bg-gray-200"
        onPointerDown={(e) => {
          e.preventDefault();
          startHold(-step);
        }}
        onPointerUp={clearHoldTimers}
        onPointerLeave={clearHoldTimers}
        onPointerCancel={clearHoldTimers}
        onBlur={clearHoldTimers}
        aria-label="Decrease value"
      >
        -
      </button>
      <div className="numeric-control-display w-14 text-center text-sm tabular-nums select-none">{display}</div>
      <button
        type="button"
        className="numeric-control-btn w-7 h-8 text-sm border-l bg-gray-100 hover:bg-gray-200"
        onPointerDown={(e) => {
          e.preventDefault();
          startHold(step);
        }}
        onPointerUp={clearHoldTimers}
        onPointerLeave={clearHoldTimers}
        onPointerCancel={clearHoldTimers}
        onBlur={clearHoldTimers}
        aria-label="Increase value"
      >
        +
      </button>
    </div>
  );
}
