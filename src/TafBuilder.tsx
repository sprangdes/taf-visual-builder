import { useState } from "react";

const weatherOptions = [" ", "+", "-", "VC", "HZ", "BR", "FG", "DZ", "RA", "SH", "SN", "TS"];
const cloudAmountOptions = ["FEW", "SCT", "BKN", "OVC"];
const visibilityOptions = [
  50, 60, 80, 100, 200, 240, 300, 400, 480, 600, 800, 1000, 1200,
  1400, 1600, 2000, 2400, 2800, 3000, 3200, 4000, 4800, 5000,
  6000, 7000, 8000, 9000, 10000,
];

interface Wind {
  dir: number;
  speed: number;
  gust: number | null;
}

interface WeatherState {
  wind: Wind;
  visibility: number;
  weather: string[];
  clouds: { 
    amount: string; 
    height: number; 
    cb?: boolean; 
    tcu?: boolean }[];
  enabledBlocks?: {
    wind?: boolean;
    vis?: boolean;
    clouds?: boolean;
  };
}

interface TAFChange {
  type: "FM" | "TEMPO" | "BECMG";
  from: string;
  to: string;
  state: WeatherState;
}

interface BaseForecast {
  state: WeatherState;
  from: string;
  to: string;
}

interface TAF {
  station: string;
  issueTime: string;
  base: WeatherState;
  changes: TAFChange[];
}

interface ChangeEditorProps {
  change: TAFChange | BaseForecast | null;
  onUpdate: (updated: TAFChange | BaseForecast) => void;
  showActionButtons?: boolean;
  onDelete?: () => void;
  onChangeType?: (type: "BECMG" | "FM" | "TEMPO") => void;
}

function getCurrentIssueTimeUTC(): string {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  return `${day}${hour}${minute}Z`;
}

function emptyWeather({
  wind = { dir: 0, speed: 0, gust: 0 },
  visibility = 9999,
  weather = [],
  clouds = [],
}: Partial<WeatherState> = {}): WeatherState {
  return {
    wind: {
      dir: wind?.dir ?? 0,
      speed: wind?.speed ?? 0,
      gust: wind?.gust ?? null,
    },
    visibility,
    weather,
    clouds,
  };
}

function formatWind({ dir, speed, gust }: Wind) {
  const normalizedDir = dir === 360 ? 360 : dir === 0 ? 0 : Math.round(dir / 10) * 10;
  const d = normalizedDir === 0 ? "000" : normalizedDir === 360 ? "360" : String(normalizedDir).padStart(3, "0");
  const s = String(Math.max(Math.round(speed), 0)).padStart(2, "0");
  let g = "";
  if (typeof gust === "number" && Math.round(gust) - Math.round(speed) >= 15) {
    g = `G${String(Math.round(gust)).padStart(2, "0")}`;
  }
  return `${d}${s}${g}KT`;
}

function formatClouds(clouds: { amount: string; height: number; cb?: boolean; tcu?: boolean }[]) {
  return (clouds || [])
    .map((c) => {
      let suffix = "";
      if (c.cb) suffix = "CB";
      else if (c.tcu) suffix = "TCU";
      return `${c.amount}${String(c.height).padStart(3, "0")}${suffix}`;
    })
    .join(" ");
}

function formatWeatherState(state: WeatherState) {
  const wind = state.enabledBlocks?.wind ? formatWind(state.wind) : '';
  const vis = state.enabledBlocks?.vis ? String(state.visibility >= 10000 ? 9999 : state.visibility).padStart(4, '0') : '';
  const weather = state.enabledBlocks?.vis ? (state.weather || []).join('') : '';
  const clouds = state.enabledBlocks?.clouds ? formatClouds(state.clouds) : '';
  return [wind, vis, weather, clouds].filter(Boolean).join(' ');
}

