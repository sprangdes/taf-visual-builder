import { describe, expect, it } from "vitest";
import { getTourGesture } from "./tourGesture";

describe("getTourGesture", () => {
  it("recognizes vertical swipes at the threshold", () => {
    expect(getTourGesture(5, 40)).toBe("collapse");
    expect(getTourGesture(5, -40)).toBe("expand");
  });

  it("ignores short and predominantly horizontal gestures", () => {
    expect(getTourGesture(0, 39)).toBeNull();
    expect(getTourGesture(60, 45)).toBeNull();
  });
});
