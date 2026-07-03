import { describe, expect, it } from "vitest";
import { zhTW } from "../i18n/translations";
import { getTourSteps, tourCatalog, validateTourCatalog } from "./tourDefinitions";

describe("tour definitions", () => {
  it("returns Traditional Chinese copy without changing step identity", () => {
    const steps = getTourSteps("quick-start", false, zhTW.tour);
    expect(steps[0]).toMatchObject({ id: "forecast-context", target: '[data-tour-id="context"]', title: "預報基本資料" });
    expect(steps.at(-1)?.title).toBe("產生的 TAF");
  });
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
