import { describe, expect, it } from "vitest";
import { getTourSteps, tourCatalog, validateTourCatalog } from "./tourDefinitions";

describe("tour definitions", () => {
  it("contains valid unique steps", () => {
    expect(validateTourCatalog(tourCatalog)).toEqual([]);
  });

  it("turns desktop tasks into passive mobile steps", () => {
    const desktop = getTourSteps("quick-start", false);
    const mobile = getTourSteps("quick-start", true);

    expect(desktop.find((step) => step.id === "create-change")?.taskEvent).toBe("timeline-range-created");
    expect(mobile.find((step) => step.id === "create-change")?.taskEvent).toBeUndefined();
  });

  it("offers all three entry-point groups", () => {
    expect(tourCatalog.map((tour) => tour.group)).toEqual([
      "quick-start",
      "new-features",
      "topic-help",
      "topic-help",
    ]);
  });
});
