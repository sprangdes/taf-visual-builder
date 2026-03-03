import type { CloudLayer, WeatherState, Wind } from "../types/taf";

export function formatWind({ dir, speed, gust }: Wind): string {
  const normalizedDir = dir === 360 || dir === 0 ? dir : Math.round(dir / 10) * 10;
  const d = (() => {
    if (normalizedDir === 0) return "000";
    if (normalizedDir === 360) return "360";
    return String(normalizedDir).padStart(3, "0");
  })();

  const s = String(Math.max(Math.round(speed), 0)).padStart(2, "0");
  let g = "";

  if (typeof gust === "number" && Math.round(gust) - Math.round(speed) >= 15) {
    g = `G${String(Math.round(gust)).padStart(2, "0")}`;
  }

  return `${d}${s}${g}KT`;
}

export function createCloudLayer(partial?: Partial<CloudLayer>): CloudLayer {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    amount: partial?.amount ?? "FEW",
    height: partial?.height ?? 0,
    cb: partial?.cb,
    tcu: partial?.tcu,
  };
}

export function emptyWeather(
  {
    wind = { dir: 0, speed: 0, gust: 0 },
    visibility = 9999,
    weather = [],
    clouds = [],
  }: Partial<WeatherState> = {},
): WeatherState {
  let cloudArr = clouds;

  if (!cloudArr || cloudArr.length === 0) {
    cloudArr = [createCloudLayer({ amount: "FEW", height: 0 })];
  } else {
    cloudArr = cloudArr.map((c) => (c.id ? c : createCloudLayer(c)));
  }

  return {
    wind: {
      dir: wind?.dir ?? 0,
      speed: wind?.speed ?? 0,
      gust: wind?.gust ?? null,
    },
    visibility,
    weather,
    clouds: cloudArr,
  };
}

export function formatClouds(clouds: CloudLayer[]): string {
  return (clouds || [])
    .map((c) => {
      let suffix = "";
      if (c.cb) suffix = "CB";
      else if (c.tcu) suffix = "TCU";
      return `${c.amount}${String(c.height).padStart(3, "0")}${suffix}`;
    })
    .join(" ");
}

export function formatWeatherState(state: WeatherState, isBase = false): string {
  const wind = state.enabledBlocks?.wind ? formatWind(state.wind) : "";
  const vis = (() => {
    if (!state.enabledBlocks?.vis) return "";
    const cappedVisibility = state.visibility >= 10000 ? 9999 : state.visibility;
    return String(cappedVisibility).padStart(4, "0");
  })();

  const weather = state.enabledBlocks?.vis ? (state.weather || []).join("") : "";

  let cloudsStr: string;
  if (isBase) {
    const cloudsArr =
      state.clouds && state.clouds.length > 0
        ? state.clouds
        : [createCloudLayer({ amount: "FEW", height: 0 })];
    cloudsStr = formatClouds(cloudsArr);
  } else {
    cloudsStr = state.enabledBlocks?.clouds ? formatClouds(state.clouds) : "";
  }

  return [wind, vis, weather, cloudsStr].filter(Boolean).join(" ");
}
