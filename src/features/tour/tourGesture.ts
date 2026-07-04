export type TourGesture = "collapse" | "expand" | null;

export function getTourGesture(deltaX: number, deltaY: number, threshold = 40): TourGesture {
  if (Math.abs(deltaY) < threshold || Math.abs(deltaX) > Math.abs(deltaY)) return null;
  return deltaY > 0 ? "collapse" : "expand";
}
