import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollTargetIntoView } from "./tourScroll";

function placeTarget(top: number, height: number) {
  const target = document.createElement("div");
  target.getBoundingClientRect = () => ({ top, bottom: top + height, height, width: 300, left: 0, right: 300, x: 0, y: top, toJSON: () => ({}) });
  document.body.append(target);
  return target;
}

describe("scrollTargetIntoView", () => {
  const scrollTo = vi.fn();
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;

  afterEach(() => {
    scrollTo.mockReset();
    document.body.innerHTML = "";
  });

  it("leaves targets that are already in the uncovered band", () => {
    expect(scrollTargetIntoView(placeTarget(100, 200), 600)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("centres a target hidden behind the tour card above the card", () => {
    // Band is 12..588 (576px); a 200px target centred in it starts at 200.
    expect(scrollTargetIntoView(placeTarget(900, 200), 600)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 700, behavior: "smooth" });
  });

  it("aligns tall targets to the top of the band", () => {
    scrollTargetIntoView(placeTarget(900, 1000), 600);
    expect(scrollTo).toHaveBeenCalledWith({ top: 888, behavior: "smooth" });
  });

  it("ignores targets that are not laid out", () => {
    const target = document.createElement("div");
    document.body.append(target);
    expect(scrollTargetIntoView(target, 600)).toBe(false);
  });
});
