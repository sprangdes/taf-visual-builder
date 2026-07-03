import { describe, expect, it } from "vitest";
import { getTourSteps, tourCatalog, validateTourCatalog } from "./tourDefinitions";

describe("tour definitions", () => {
  it("contains valid unique steps", () => {
    expect(validateTourCatalog(tourCatalog)).toEqual([]);
  });

  it("keeps every desktop and mobile step passive", () => {
    for (const tour of tourCatalog) {
      expect(getTourSteps(tour.id, false).every((step) => !("taskEvent" in step))).toBe(true);
      expect(getTourSteps(tour.id, true).every((step) => !("taskEvent" in step))).toBe(true);
    }
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
