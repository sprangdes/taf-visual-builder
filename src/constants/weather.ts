import type { WeatherTrendType } from "../types/taf";

export const weatherOptions = [
  { code: " ", color: "bg-white" },
  { code: "+", color: "bg-blue-200" },
  { code: "-", color: "bg-blue-200" },
  { code: "VC", color: "bg-purple-200" },
  { code: "HZ", color: "bg-green-100" },
  { code: "BR", color: "bg-green-100" },
  { code: "FG", color: "bg-green-100" },
  { code: "DZ", color: "bg-yellow-100" },
  { code: "RA", color: "bg-yellow-100" },
  { code: "SH", color: "bg-yellow-100" },
  { code: "SN", color: "bg-yellow-100" },
  { code: "TS", color: "bg-red-100" },
];

export const colorByType: Record<WeatherTrendType, string> = {
  TEMPO: "type-tone-tempo",
  BECMG: "type-tone-becmg",
  FM: "type-tone-fm",
};

export const timelineColorByType: Record<WeatherTrendType, string> = {
  TEMPO: "timeline-tone-tempo",
  BECMG: "timeline-tone-becmg",
  FM: "timeline-tone-fm",
};

export const cloudAmountOptions = ["FEW", "SCT", "BKN", "OVC"];

export const visibilityOptions = [
  50, 60, 80, 100, 200, 240, 300, 400, 480, 600, 800, 1000, 1200, 1400, 1600,
  2000, 2400, 2800, 3000, 3200, 4000, 4800, 5000, 6000, 7000, 8000, 9000,
  10000,
];