function generateTAF(taf: TAF) {
  function getForecastDateHour(baseIssueTime: string, hour: string | number): string {
    const baseDay = Number(baseIssueTime.slice(0, 2));
    const baseHour = Number(baseIssueTime.slice(2, 4));
    let h = typeof hour === "string" ? Number(hour) : hour;
    let day = baseDay;
    if (h < baseHour) {
      day = baseDay + 1;
    }
    if (h >= 24) {
      day += Math.floor(h / 24);
      h = h % 24;
    }
    return `${String(day).padStart(2, "0")}${String(h).padStart(2, "0")}`;
  }

  const baseHour = Number(taf.issueTime.slice(2, 4));
  const baseDay = Number(taf.issueTime.slice(0, 2));
  const nextHour = (baseHour + 1) % 24;
  const fromDay = baseHour === 23 ? baseDay + 1 : baseDay;
  const baseFrom = `${String(fromDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`;

  let toHour = nextHour;
  let toDay = fromDay + 1;
  const baseTo = `${String(toDay).padStart(2, "0")}${String(toHour).padStart(2, "0")}`;
  const header = `TAF ${taf.station} ${taf.issueTime} ${baseFrom}/${baseTo}`;
  const baseLine = `${formatWeatherState({
    ...taf.base,
    enabledBlocks: { wind: true, vis: true, clouds: true },
  })}`;

  const changes = (taf.changes || [])
    .filter(c => {
      const eb = c.state.enabledBlocks;
      return eb ? (eb.wind || eb.vis || eb.clouds) : true;
    })
    .map((c) => {
      if (c.type === "FM") {
        let h = typeof c.from === "string" ? Number(c.from) : c.from;
        let day = Number(taf.issueTime.slice(0, 2));
        const baseHour = Number(taf.issueTime.slice(2, 4));
        if (h < baseHour) day += 1;
        const dd = String(day).padStart(2, "0");
        const hh = String(h).padStart(2, "0");
        const fmTime = `${dd}${hh}00`;
        return `FM${fmTime} ${formatWeatherState(c.state)}`;
      } else {
        const fromTime = getForecastDateHour(taf.issueTime, c.from);
        const toTime = getForecastDateHour(taf.issueTime, c.to);
        return `${c.type} ${fromTime}/${toTime} ${formatWeatherState(c.state)}`;
      }
    })
    .join("\n");

  return [header + ' ' + baseLine, changes].filter(Boolean).join("\n");
}

function useTimeRange() {
  const [pendingRange, setPendingRange] = useState<number | null>(null);
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const selectHour = (h: number, onSelectRange: (s: number, e: number) => void) => {
    if (pendingRange === null) {
      setPendingRange(h);
    } else {
      const s = Math.min(pendingRange, h);
      const e = Math.max(pendingRange, h);
      onSelectRange(s, e);
      setPendingRange(null);
      setHoverHour(null);
    }
  };

  const setHover = (h: number | null) => {
    setHoverHour(h);
  };

  const reset = () => {
    setPendingRange(null);
    setHoverHour(null);
  };

  return { pendingRange, selectHour, hoverHour, setHover, reset };
}

