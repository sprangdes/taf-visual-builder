import type { WeatherState } from "../types/taf";
import { getWeatherGroups } from "./weather";

export type PrecipitationKind = "rain" | "drizzle" | "snow";

export interface SceneCloudLayer {
  /** Vertical band on screen, 0 = top, 1 = bottom. */
  top: number;
  bottom: number;
  /** 0–1 coverage (FEW → OVC). */
  cover: number;
  /** Cumulonimbus or towering cumulus. */
  convective: boolean;
  /** Cloud base in hundreds of feet. */
  height: number;
}

export interface WeatherSceneParams {
  /** 0 = clear daylight, 1 = dark storm. */
  darkness: number;
  layers: SceneCloudLayer[];
  precipitation: { kind: PrecipitationKind; intensity: 0 | 1 | 2; showers: boolean } | null;
  thunder: boolean;
  /** 0–1 mist / fog density derived from visibility and BR/FG. */
  fog: number;
  haze: boolean;
  /** Degrees the precipitation leans; positive values drift to the right. */
  slant: number;
  /** Signed horizontal drift for clouds: positive = to the right. */
  drift: number;
  windSpeed: number;
}

const COVER_BY_AMOUNT: Record<string, number> = { FEW: 0.18, SCT: 0.42, BKN: 0.7, OVC: 1 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloudBand(height: number, convective: boolean): { top: number; bottom: number } {
  const center = 0.7 - (clamp(height, 0, 100) / 100) * 0.58;
  if (convective) return { top: 0, bottom: Math.min(0.62, center + 0.12) };
  return { top: Math.max(0, center - 0.11), bottom: Math.min(0.92, center + 0.11) };
}

function fogFromVisibility(visibility: number): number {
  if (visibility >= 8000) return 0;
  if (visibility <= 200) return 0.9;
  const t = (Math.log(8000) - Math.log(visibility)) / (Math.log(8000) - Math.log(200));
  return clamp(t * 0.9, 0, 0.9);
}

export function getWeatherSceneParams(state: WeatherState): WeatherSceneParams {
  const groups = getWeatherGroups(state.weather || []);
  const codes = groups.join(" ");
  const has = (code: string) => codes.includes(code);

  let precipitation: WeatherSceneParams["precipitation"] = null;
  const precipGroup = groups.find((group) => /RA|DZ|SN/.test(group));
  if (precipGroup) {
    const kind: PrecipitationKind = precipGroup.includes("SN") ? "snow" : precipGroup.includes("RA") ? "rain" : "drizzle";
    const intensity = precipGroup.startsWith("-") ? 0 : precipGroup.startsWith("+") ? 2 : 1;
    precipitation = { kind, intensity, showers: precipGroup.includes("SH") };
  }
  const thunder = has("TS");

  const layers = (state.clouds || [])
    .filter((cloud) => COVER_BY_AMOUNT[cloud.amount] !== undefined)
    .slice(0, 3)
    .map((cloud) => {
      const convective = Boolean(cloud.cb || cloud.tcu);
      return { ...cloudBand(cloud.height, convective), cover: COVER_BY_AMOUNT[cloud.amount], convective, height: cloud.height };
    });

  const maxCover = layers.reduce((max, layer) => Math.max(max, layer.cover), 0);
  const convective = layers.some((layer) => layer.convective);
  const darkness = clamp(
    maxCover * 0.45 + (convective ? 0.25 : 0) + (thunder ? 0.2 : 0) + (precipitation ? 0.1 + precipitation.intensity * 0.05 : 0),
    0,
    1,
  );

  let fog = fogFromVisibility(state.visibility);
  if (has("FG")) fog = Math.max(fog, 0.75);
  if (has("BR")) fog = Math.max(fog, 0.4);

  const speed = Math.max(0, state.wind?.speed ?? 0);
  const dirRad = ((state.wind?.dir ?? 0) * Math.PI) / 180;
  // Wind direction is where the wind comes FROM; precipitation travels the opposite way.
  const towardEast = speed === 0 ? 0 : -Math.sin(dirRad);
  const slant = Math.round(clamp(speed / 30, 0, 1) * 28 * towardEast);

  return {
    darkness,
    layers,
    precipitation,
    thunder,
    fog,
    haze: has("HZ"),
    slant,
    drift: towardEast,
    windSpeed: speed,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function mixColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mixed = a.map((channel, index) => Math.round(channel + (b[index] - channel) * clamp(t, 0, 1)));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Deterministic pseudo-random numbers so the scene does not reshuffle on every render. */
export function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
