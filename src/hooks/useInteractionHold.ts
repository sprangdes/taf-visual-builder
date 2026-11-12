import { useEffect } from "react";

export const INTERACTION_HOLD_CLASS = "scene-hold";
const HOLD_MS = 1200;

/**
 * While the user is typing, clicking, dragging or scrolling, the weather animation is held
 * so every frame goes to the edit itself. It resumes from the same position once input stops.
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

    const events = ["pointerdown", "keydown", "input", "wheel", "touchstart", "scroll"] as const;
    events.forEach((name) => window.addEventListener(name, hold, { capture: true, passive: true }));
    return () => {
      events.forEach((name) => window.removeEventListener(name, hold, { capture: true }));
      window.clearTimeout(timer);
      root.classList.remove(INTERACTION_HOLD_CLASS);
    };
  }, [enabled]);
}

export function isInteractionHeld(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains(INTERACTION_HOLD_CLASS);
}
