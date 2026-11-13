import { useLayoutEffect, useRef } from "react";

const MOVE_MS = 420;

/**
 * Drives a single glass "thumb" for a segmented control: it measures the selected child
 * (aria-pressed="true" or .is-on) and writes its box as CSS variables on the container, where
 * a ::before pseudo-element slides between options on a spring. While it travels the container
 * gets .is-moving so the thumb can swell like a liquid lens.
 *
 * Pass the selected key so the hook re-measures when the selection changes.
 */
export function useGlassIndicator<T extends HTMLElement>(selectedKey: unknown) {
  const ref = useRef<T>(null);
  const placedRef = useRef(false);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const place = (animate: boolean) => {
      const active = container.querySelector<HTMLElement>(':scope > [aria-pressed="true"], :scope > .is-on');
      if (!active) {
        container.style.setProperty("--ind-o", "0");
        return;
      }
      const style = container.style;
      const next = [active.offsetLeft, active.offsetTop, active.offsetWidth, active.offsetHeight].map((v) => `${v}px`);
      const moved = style.getPropertyValue("--ind-x") !== next[0] || style.getPropertyValue("--ind-y") !== next[1];
      style.setProperty("--ind-x", next[0]);
      style.setProperty("--ind-y", next[1]);
      style.setProperty("--ind-w", next[2]);
      style.setProperty("--ind-h", next[3]);
      style.setProperty("--ind-o", "1");
      if (animate && moved) {
        container.classList.add("is-moving");
        clearTimeout(moveTimerRef.current);
        moveTimerRef.current = setTimeout(() => container.classList.remove("is-moving"), MOVE_MS);
      }
    };

    place(placedRef.current);
    if (!placedRef.current) {
      placedRef.current = true;
      // Enable transitions only after the first placement so the thumb does not fly in.
      requestAnimationFrame(() => container.classList.add("is-ready"));
    }

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(container);
    return () => observer.disconnect();
  }, [selectedKey]);

  useLayoutEffect(() => () => clearTimeout(moveTimerRef.current), []);

  return ref;
}
