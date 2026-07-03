import type { GuidedTourStep, TourDefinition, TourId, TourTaskEvent } from "./types";

const quickStartSteps: GuidedTourStep[] = [
  { id: "forecast-context", target: '[data-tour-id="context"]', title: "Forecast context", content: "Enter the ICAO station and issue time." },
  { id: "base-forecast", target: '[data-tour-id="base"]', title: "Base forecast", content: "Set the prevailing conditions for the full validity period." },
  { id: "wind", target: '[data-tour-id="wind"]', title: "Wind", content: "Set direction, speed, and gust." },
  { id: "visibility", target: '[data-tour-id="visibility"]', title: "Visibility & weather", content: "Set visibility and select weather phenomena." },
  { id: "clouds", target: '[data-tour-id="clouds"]', title: "Cloud layers", content: "Choose cloud amount and height." },
  {
    id: "create-change",
    target: '[data-tour-id="timeline"]',
    title: "Create a change period",
    content: "Select a start and end hour on the timeline to continue.",
    mobileContent: "Use the timeline to create and review change periods.",
    taskEvent: "timeline-range-created",
  },
  { id: "selected-change", target: '[data-tour-id="selected-change"]', title: "Selected change", content: "Fine-tune only the conditions that change in this period." },
  { id: "change-type", target: '[data-tour-id="change-type"]', title: "Change type", content: "Switch between TEMPO, BECMG, and FM." },
  { id: "generated-output", target: '[data-tour-id="output"]', title: "Generated TAF", content: "The final TAF updates live as you edit." },
];

export const tourCatalog: TourDefinition[] = [
  { id: "quick-start", group: "quick-start", label: "Quick Start", description: "Learn the complete forecast workflow.", steps: quickStartSteps },
  { id: "new-features", group: "new-features", label: "New Features", description: "Review the new workbench workflow.", steps: quickStartSteps.slice(5) },
  { id: "topic-timeline", group: "topic-help", label: "Timeline Help", description: "Learn how change periods work.", steps: quickStartSteps.slice(5, 8) },
  { id: "topic-output", group: "topic-help", label: "Generated TAF Help", description: "Understand the live output.", steps: quickStartSteps.slice(8) },
];

export function getTourSteps(id: TourId, isMobile: boolean): GuidedTourStep[] {
  const definition = tourCatalog.find((tour) => tour.id === id);
  if (!definition) return [];
  return definition.steps.map((step) => ({
    ...step,
    content: isMobile && step.mobileContent ? step.mobileContent : step.content,
    taskEvent: isMobile ? undefined : step.taskEvent,
  }));
}

const knownTaskEvents = new Set<TourTaskEvent>(["timeline-range-created"]);

export function validateTourCatalog(catalog: TourDefinition[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const tour of catalog) {
    for (const step of tour.steps) {
      const qualifiedId = `${tour.id}:${step.id}`;
      if (ids.has(qualifiedId)) errors.push(`Duplicate step ID: ${qualifiedId}`);
      ids.add(qualifiedId);
      if (!step.target.startsWith('[data-tour-id="')) errors.push(`Invalid target: ${qualifiedId}`);
      if (step.taskEvent && !knownTaskEvents.has(step.taskEvent)) errors.push(`Unknown task event: ${qualifiedId}`);
    }
  }
  return errors;
}
