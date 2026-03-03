import { useEffect, useRef, useState } from "react";
import type { TooltipPos } from "../types/taf";
import { getTooltipPosition } from "../utils/ui";

interface HoverTooltipOptions {
  delayMs?: number;
  width?: number;
  height?: number;
}

export function useHoverTooltip(options?: Readonly<HoverTooltipOptions>) {
  const delayMs = options?.delayMs ?? 500;
  const width = options?.width ?? 120;
  const height = options?.height ?? 32;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showTooltip && btnRef.current) {
      setTooltipPos(getTooltipPosition(btnRef.current, width, height));
    }
  }, [showTooltip, width, height]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowTooltip(true), delayMs);
  };

  const onMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setShowTooltip(false);
  };

  return { btnRef, showTooltip, tooltipPos, onMouseEnter, onMouseLeave, setShowTooltip };
}
