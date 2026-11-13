/// <reference lib="webworker" />
import { renderCloudLayer, type CloudLayerSpec } from "./cloudRenderer";

/** Renders cloud layers off the main thread and hands the bitmaps back without copying. */
self.onmessage = (event: MessageEvent<{ id: number; spec: CloudLayerSpec }>) => {
  const { id, spec } = event.data;
  const canvas = new OffscreenCanvas(spec.width, spec.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  renderCloudLayer(ctx, spec, (w, h) => new OffscreenCanvas(w, h).getContext("2d")!);
  const bitmap = canvas.transferToImageBitmap();
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, bitmap }, [bitmap]);
};
