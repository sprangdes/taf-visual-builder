import { useEffect } from "react";

export const INTERACTION_HOLD_CLASS = "scene-hold";
const HOLD_MS = 1200;
const SCROLL_SETTLE_MS = 600;

let lastScrollAt = Number.NEGATIVE_INFINITY;

/**
 * While the user edits (types, clicks, presses a mouse button), the weather animation is held
 * so every frame goes to the edit itself. It resumes from the same position once input stops.
 * Scrolling does not hold it: the glass panels are redrawn on every scroll frame anyway, so
 * the animation adds little on top and stopping it would look broken.
 * Implemented with a class on <html> instead of React state so it never re-renders the app.
 */
export function useInteractionHold(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const root = document.documentElement;
    let timer: number | undefined;

    const hold = () => {
      root.classList.add(INTERACTION_HOLD_CLASS);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.classList.remove(INTERACTION_HOLD_CLASS), HOLD_MS);
    };
    // A finger on the screen usually starts a scroll; taps still hold through "click".
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") hold();
    };
    const onScroll = () => {
      lastScrollAt = performance.now();
    };

    const holdEvents = ["click", "keydown", "input"] as const;
    const scrollEvents = ["scroll", "wheel", "touchmove"] as const;
    holdEvents.forEach((name) => window.addEventListener(name, hold, { capture: true, passive: true }));
    window.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    scrollEvents.forEach((name) => window.addEventListener(name, onScroll, { capture: true, passive: true }));
    return () => {
      holdEvents.forEach((name) => window.removeEventListener(name, hold, { capture: true }));
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      scrollEvents.forEach((name) => window.removeEventListener(name, onScroll, { capture: true }));
      window.clearTimeout(timer);
      root.classList.remove(INTERACTION_HOLD_CLASS);
    };
  }, [enabled]);
}

export function isInteractionHeld(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains(INTERACTION_HOLD_CLASS);
}

/** True while the page is being scrolled (and briefly after). Frame-rate samples taken then are not representative. */
export function isScrolling(): boolean {
  return typeof performance !== "undefined" && performance.now() - lastScrollAt < SCROLL_SETTLE_MS;
}
