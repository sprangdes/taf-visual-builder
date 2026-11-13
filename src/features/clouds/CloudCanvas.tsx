import { useEffect, useRef, type CSSProperties } from "react";
import { requestCloudBitmap } from "./cloudClient";
import type { CloudLayerSpec } from "./cloudRenderer";

interface CloudCanvasProps {
  spec: CloudLayerSpec;
  /** Position of the layer in the scene; each slot renders on its own worker. */
  slot: number;
  /**
   * Seconds for the clouds to travel one full screen-width (they wrap round). 0 = still.
   */
  driftSeconds: number;
  /** +1 = towards the right of the screen, -1 = towards the left. */
  driftDirection: 1 | -1;
  /** Steps per second for the drift (kept low: each step re-blurs the glass panels above). */
  driftFps: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * One cloud layer that drifts with the wind. The bitmap (rendered in a worker) tiles horizontally, so two
 * copies sit side by side on a strip that moves one tile-width per loop: a seamless, endless drift that
 * runs on the compositor. The previous clouds stay on screen until new ones arrive; replies for outdated
 * specs are dropped.
 */
export default function CloudCanvas({ spec, slot, driftSeconds, driftDirection, driftFps, className = "", style }: Readonly<CloudCanvasProps>) {
  const firstRef = useRef<HTMLCanvasElement>(null);
  const secondRef = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(spec);

  useEffect(() => {
    let current = true;
    requestCloudBitmap(JSON.parse(key) as CloudLayerSpec, slot).then((bitmap) => {
      if (!bitmap) return;
      const canvases = [firstRef.current, secondRef.current];
      if (!current || canvases.some((c) => !c)) {
        bitmap.close();
        return;
      }
      for (const canvas of canvases) {
        const ctx = canvas!.getContext("2d");
        if (!ctx) continue;
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        ctx.drawImage(bitmap, 0, 0);
      }
      bitmap.close();
    });
    return () => {
      current = false;
    };
  }, [key, slot]);

  const moving = driftSeconds > 0;
  const stripStyle = {
    "--cloud-aspect": spec.width / spec.height,
    ...(moving
      ? {
          animationDuration: `${driftSeconds}s`,
          animationTimingFunction: `steps(${Math.max(1, Math.round(driftSeconds * driftFps))})`,
          animationDirection: driftDirection > 0 ? "reverse" : "normal",
        }
      : { animation: "none", willChange: "auto" }),
  } as unknown as CSSProperties;

  return (
    <div className={`weather-scene-layer weather-cloud-frame ${className}`} style={style}>
      <div className="weather-cloud-strip" style={stripStyle}>
        <canvas ref={firstRef} className="weather-cloud-tile" width={spec.width} height={spec.height} />
        <canvas ref={secondRef} className="weather-cloud-tile" width={spec.width} height={spec.height} aria-hidden="true" />
      </div>
    </div>
  );
}
