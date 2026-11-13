import type { TAF } from "../../types/taf";

export type TourId = "quick-start" | "new-features" | "topic-timeline" | "topic-output";
export type TourGroup = "quick-start" | "new-features" | "topic-help";

/** Which editor period must be selected before a step's target is shown. */
export type TourPeriod = "base" | "change";

export interface GuidedTourStep {
  id: string;
  target: `[data-tour-id="${string}"]`;
  title: string;
  content: string;
  mobileContent?: string;
  period?: TourPeriod;
}

export interface TourDefinition {
  id: TourId;
  group: TourGroup;
  label: string;
  description: string;
  steps: GuidedTourStep[];
}

export interface TourEditorSnapshot {
  taf: TAF;
  selectedChangeIndex: number | null;
}

export interface TourEditorAdapter {
  capture(): TourEditorSnapshot;
  loadDemo(): void;
  restore(snapshot: TourEditorSnapshot): void;
  /** Select the base forecast or the first change period so the step's target is on screen. */
  selectPeriod(period: TourPeriod): void;
}
