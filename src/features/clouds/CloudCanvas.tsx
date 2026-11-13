import { useEffect, useRef, type CSSProperties } from "react";
import { requestCloudBitmap } from "./cloudClient";
import type { CloudLayerSpec } from "./cloudRenderer";

interface CloudCanvasProps {
  spec: CloudLayerSpec;
  className?: string;
  style?: CSSProperties;
}

/**
 * One cloud layer. The bitmap is rendered in a worker; the previous clouds stay on screen until the new
 * ones arrive, and replies for outdated specs are dropped.
 */
export default function CloudCanvas({ spec, className = "", style }: Readonly<CloudCanvasProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(spec);

  useEffect(() => {
    let current = true;
    requestCloudBitmap(JSON.parse(key) as CloudLayerSpec).then((bitmap) => {
      const canvas = canvasRef.current;
      if (!bitmap) return;
      if (!current || !canvas) {
        bitmap.close();
        return;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);
      }
      bitmap.close();
    });
    return () => {
      current = false;
    };
  }, [key]);

  return (
    <div className={`weather-scene-layer ${className}`} style={style}>
      <canvas ref={canvasRef} className="weather-scene-raster" width={spec.width} height={spec.height} />
    </div>
  );
}
