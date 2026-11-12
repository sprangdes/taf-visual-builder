import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TourStrip from "./TourStrip";
import { scrollTargetIntoView } from "./tourScroll";
import type { GuidedTourStep, TourPeriod } from "./types";

/** How long to wait for a step's target to render before skipping the step. */
export const TARGET_TIMEOUT_MS = 1500;
const POLL_MS = 50;
const SPOTLIGHT_PADDING = 8;

interface TourRunnerProps {
  steps: GuidedTourStep[];
  isMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectPeriod: (period: TourPeriod) => void;
  onFinish: () => void;
}

interface Spotlight {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

function measure(target: Element): Spotlight | null {
  const rect = target.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
    radius: Math.min(radius + SPOTLIGHT_PADDING, 40),
  };
}

function sameSpotlight(a: Spotlight | null, b: Spotlight | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5
    && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5 && a.radius === b.radius;
}

/**
 * Walks through the steps: selects the right editor period, waits for the target,
 * scrolls it clear of the sticky header and the tour card, and keeps a spotlight on it.
 */
export default function TourRunner({ steps, isMobile, isCollapsed, onToggleCollapsed, onSelectPeriod, onFinish }: Readonly<TourRunnerProps>) {
  const [position, setPosition] = useState({ index: 0, direction: 1 as 1 | -1 });
  const [resolved, setResolved] = useState<{ index: number; element: Element } | null>(null);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const { index, direction } = position;
  const step = steps[index];
  const target = resolved?.index === index ? resolved.element : null;

  const goTo = useCallback((next: number, nextDirection: 1 | -1) => {
    if (next >= steps.length) {
      onFinish();
      return;
    }
    setPosition({ index: Math.max(0, next), direction: nextDirection });
  }, [onFinish, steps.length]);

  // Prepare the editor for this step, then wait for its target to appear.
  useEffect(() => {
    if (!step) return;
    if (step.period) onSelectPeriod(step.period);
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const look = () => {
      const element = document.querySelector(step.target);
      if (element) {
        setResolved({ index, element });
        scrollTargetIntoView(element, stripRef.current?.getBoundingClientRect().top ?? null);
        return;
      }
      if (Date.now() - started >= TARGET_TIMEOUT_MS) {
        console.warn(`[guided-tour] Skipping unavailable step: ${step.id}`);
        // Going back past the first available step turns around instead of ending the tour.
        goTo(index + direction < 0 ? index + 1 : index + direction, index + direction < 0 ? 1 : direction);
        return;
      }
      timer = setTimeout(look, POLL_MS);
    };
    // Give React one tick to render the newly selected period before looking.
    timer = setTimeout(look, 0);
    return () => clearTimeout(timer);
  }, [direction, goTo, index, onSelectPeriod, step]);

  // Keep the spotlight glued to the target while the page scrolls, resizes or re-renders.
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const tick = () => {
      const next = measure(target);
      setSpotlight((current) => (sameSpotlight(current, next) ? current : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  // Leave room at the end of the page so the last sections can scroll clear of the tour card.
  useEffect(() => {
    document.body.classList.add("tour-running");
    return () => document.body.classList.remove("tour-running");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onFinish();
      } else if (!isEditable(event.target) && event.key === "ArrowRight") {
        goTo(index + 1, 1);
      } else if (!isEditable(event.target) && event.key === "ArrowLeft" && index > 0) {
        goTo(index - 1, -1);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goTo, index, onFinish]);

  if (!step) return null;
  const dimmed = !(isMobile && isCollapsed);

  return createPortal(
    <>
      {spotlight && (
        <div
          className={`tour-spotlight ${dimmed ? "" : "is-undimmed"}`}
          data-testid="tour-spotlight"
          aria-hidden="true"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: spotlight.radius,
          }}
        />
      )}
      <div className="tour-dock">
        <TourStrip
          ref={stripRef}
          index={index}
          size={steps.length}
          title={step.title}
          content={isMobile && step.mobileContent ? step.mobileContent : step.content}
          isMobile={isMobile}
          isCollapsed={isCollapsed}
          onToggleCollapsed={onToggleCollapsed}
          onBack={() => goTo(index - 1, -1)}
          onNext={() => goTo(index + 1, 1)}
          onClose={onFinish}
        />
      </div>
    </>,
    document.body,
  );
}
