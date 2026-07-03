import type { ReactNode } from "react";
import type { TAF } from "../../types/taf";

export type TourId = "quick-start" | "new-features" | "topic-timeline" | "topic-output";
export type TourGroup = "quick-start" | "new-features" | "topic-help";

export interface GuidedTourStep {
  id: string;
  target: `[data-tour-id="${string}"]`;
  title: string;
  content: ReactNode;
  mobileContent?: ReactNode;
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
}
