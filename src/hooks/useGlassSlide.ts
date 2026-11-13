import { useLayoutEffect, useRef } from "react";

/**
 * Sampled physical spring (stiffness 380, damping 30): settles in ~0.42s with a ~2% overshoot, so the
 * lens wobbles like liquid without visibly running past the ends of the control.
 */
const SPRING_LINEAR =
  "linear(0, 0.028, 0.098, 0.193, 0.299, 0.409, 0.514, 0.61, 0.697, 0.771, 0.833, 0.884, 0.925, 0.957, 0.98, 0.997, 1.009, 1.017, 1.021, 1.023, 1.023, 1.021, 1.019, 1.017, 1.015, 1.012, 1.01, 1.008, 1.006, 1.004, 1.003, 1.002, 1)";
const SPRING_FALLBACK = "cubic-bezier(.3, 1.15, .5, 1)";
const DURATION_MS = 440;

function springEasing(): string {
  return typeof CSS !== "undefined" && CSS.supports?.("animation-timing-function", "linear(0, 1)") ? SPRING_LINEAR : SPRING_FALLBACK;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Slides a segmented control's glass lens to the selected option.
 *
 * The container holds one persistent `.lg-thumb` (with a `.lg-thumb-glass` child). On every selection
 * change the lens is snapped to the new option, then animated back from where it was *visually*
 * (including any animation still in flight) using FLIP and the Web Animations API. Only `transform`
 * is animated, so browsers run it on the compositor: it stays smooth even while the main thread is
 * busy re-rendering the editor or redrawing the weather scene.
 */
export function useGlassSlide<T extends HTMLElement>(selectedKey: unknown) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const container = ref.current;
    const thumb = container?.querySelector<HTMLElement>(":scope > .lg-thumb");
    const glass = thumb?.querySelector<HTMLElement>(".lg-thumb-glass");
    if (!container || !thumb || !glass) return;

    const place = (animate: boolean) => {
      const active = container.querySelector<HTMLElement>(':scope > [aria-pressed="true"]');
      if (!active) {
        thumb.style.opacity = "0";
        return;
      }
      const wasPlaced = thumb.dataset.placed === "1";
      // Read where the lens is on screen right now, mid-animation included, before moving it.
      const from = wasPlaced ? thumb.getBoundingClientRect() : null;
      thumb.getAnimations?.().forEach((animation) => animation.cancel());
      glass.getAnimations?.().forEach((animation) => animation.cancel());

      thumb.style.left = `${active.offsetLeft}px`;
      thumb.style.top = `${active.offsetTop}px`;
      thumb.style.width = `${active.offsetWidth}px`;
      thumb.style.height = `${active.offsetHeight}px`;
      thumb.style.opacity = "1";
      thumb.dataset.placed = "1";

      if (!animate || !from || typeof thumb.animate !== "function" || prefersReducedMotion()) return;
      const to = thumb.getBoundingClientRect();
      if (!to.width || !to.height) return;
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      const sx = from.width / to.width;
      const sy = from.height / to.height;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;

      const timing = { duration: DURATION_MS, easing: springEasing() };
      thumb.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: "none" }], timing);
      // The lens swells as it lands and settles like a drop of liquid.
      glass.animate([{ transform: "scale(1.06, 1.14)" }, { transform: "none" }], timing);
    };

    place(true);
    if (typeof ResizeObserver === "undefined") return;
    // Layout changes (fonts, wrapping, resizing) re-place the lens without animating. The observer
    // also fires once on observe(); skipping unchanged sizes keeps that from cancelling the slide.
    let size = `${container.offsetWidth}x${container.offsetHeight}`;
    const observer = new ResizeObserver(() => {
      const next = `${container.offsetWidth}x${container.offsetHeight}`;
      if (next === size) return;
      size = next;
      place(false);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [selectedKey]);

  return ref;
}
