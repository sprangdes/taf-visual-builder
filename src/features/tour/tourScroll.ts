const GAP = 12;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isStuck(element: Element | null): element is Element {
  return !!element && getComputedStyle(element).position === "sticky";
}

/** The vertical band of the viewport that is not covered by the sticky header or the tour card. */
export function getVisibleBand(stripTop: number | null): { top: number; bottom: number } {
  const header = document.querySelector(".appbar-wrap");
  const top = isStuck(header) ? header.getBoundingClientRect().bottom + GAP : GAP;
  const bottom = (stripTop ?? window.innerHeight) - GAP;
  return { top, bottom };
}

/**
 * Scroll just enough to bring the target into the uncovered band, centred when it fits.
 * Returns false when no scrolling was needed.
 */
export function scrollTargetIntoView(target: Element, stripTop: number | null): boolean {
  if (typeof window.scrollTo !== "function") return false;
  const rect = target.getBoundingClientRect();
  // Not laid out (hidden, or a test DOM): nothing sensible to scroll to.
  if (rect.width === 0 && rect.height === 0) return false;
  // Targets inside the sticky header are always on screen.
  if (isStuck(target.closest(".appbar-wrap"))) return false;

  const band = getVisibleBand(stripTop);
  const space = band.bottom - band.top;
  if (space <= 0) return false;
  if (rect.top >= band.top && rect.bottom <= band.bottom) return false;

  const offset = rect.height <= space ? rect.top - band.top - (space - rect.height) / 2 : rect.top - band.top;
  window.scrollTo({ top: Math.max(0, window.scrollY + offset), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  return true;
}
