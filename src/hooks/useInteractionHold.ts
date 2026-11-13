import { useEffect } from "react";

export const INTERACTION_HOLD_CLASS = "scene-hold";
const HOLD_MS = 1200;
const SCROLL_SETTLE_MS = 600;
/** After a press the editor and scene update for a moment; frame-rate samples then are not representative. */
const PRESS_SETTLE_MS = 2000;

let lastScrollAt = Number.NEGATIVE_INFINITY;
let lastPressAt = Number.NEGATIVE_INFINITY;

/**
 * While the user types, the weather animation is held so every frame goes to the edit itself; it resumes
 * from the same position once typing stops. Clicks and scrolling do not hold it: freezing the background on
 * every button press read as a stutter, and the controls' own animations run on the compositor anyway.
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
    const onScroll = () => {
      lastScrollAt = performance.now();
    };
    const onPress = () => {
      lastPressAt = performance.now();
    };

    const holdEvents = ["keydown", "input"] as const;
    const scrollEvents = ["scroll", "wheel", "touchmove"] as const;
    holdEvents.forEach((name) => window.addEventListener(name, hold, { capture: true, passive: true }));
    scrollEvents.forEach((name) => window.addEventListener(name, onScroll, { capture: true, passive: true }));
    window.addEventListener("pointerdown", onPress, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPress, { capture: true });
      holdEvents.forEach((name) => window.removeEventListener(name, hold, { capture: true }));
      scrollEvents.forEach((name) => window.removeEventListener(name, onScroll, { capture: true }));
      window.clearTimeout(timer);
      root.classList.remove(INTERACTION_HOLD_CLASS);
    };
  }, [enabled]);
}

export function isInteractionHeld(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains(INTERACTION_HOLD_CLASS);
}

/**
 * True while the page is being scrolled or was just pressed (and briefly after). The animation keeps
 * running then, but frame-rate samples taken in that window are not representative of the device.
 */
export function isUserActive(): boolean {
  if (typeof performance === "undefined") return false;
  const now = performance.now();
  return now - lastScrollAt < SCROLL_SETTLE_MS || now - lastPressAt < PRESS_SETTLE_MS;
}