function Timeline({
  changes,
  onSelectRange,
  onSelectChange,
  startHour,
}: {
  changes: TAFChange[];
  onSelectRange: (start: number, end: number) => void;
  onSelectChange: (index: number) => void;
  startHour: number;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => (startHour + i) % 24);
  const hourIndexMap = new Map<number, number>();
  hours.forEach((h, idx) => hourIndexMap.set(h, idx));

  function isBetweenCircular(target: number, start: number, end: number): boolean {
    const t = hourIndexMap.get(target);
    const s = hourIndexMap.get(start);
    const e = hourIndexMap.get(end);
    if (t === undefined || s === undefined || e === undefined) return false;
    if (s <= e) return t >= s && t <= e;
    return t >= s || t <= e;
  }

  const { pendingRange, selectHour, hoverHour, setHover, reset } = useTimeRange();
  const getChangeAtHour = (h: number) =>
    (changes || []).findIndex((c) =>
      isBetweenCircular(h, Number(c.from), Number(c.to))
    );
  const getChangeObjAtHour = (h: number) =>
    (changes || []).find((c) =>
      isBetweenCircular(h, Number(c.from), Number(c.to))
    ) || null;

  function isInHoverSelection(h: number) {
    if (pendingRange !== null && hoverHour !== null) {
      return isBetweenCircular(h, pendingRange, hoverHour);
    }
    return false;
  }

  function isPendingStart(h: number) {
    return pendingRange !== null && h === pendingRange;
  }

  return (
    <div
      className="flex border rounded-xl overflow-hidden select-none"
      onMouseLeave={() => {
        if (pendingRange !== null) setHover(null);
      }}
    >
      {hours.map((h, idx) => {
        const changeIndex = getChangeAtHour(h);
        const changeObj = getChangeObjAtHour(h);
        let bgClass = "bg-white";
        if (pendingRange !== null && hoverHour !== null && isInHoverSelection(h)) {
          bgClass = "bg-blue-300";
        } else if (pendingRange !== null && hoverHour === null && h === pendingRange) {
          bgClass = "bg-blue-300";
        } else if (changeObj) {
          if (changeObj.type === "TEMPO") {
            bgClass = "bg-yellow-300";
          } else if (changeObj.type === "BECMG") {
            bgClass = "bg-green-300";
          } else if (changeObj.type === "FM") {
            bgClass = "bg-orange-300";
          }
        }
        return (
          <div
            key={h}
            onClick={() => {
              if (changeIndex !== -1) {
                onSelectChange(changeIndex);
                return;
              }

              if (pendingRange === null) {
                selectHour(h, onSelectRange);
              } else {
                onSelectRange(pendingRange, h);
                reset();
              }
            }}
            onMouseEnter={() => {
              if (pendingRange !== null) setHover(h);
            }}
            onMouseLeave={() => {
              if (pendingRange !== null) setHover(null);
            }}
            className={`flex-1 h-12 text-xs flex items-center justify-center cursor-pointer ${bgClass} ${idx !== hours.length - 1 ? 'border-r' : ''}`}
            style={{ transition: "background 0.1s" }}
          >
            {String(h).padStart(2, "0")}Z
          </div>
        );
      })}
    </div>
  );
}

