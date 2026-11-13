import { useSyncExternalStore } from "react";

const THRESHOLD = 4;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const read = () => window.scrollY > THRESHOLD;

/** True once the page has scrolled away from the top. Re-renders only when that flips. */
export function useScrolled(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
