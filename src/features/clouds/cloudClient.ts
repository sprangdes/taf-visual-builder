import { renderCloudLayer, type CloudLayerSpec } from "./cloudRenderer";

type Pending = (bitmap: ImageBitmap) => void;

let worker: Worker | null | undefined;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  worker = null;
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return worker;
  try {
    worker = new Worker(new URL("./cloudWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; bitmap: ImageBitmap }>) => {
      pending.get(event.data.id)?.(event.data.bitmap);
      pending.delete(event.data.id);
    };
  } catch {
    worker = null;
  }
  return worker;
}

/**
 * Renders a cloud layer, off the main thread when the browser supports it (Worker + OffscreenCanvas),
 * otherwise on the main thread. Resolves with null where canvases are unavailable (e.g. tests).
 */
export function requestCloudBitmap(spec: CloudLayerSpec): Promise<ImageBitmap | null> {
  const w = getWorker();
  if (w) {
    const id = nextId++;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      w.postMessage({ id, spec });
    });
  }
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") return Promise.resolve(null);
  const canvas = new OffscreenCanvas(spec.width, spec.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  renderCloudLayer(ctx, spec, (cw, ch) => new OffscreenCanvas(cw, ch).getContext("2d")!);
  return Promise.resolve(canvas.transferToImageBitmap());
}
