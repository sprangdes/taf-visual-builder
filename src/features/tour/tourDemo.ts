import type { TAF } from "../../types/taf";
import type { TourEditorSnapshot } from "./types";

export function createTourDemoTaf(issueTime: string): TAF {
  return {
    station: "RCTP",
    issueTime,
    base: {
      wind: { dir: 180, speed: 12, gust: 20 },
      visibility: 8000,
      weather: ["RA"],
      clouds: [{ id: "base-cloud-1", amount: "FEW", height: 20 }],
    },
    changes: [
      {
        type: "TEMPO",
        from: "2",
        to: "5",
        state: {
          wind: { dir: 200, speed: 15, gust: 25 },
          visibility: 6000,
          weather: ["RA"],
          clouds: [{ id: "chg-cloud-1", amount: "BKN", height: 25 }],
          enabledBlocks: { wind: true, vis: true, clouds: true },
        },
      },
    ],
  };
}

export function cloneTourSnapshot(snapshot: TourEditorSnapshot): TourEditorSnapshot {
  return structuredClone(snapshot);
}
