import { useState } from "react";

export function useTimeRange() {
  const [pendingRange, setPendingRange] = useState<number | null>(null);
  const [hoverHour, setHoverHour] = useState<number | null>(null);

  const selectHour = (h: number, onSelectRange: (s: number, e: number) => void) => {
    if (pendingRange === null) {
      setPendingRange(h);
      return;
    }

    const s = Math.min(pendingRange, h);
    const e = Math.max(pendingRange, h);
    onSelectRange(s, e);
    setPendingRange(null);
    setHoverHour(null);
  };

  const setHover = (h: number | null) => {
    setHoverHour(h);
  };

  const reset = () => {
    setPendingRange(null);
    setHoverHour(null);
  };

  return { pendingRange, selectHour, hoverHour, setHover, reset };
}
