import { useEffect, useRef, type CSSProperties } from "react";

interface RasterLayerProps {
  /** A complete, self-contained SVG document. */
  svg: string;
  /** Pixel size the SVG is rasterised at; CSS scales the canvas up to cover the viewport. */
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Draws an SVG into a canvas once per change. Filter-heavy layers (turbulence clouds, mist)
 * are expensive to rasterise, and as live SVG the browser re-rasterises them at full screen
 * resolution whenever anything about them changes. Drawing them into a small canvas fixes
 * the resolution and keeps the result as a plain bitmap that moves on the compositor.
 * The previous bitmap stays on screen until the new one is ready, so updates never flash.
 */
export default function RasterLayer({ svg, width, height, className = "", style }: Readonly<RasterLayerProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof Image === "undefined") return;
    const image = new Image();
    // Test DOMs cannot decode or draw images.
    if (typeof image.decode !== "function") return;
    let cancelled = false;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    image
      .decode()
      .then(() => new Promise<void>((resolve) => {
        // Rasterising the filters blocks the main thread; wait two frames so whatever the click that
        // changed the scene started (e.g. a control's slide) is committed to the compositor first.
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }))
      .then(() => {
        if (cancelled) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [height, svg, width]);

  return (
    <div className={`weather-scene-layer ${className}`} style={style}>
      <canvas ref={canvasRef} className="weather-scene-raster" width={width} height={height} />
    </div>
  );
}
