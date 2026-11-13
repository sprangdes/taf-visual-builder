import { useEffect, type RefObject } from "react";

/** Distance over which the header's backdrop fades in. */
const RANGE_PX = 120;

/**
 * Writes the scroll progress (0 at the top … 1 after RANGE_PX) as --scroll-p on the element, once per
 * frame while scrolling. Driving the header from a CSS variable keeps the fade continuous with the
 * scroll and never re-renders React.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    let frame = 0;
    let last = -1;
    const update = () => {
      frame = 0;
      const t = Math.min(1, Math.max(0, window.scrollY / RANGE_PX));
      // Ease out so the backdrop starts gently and settles smoothly.
      const p = Math.round((1 - (1 - t) ** 2) * 1000) / 1000;
      if (p === last) return;
      last = p;
      el.style.setProperty("--scroll-p", String(p));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
