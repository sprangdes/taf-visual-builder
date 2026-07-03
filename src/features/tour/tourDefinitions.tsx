import type { GuidedTourStep, TourDefinition, TourId } from "./types";
import { en, type TourCopy } from "../i18n/translations";

function quickStartSteps(copy: TourCopy): GuidedTourStep[] {
  return [
  { id: "forecast-context", target: '[data-tour-id="context"]', ...copy.steps.context },
  { id: "base-forecast", target: '[data-tour-id="base"]', ...copy.steps.base },
  { id: "wind", target: '[data-tour-id="wind"]', ...copy.steps.wind },
  { id: "visibility", target: '[data-tour-id="visibility"]', ...copy.steps.visibility },
  { id: "clouds", target: '[data-tour-id="clouds"]', ...copy.steps.clouds },
  {
    id: "create-change",
    target: '[data-tour-id="timeline"]',
    ...copy.steps.createChange,
    mobileContent: copy.steps.createChange.content,
  },
  { id: "selected-change", target: '[data-tour-id="selected-change"]', ...copy.steps.selectedChange },
  { id: "change-type", target: '[data-tour-id="change-type"]', ...copy.steps.changeType },
  { id: "generated-output", target: '[data-tour-id="output"]', ...copy.steps.output },
  ];
}

export function getTourCatalog(copy: TourCopy = en.tour): TourDefinition[] {
  const steps = quickStartSteps(copy);
  return [
    { id: "quick-start", group: "quick-start", ...copy.catalog.quickStart, steps },
    { id: "new-features", group: "new-features", ...copy.catalog.newFeatures, steps: steps.slice(5) },
    { id: "topic-timeline", group: "topic-help", ...copy.catalog.timeline, steps: steps.slice(5, 8) },
    { id: "topic-output", group: "topic-help", ...copy.catalog.output, steps: steps.slice(8) },
  ];
}

export const tourCatalog = getTourCatalog();

export function getTourSteps(id: TourId, isMobile: boolean, copy: TourCopy = en.tour): GuidedTourStep[] {
  const definition = getTourCatalog(copy).find((tour) => tour.id === id);
  if (!definition) return [];
  return definition.steps.map((step) => ({
    ...step,
    content: isMobile && step.mobileContent ? step.mobileContent : step.content,
  }));
}

export function validateTourCatalog(catalog: TourDefinition[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const tour of catalog) {
    for (const step of tour.steps) {
      const qualifiedId = `${tour.id}:${step.id}`;
      if (ids.has(qualifiedId)) errors.push(`Duplicate step ID: ${qualifiedId}`);
      ids.add(qualifiedId);
      if (!step.target.startsWith('[data-tour-id="')) errors.push(`Invalid target: ${qualifiedId}`);
    }
  }
  return errors;
}
