export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getTooltipPosition(
  btn: HTMLButtonElement | null,
  tooltipWidth = 120,
  tooltipHeight = 32,
): { top: number; left: number } {
  const padding = 8;

  if (!btn) return { top: 0, left: 0 };

  const rect = btn.getBoundingClientRect();
  const maxLeft = window.innerWidth - tooltipWidth - padding;
  const maxTop = window.innerHeight - tooltipHeight - padding;
  const rightLeft = rect.right + padding;
  const rightTop = rect.top + rect.height / 2 - tooltipHeight / 2;
  const overflowsRight = rightLeft + tooltipWidth > window.innerWidth - padding;
  const overflowsBottom = rect.bottom + tooltipHeight > window.innerHeight - padding;
  const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  const aboveTop = rect.top - tooltipHeight;
  const belowTop = rect.bottom + padding;

  let rawLeft: number;
  let rawTop: number;

  if (overflowsRight || overflowsBottom) {
    rawLeft = centeredLeft;
    rawTop = aboveTop < padding ? belowTop : aboveTop;
  } else {
    rawLeft = rightLeft;
    rawTop = rightTop;
  }

  return {
    left: clamp(rawLeft, padding, maxLeft),
    top: clamp(rawTop, padding, maxTop),
  };
}
