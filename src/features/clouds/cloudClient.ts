import { renderCloudLayer, type CloudLayerSpec } from "./cloudRenderer";

type Pending = (bitmap: ImageBitmap | null) => void;

/** One worker per cloud layer (a scene shows at most three), fewer on devices with few cores. */
const MAX_WORKERS = 3;

let workers: Worker[] | undefined;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorkers(): Worker[] {
  if (workers) return workers;
  workers = [];
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return workers;
  const cores = typeof navigator === "undefined" ? 2 : navigator.hardwareConcurrency || 2;
  const count = Math.min(MAX_WORKERS, Math.max(1, cores - 1));
  try {
    for (let i = 0; i < count; i += 1) {
      const worker = new Worker(new URL("./cloudWorker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<{ id: number; bitmap: ImageBitmap | null }>) => {
        pending.get(event.data.id)?.(event.data.bitmap);
        pending.delete(event.data.id);
      };
      workers.push(worker);
    }
  } catch {
    // Keep whichever workers started; with none, rendering falls back to the main thread.
  }
  return workers;
}

/**
 * Renders a cloud layer, off the main thread when the browser supports it (Worker + OffscreenCanvas),
 * otherwise on the main thread. `slot` identifies the layer on screen: layers render in parallel on
 * separate workers, a layer always goes to the same worker (which keeps its shape cached for re-lighting),
 * and a newer request for a slot replaces one still waiting. Resolves with null when the request was
 * replaced or where canvases are unavailable (e.g. tests).
 */
export function requestCloudBitmap(spec: CloudLayerSpec, slot = 0): Promise<ImageBitmap | null> {
  const pool = getWorkers();
  if (pool.length > 0) {
    const id = nextId++;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      pool[slot % pool.length].postMessage({ id, slot, spec });
    });
  }
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") return Promise.resolve(null);
  const canvas = new OffscreenCanvas(spec.width, spec.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  renderCloudLayer(ctx, spec, (cw, ch) => new OffscreenCanvas(cw, ch).getContext("2d")!);
  return Promise.resolve(canvas.transferToImageBitmap());
}
