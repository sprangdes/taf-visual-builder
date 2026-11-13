/// <reference lib="webworker" />
import { renderCloudLayer, type CloudLayerSpec } from "./cloudRenderer";

interface Job {
  id: number;
  /** Requests for the same slot (one cloud layer on screen) supersede each other. */
  slot: number;
  spec: CloudLayerSpec;
}

const scope = self as unknown as DedicatedWorkerGlobalScope;
const queue = new Map<number, Job>();
let scheduled = false;

/**
 * Renders one job per task, so messages that arrived meanwhile are seen before the next render starts:
 * while a value is being changed quickly, only the newest spec of each layer is drawn.
 */
function drain() {
  scheduled = false;
  const next = queue.values().next();
  if (next.done) return;
  const { id, slot, spec } = next.value;
  queue.delete(slot);
  const canvas = new OffscreenCanvas(spec.width, spec.height);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    renderCloudLayer(ctx, spec, (w, h) => new OffscreenCanvas(w, h).getContext("2d")!);
    const bitmap = canvas.transferToImageBitmap();
    scope.postMessage({ id, bitmap }, [bitmap]);
  } else {
    scope.postMessage({ id, bitmap: null });
  }
  schedule();
}

function schedule() {
  if (scheduled || queue.size === 0) return;
  scheduled = true;
  setTimeout(drain, 0);
}

/** Renders cloud layers off the main thread and hands the bitmaps back without copying. */
scope.onmessage = (event: MessageEvent<Job>) => {
  const job = event.data;
  const superseded = queue.get(job.slot);
  if (superseded) scope.postMessage({ id: superseded.id, bitmap: null });
  queue.set(job.slot, job);
  schedule();
};
