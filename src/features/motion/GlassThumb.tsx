import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

/** Physical spring for the selection lens: settles in ~0.45s with a small, liquid overshoot. */
export const GLASS_SPRING = { type: "spring", stiffness: 480, damping: 32, mass: 0.85 } as const;

export type ThumbTint = "tempo" | "becmg" | "fm";

interface GlassThumbProps {
  /** Shared by every option in one control, unique across controls. */
  layoutId: string;
  /** Render the lens inside this option. */
  show: boolean;
  tint?: ThumbTint;
}

/**
 * The selection lens of a segmented control. Each option renders a slot; only the selected one
 * shows the lens. Because every slot shares the layoutId, Motion moves the lens between options
 * with transforms only (compositor-friendly) and corrects its rounded corners while it stretches.
 * On arrival it swells and settles like a drop of liquid. Nothing animates on first render.
 */
export function GlassThumb({ layoutId, show, tint }: Readonly<GlassThumbProps>) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <m.span
          key="thumb"
          aria-hidden="true"
          layoutId={layoutId}
          className={`lg-thumb ${tint ? `lg-thumb--${tint}` : ""}`}
          style={{ borderRadius: 999 }}
          initial={{ scaleX: 1.06, scaleY: 1.14 }}
          animate={{ scaleX: 1, scaleY: 1 }}
          exit={{ opacity: 0, transition: { duration: 0 } }}
          transition={{ layout: GLASS_SPRING, default: { type: "spring", stiffness: 380, damping: 18, mass: 0.7 } }}
        />
      )}
    </AnimatePresence>
  );
}