function ChangeEditor({ change, onUpdate, showActionButtons = false, onDelete, onChangeType }: ChangeEditorProps) {
  if (!change) return null;

  const isBase = !("type" in change);
  const enabledBlocks =
    (change.state.enabledBlocks) ||
    { wind: false, vis: false, clouds: false };
  const [windEnabled, setWindEnabled] = useState(enabledBlocks.wind ?? isBase);
  const [visEnabled, setVisEnabled] = useState(enabledBlocks.vis ?? isBase);
  const [cloudEnabled, setCloudEnabled] = useState(enabledBlocks.clouds ?? isBase);

  const state = emptyWeather(change.state);
  const wind = state.wind;
  const visibility = state.visibility;
  const clouds = (state.clouds && state.clouds.length > 0) ? state.clouds : [{ amount: "FEW", height: 0 }];

  const weatherArr = state.weather || [];

  const addWeather = (w: string) => {
    const arr = [...(change.state.weather || []), w];
    onUpdate({
      ...change,
      state: {
        ...change.state,
        weather: arr,
        enabledBlocks: {
          ...(change.state.enabledBlocks || {}),
          vis: change.state.enabledBlocks?.vis ?? visEnabled,
        },
      },
    });
  };

  const removeWeather = (idx: number) => {
    const arr = [...(change.state.weather || [])];
    arr.splice(idx, 1);
    onUpdate({
      ...change,
      state: {
        ...change.state,
        weather: arr,
        enabledBlocks: {
          ...(change.state.enabledBlocks || {}),
          vis: change.state.enabledBlocks?.vis ?? visEnabled,
        },
      },
    });
  };

  const nearestVisibility = (val: number) =>
    visibilityOptions.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );

  const updateWind = (field: keyof Wind, value: number | string) => {
    const prevWind = change.state.wind || { dir: 0, speed: 0, gust: null };
    const newWind: Wind = { ...prevWind };
    if (field === "dir") {
      let dirVal = Number(value);
      dirVal = Math.max(0, Math.min(360, Math.round(dirVal / 10) * 10));
      newWind.dir = dirVal;
    }
    if (field === "speed") newWind.speed = Math.max(0, Math.round(Number(value)));
    if (field === "gust") newWind.gust = value ? Math.round(Number(value)) : null;
    onUpdate({
      ...change,
      state: {
        ...change.state,
        wind: newWind,
        visibility: change.state.visibility,
        weather: [...(change.state.weather || [])],
        clouds: [...(change.state.clouds || [])],
        enabledBlocks: {
          ...(change.state.enabledBlocks || {}),
          wind: change.state.enabledBlocks?.wind ?? windEnabled,
        },
      },
    });
  };

  const updateVisibility = (value: number) => {
    const vis = nearestVisibility(Number(value));
    onUpdate({
      ...change,
      state: {
        ...change.state,
        wind: change.state.wind,
        visibility: vis,
        weather: [...(change.state.weather || [])],
        clouds: [...(change.state.clouds || [])],
        enabledBlocks: {
          ...(change.state.enabledBlocks || {}),
          vis: change.state.enabledBlocks?.vis ?? visEnabled,
        },
      },
    });
  };

  const updateCloud = (
    index: number,
    field: "amount" | "height" | "cb" | "tcu",
    value: string | number | boolean
  ) => {
    const prevClouds =
      change.state.clouds && change.state.clouds.length > 0
        ? [...change.state.clouds]
        : [{ amount: "FEW", height: 0 }];
    const target = { ...prevClouds[index] };
    if (field === "amount") {
      target.amount = String(value);
    }
    if (field === "height") {
      const h = Math.max(0, Math.round(Number(value)));
      target.height = h;
    }
    if (field === "cb") {
      target.cb = Boolean(value);
      if (target.cb) target.tcu = false;
    }
    if (field === "tcu") {
      target.tcu = Boolean(value);
      if (target.tcu) target.cb = false;
    }
    prevClouds[index] = target;
    onUpdate({
      ...change,
      state: {
        ...change.state,
        wind: change.state.wind,
        visibility: change.state.visibility,
        weather: [...(change.state.weather || [])],
        clouds: prevClouds,
        enabledBlocks: {
          ...(change.state.enabledBlocks || {}),
          clouds: change.state.enabledBlocks?.clouds ?? cloudEnabled,
        },
      },
    });
  };

  const addCloud = () => {
    const prevClouds = [...(change.state.clouds || [])];
    const updatedClouds = [...prevClouds, { amount: "FEW", height: 0 }];
    onUpdate({
      ...change,
      state: {
        ...change.state,
        wind: change.state.wind,
        visibility: change.state.visibility,
        weather: [...(change.state.weather || [])],
        clouds: updatedClouds,
        enabledBlocks: {
          ...(change.state.enabledBlocks || {}),
          clouds: change.state.enabledBlocks?.clouds ?? cloudEnabled,
        },
      },
    });
  };

  const removeCloud = (index: number) => {
    const prevClouds = [...(change.state.clouds || [])];
    if (prevClouds.length <= 1) return;
    prevClouds.splice(index, 1);
    onUpdate({
      ...change,
      state: {
        ...change.state,
        wind: change.state.wind,
        visibility: change.state.visibility,
        weather: [...(change.state.weather || [])],
        clouds: prevClouds,
        enabledBlocks: {
          ...(change.state.enabledBlocks || {}),
          clouds: change.state.enabledBlocks?.clouds ?? cloudEnabled,
        },
      },
    });
  };

  const weatherDisabled = false;

  const showError = visibility <= 5000 && (weatherArr.length === 0);

  const minVis = 50;
  const maxVis = 10000;

  function nextType(type: "TEMPO" | "BECMG" | "FM"): "TEMPO" | "BECMG" | "FM" {
    if (type === "TEMPO") return "BECMG";
    if (type === "BECMG") return "FM";
    return "TEMPO";
  }

  function renderTypeButton() {
    if (showActionButtons && onChangeType && change && "type" in change) {
      const type = change.type as "TEMPO" | "BECMG" | "FM";

      let colorClass =
        type === "TEMPO"
          ? "bg-yellow-400 text-black"
          : type === "BECMG"
          ? "bg-green-400 text-black"
          : "bg-orange-400 text-black";

      return (
        <button
          className={`px-3 py-1 rounded-xl font-semibold mr-1 ${colorClass} cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            onChangeType(nextType(type));
          }}
          type="button"
          tabIndex={0}
          aria-label="Change type"
        >
          {type}
        </button>
      );
    }

    return (
      <span className="bg-gray-300 px-2 rounded-xl font-semibold text-black mr-1">
        BASE
      </span>
    );
  }

  return (
    <div className="border p-4 rounded-xl bg-gray-100 space-y-2 relative">
      <div className="flex items-center relative">
        <h3 className="font-semibold flex items-center m-0 p-0">
          Edit{" "}
          <span className="ml-2">
            {renderTypeButton()}
          </span>
          {String(Number(change.from.slice(-2))).padStart(2, "0")}Z–{String(Number(change.to.slice(-2))).padStart(2, "0")}Z
        </h3>
        {showActionButtons && onDelete && (
          <div className="absolute right-0 inset-y-0 flex items-center justify-end">
            <button
              className="bg-red-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{ zIndex: 10 }}
            >
              X
            </button>
          </div>
        )}
      </div>


      <div className="flex gap-4 mb-2">
        {/* Wind Section */}
        <div className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${!windEnabled ? "opacity-60 bg-gray-300 pointer-events-none relative grayscale" : ""}`}>
          {isBase === false && windEnabled && (
            <button
              type="button"
              onClick={() => {
                setWindEnabled(false);
                onUpdate({
                  ...change,
                  state: {
                    ...change.state,
                    enabledBlocks: {
                      ...(change.state?.enabledBlocks || {}),
                      wind: false,
                    },
                  },
                });
              }}
              className="absolute top-1 right-2 text-gray-400 text-xs transition-transform duration-150 hover:scale-125"
              style={{ zIndex: 20 }}
            >
              X
            </button>
          )}
          {!windEnabled && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setWindEnabled(true);
                  onUpdate({
                    ...change,
                    state: {
                      ...change.state,
                      enabledBlocks: {
                        ...(change.state?.enabledBlocks || {}),
                        wind: true,
                      },
                    },
                  });
                }}
                className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
              >
                Active Wind to Edit
              </button>
            </div>
          )}
          <label className="text-sm">
            <span className="inline-block w-28">Wind Direction</span>
            <input
              type="number"
              className="border ml-2 w-20 inline-block"
              value={wind.dir}
              step={10}
              min={0}
              max={360}
              onChange={(e) => updateWind("dir", e.target.value)}
            />
            <span className="ml-1 text-sm">°</span>
          </label>
          <label className="text-sm">
            <span className="inline-block w-28">Wind Speed</span>
            <input
              type="number"
              className="border ml-2 w-20 inline-block"
              value={wind.speed}
              min={0}
              step={1}
              onChange={(e) => updateWind("speed", e.target.value)}
            />
            <span className="ml-1 text-sm">KT</span>
          </label>
          <label className="text-sm">
            <span className="inline-block w-28">Wind Gust</span>
            <input
              type="number"
              className="border ml-2 w-20 inline-block"
              value={wind.gust ?? ""}
              min={0}
              step={1}
              onChange={(e) => updateWind("gust", e.target.value)}
            />
            <span className="ml-1 text-sm">KT</span>
          </label>
          {!windEnabled && (
            <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl"></div>
          )}
        </div>
        {/* Visibility/Weather Section */}
        <div className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${!visEnabled ? "opacity-60 bg-gray-300 pointer-events-none relative grayscale" : ""}`}>
          {isBase === false && visEnabled && (
            <button
              type="button"
              onClick={() => {
                setVisEnabled(false);
                onUpdate({
                  ...change,
                  state: {
                    ...change.state,
                    enabledBlocks: {
                      ...(change.state?.enabledBlocks || {}),
                      vis: false,
                    },
                  },
                });
              }}
              className="absolute top-1 right-2 text-gray-400 text-xs transition-transform duration-150 hover:scale-125"
              style={{ zIndex: 20 }}
            >
              X
            </button>
          )}
          {!visEnabled && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setVisEnabled(true);
                  onUpdate({
                    ...change,
                    state: {
                      ...change.state,
                      enabledBlocks: {
                        ...(change.state?.enabledBlocks || {}),
                        vis: true,
                      },
                    },
                  });
                }}
                className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
              >
                Active Visibility/Weather to Edit
              </button>
            </div>
          )}
          <label className="block text-sm">
            <div className="flex items-center">
              <span>Visibility</span>
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333'
                }}
              >
                {visibility} m
              </span>
            </div>
            <div className="w-full mt-2">
              <input
                type="range"
                min={minVis}
                max={maxVis}
                step={50}
                className="w-full"
                value={visibility}
                onChange={(e) => updateVisibility(Number(e.target.value))}
                style={{ zIndex: 1 }}
              />
            </div>
          </label>
          {showError && (
            <div className="text-red-500 text-sm">Visibility ≤5000, weather must be selected</div>
          )}
          <div className="block text-sm">
            <div className="mb-1">Weather</div>
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <button
                key="+"
                type="button"
                className="px-2 py-1 rounded-xl border bg-blue-200 text-black cursor-pointer"
                onClick={() => addWeather("+")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add +"
              >
                +
              </button>
              <button
                key="-"
                type="button"
                className="px-2 py-1 rounded-xl border bg-blue-200 text-black cursor-pointer"
                onClick={() => addWeather("-")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add -"
              >
                -
              </button>
              <button
                key="VC"
                type="button"
                className="px-2 py-1 rounded-xl border bg-purple-200 text-black cursor-pointer"
                onClick={() => addWeather("VC")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add VC"
              >
                VC
              </button>
              <button
                key="space"
                type="button"
                className="px-2 py-1 rounded-xl border bg-white text-black font-mono cursor-pointer"
                onClick={() => addWeather(" ")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add space"
              >
                <span className="inline-block" style={{ minWidth: "3em" }}>
                  space
                </span>
              </button>
              <span className="border-l mx-1 h-6" />
              {weatherOptions
                .filter((w) => !["+", "-", "VC", " "].includes(w))
                .map((w) => {
                  let bgClass = "bg-white";
                  if (["HZ", "BR", "FG"].includes(w)) {
                    bgClass = "bg-green-100";
                  } else if (["DZ", "RA", "SH", "SN"].includes(w)) {
                    bgClass = "bg-yellow-100";
                  } else if (w === "TS") {
                    bgClass = "bg-red-100";
                  }
                  return (
                    <button
                      key={w}
                      type="button"
                      className={`px-2 py-1 rounded-xl border ${bgClass} text-black cursor-pointer`}
                      onClick={() => addWeather(w)}
                      disabled={weatherDisabled}
                      tabIndex={0}
                      aria-label={`Add ${w}`}
                    >
                      {w}
                    </button>
                  );
                })}
            </div>
            <div className="border p-2 rounded-xl bg-white flex flex-wrap gap-2 items-center mt-2 h-10">
              {weatherArr.map((w, idx) => (
                <span
                  key={idx + "-" + w + "-tag"}
                  className={
                    w === " "
                      ? "inline-flex items-center bg-white text-black px-2 py-0.5 rounded-xl font-mono border border-gray-400"
                      : "inline-flex items-center bg-blue-50 text-blue-800 px-2 py-0.5 rounded-xl border border-blue-200"
                  }
                  onClick={() => removeWeather(idx)}
                  style={{ cursor: "pointer" }}
                  aria-label={`Remove ${w === " " ? "space" : w}`}
                  tabIndex={0}
                >
                  {w === " " ? <span className="font-mono" style={{ minWidth: "3em" }}>space</span> : w}
                </span>
              ))}
            </div>
          </div>
          {!visEnabled && (
            <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl"></div>
          )}
        </div>
      </div>
      {/* Clouds Section */}
      <div className={`block text-sm mt-2 border p-2 rounded-xl bg-white relative ${!cloudEnabled ? "opacity-60 bg-gray-300 pointer-events-none relative grayscale" : ""}`}>
        {isBase === false && cloudEnabled && (
          <button
            type="button"
            onClick={() => {
              setCloudEnabled(false);
              onUpdate({
                ...change,
                state: {
                  ...change.state,
                  enabledBlocks: {
                    ...(change.state?.enabledBlocks || {}),
                    clouds: false,
                  },
                },
              });
            }}
            className="absolute top-1 right-2 text-gray-400 text-xs transition-transform duration-150 hover:scale-125"
            style={{ zIndex: 20 }}
          >
            X
          </button>
        )}
        {!cloudEnabled && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setCloudEnabled(true);
                onUpdate({
                  ...change,
                  state: {
                    ...change.state,
                    enabledBlocks: {
                      ...(change.state?.enabledBlocks || {}),
                      clouds: true,
                    },
                  },
                });
              }}
              className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
            >
              Active Clouds to Edit
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <span>Clouds</span>
        </div>
        <div className="space-y-2 mt-2">
          {clouds.map((c, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <select
                value={c.amount}
                onChange={(e) => updateCloud(idx, "amount", e.target.value)}
                className="border"
              >
                {cloudAmountOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={c.height}
                min={0}
                step={1}
                onChange={(e) => updateCloud(idx, "height", e.target.value)}
                className="border w-20"
              />
              <span className="text-xs">(hundreds ft)</span>
              <label className="flex items-center text-xs ml-2">
                <input
                  type="checkbox"
                  checked={!!c.cb}
                  onChange={(e) => updateCloud(idx, "cb", e.target.checked)}
                  className="mr-1"
                />
                CB
              </label>
              <label className="flex items-center text-xs ml-2">
                <input
                  type="checkbox"
                  checked={!!c.tcu}
                  onChange={(e) => updateCloud(idx, "tcu", e.target.checked)}
                  className="mr-1"
                />
                TCU
              </label>
              {clouds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCloud(idx)}
                  className="bg-red-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
                >
                  X
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCloud}
            className="bg-blue-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
          >
            Add Layer
          </button>
        </div>
        {!cloudEnabled && (
          <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl"></div>
        )}
      </div>

    </div>
  );
}

export default function TafBuilder() {
  const [taf, setTaf] = useState<TAF>({
    station: "RCTP",
    issueTime: getCurrentIssueTimeUTC(),
    base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
    changes: []
  });

  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  function getTimelineStartHour(issueTime: string): number {
    const hour = Number(issueTime.slice(2, 4));
    const minute = Number(issueTime.slice(4, 6));
    if (isNaN(hour) || isNaN(minute)) return 0;
    return (hour + (minute > 0 ? 1 : 0)) % 24;
  }

  const timelineStartHour = getTimelineStartHour(taf.issueTime);

  function addTempo(taf: TAF, from: number, to: number) {
    let defaultState: WeatherState = taf.base;
    for (let i = taf.changes.length - 1; i >= 0; i--) {
      if (taf.changes[i].type === "BECMG") {
        defaultState = taf.changes[i].state;
        break;
      }
    }
    const deepCopyState: WeatherState = {
      wind: { ...defaultState.wind },
      visibility: defaultState.visibility,
      weather: [...(defaultState.weather || [])],
      clouds: (defaultState.clouds || []).map(cloud => ({ ...cloud })),
      enabledBlocks: { wind: false, vis: false, clouds: false },
    };
    const newChange: TAFChange = {
      type: "TEMPO",
      from: String(from),
      to: String(to),
      state: deepCopyState,
    };
    const updatedChanges = [...taf.changes, newChange];
    return { taf: { ...taf, changes: updatedChanges }, index: updatedChanges.length - 1 };
  }

  function handleSelectRange(from: number, to: number) {
    const result = addTempo(taf, from, to);
    setTaf(result.taf);
    setSelectedChangeIndex(result.index);
  }

  function updateChange(index: number | null, updatedChange: TAFChange) {
    if (index === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      changes[index] = updatedChange;
      return { ...prev, changes };
    });
  }


  function handleDelete() {
    if (selectedChangeIndex === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      changes.splice(selectedChangeIndex, 1);
      return { ...prev, changes };
    });
    setSelectedChangeIndex(null);
  }

  function handleChangeType(type: "BECMG" | "FM" | "TEMPO") {
    if (selectedChangeIndex === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      const change = changes[selectedChangeIndex];
      changes[selectedChangeIndex] = { ...change, type };
      return { ...prev, changes };
    });
  }

  function handleCopyTAF() {
    const text = generateTAF(taf);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">TAF Visual Builder (MVP)</h1>

      <section className="p-4 rounded-xl">
        <h2 className="font-semibold">Header</h2>
        <input
          value={taf.station}
          onChange={(e) => setTaf((prev) => ({ ...prev, station: e.target.value }))}
          className="border p-1 mr-2"
        />
        <input
          value={taf.issueTime}
          onChange={(e) => setTaf((prev) => ({ ...prev, issueTime: e.target.value }))}
          className="border p-1"
        />
      </section>

      <section className="p-4 rounded-xl">
        <h2 className="font-semibold">Base Forecast</h2>
        <ChangeEditor
          change={{
            from: (() => {
              const day = Number(taf.issueTime.slice(0, 2));
              const hour = Number(taf.issueTime.slice(2, 4));
              const nextHour = (hour + 1) % 24;
              const fromDay = hour === 23 ? day + 1 : day;
              return `${String(fromDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`;
            })(),
            to: (() => {
              const day = Number(taf.issueTime.slice(0, 2));
              const hour = Number(taf.issueTime.slice(2, 4));
              const nextHour = (hour + 1) % 24;
              const toHour = (nextHour + 24) % 24;
              const toDay = hour >= 23 ? day + 1 : day + 1;
              return `${String(toDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`;
            })(),
            state: {
              ...taf.base,
              enabledBlocks: { wind: true, vis: true, clouds: true }
            },
          }}
          onUpdate={(updated) => setTaf((prev) => ({
            ...prev,
            base: {
              ...updated.state,
              enabledBlocks: undefined
            }
          }))}
        />
      </section>

      <section className="p-4 rounded-xl">
        <h2 className="font-semibold">Timeline (click two hours / select change)</h2>
        <Timeline
          changes={taf.changes}
          startHour={timelineStartHour}
          onSelectRange={handleSelectRange}
          onSelectChange={(index) => {
            setSelectedChangeIndex(index);
          }}
        />
      </section>

      <section className="p-4 rounded-xl">
        <h2 className="font-semibold">Selected Change</h2>
        {selectedChangeIndex !== null ? (
          <div>
            <ChangeEditor
              key={selectedChangeIndex}
              change={taf.changes[selectedChangeIndex]}
              onUpdate={(updated) => updateChange(selectedChangeIndex, updated as TAFChange)}
              showActionButtons={true}
              onDelete={handleDelete}
              onChangeType={handleChangeType}
            />
          </div>
        ) : (
          <div className="text-gray-500">No change selected</div>
        )}
      </section>

      <section className="p-4 rounded">
        <h2 className="font-semibold">Generated TAF</h2>
        <pre className="whitespace-pre-wrap text-sm bg-black text-green-400 p-3 rounded-xl">
          {generateTAF(taf)}
        </pre>
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleCopyTAF}
            className="bg-blue-500 text-white px-3 py-1 rounded-xl text-xs cursor-pointer"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>
    </div>
  );
}