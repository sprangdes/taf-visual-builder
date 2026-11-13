import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// The animation engine is split into its own chunk and fetched after first paint;
// motion elements render normally (just without animating) until it arrives.
const loadFeatures = () => import("./features").then((mod) => mod.default);

export function MotionProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
