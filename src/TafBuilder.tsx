import React, {useEffect, useRef, useState} from "react";

const weatherOptions = [
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
const colorByType: Record<WeatherTrendType, string> = {
  TEMPO: "bg-yellow-400 text-black",
  BECMG: "bg-green-400 text-black",
  FM: "bg-orange-400 text-black",
}
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
  type: WeatherTrendType;
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
  onChangeType?: (type: WeatherTrendType) => void;
}

type WeatherTrendType = "FM" | "TEMPO" | "BECMG";
type TimelineProps = Readonly<{ changes: TAFChange[]; onSelectRange: (start: number, end: number) => void; onSelectChange: (index: number) => void; startHour: number; }>;
type ReadonlyChangeEditorProps = Readonly<ChangeEditorProps>;
type IssueTimeInputProps = Readonly<{ value: string; onChange: (value: string) => void; }>;
type CloudDeleteButtonProps = Readonly<{ onClick: () => void; }>;
type ChangeDeleteButtonProps = Readonly<{ onClick: () => void; setShowTooltip: (v: boolean) => void; showTooltip: boolean; }>;
type TooltipPos = { top: number; left: number };
type TypeButtonProps = Readonly<{ showActionButtons: boolean; onChangeType?: (type: WeatherTrendType) => void; change: TAFChange | BaseForecast; }>;

function getCurrentIssueTimeUTC(): string {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  return `${day}${hour}${minute}`;
}

function emptyWeather({wind = { dir: 0, speed: 0, gust: 0 }, visibility = 9999, weather = [], clouds = [],}: Partial<WeatherState> = {}): WeatherState {
  let cloudsArr = clouds;
  if (!cloudsArr || cloudsArr.length === 0) {
    cloudsArr = [{ amount: "FEW", height: 0 }];
  }
  return {
    wind: {
      dir: wind?.dir ?? 0,
      speed: wind?.speed ?? 0,
      gust: wind?.gust ?? null,
    },
    visibility,
    weather,
    clouds: cloudsArr,
  };
}

function formatWind({ dir, speed, gust }: Wind) {
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

function formatWeatherState(state: WeatherState, isBase: boolean = false) {
  const wind = state.enabledBlocks?.wind ? formatWind(state.wind) : '';
  const vis = (() => {
    if (!state.enabledBlocks?.vis) return '';
    const cappedVisibility = state.visibility >= 10000 ? 9999 : state.visibility;
    return String(cappedVisibility).padStart(4, '0');
  })();
  const weather = state.enabledBlocks?.vis ? (state.weather || []).join('') : '';
  let cloudsStr: string;
  if (isBase) {
    const cloudsArr = state.clouds && state.clouds.length > 0 ? state.clouds : [{ amount: "FEW", height: 0 }];
    cloudsStr = formatClouds(cloudsArr);
  } else {
    cloudsStr = state.enabledBlocks?.clouds ? formatClouds(state.clouds) : '';
  }
  return [wind, vis, weather, cloudsStr].filter(Boolean).join(' ');
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
  const toHour = nextHour;
  const toDay = fromDay + 1;
  const baseTo = `${String(toDay).padStart(2, "0")}${String(toHour).padStart(2, "0")}`;
  const header = `TAF ${taf.station} ${taf.issueTime}Z ${baseFrom}/${baseTo}`;
  const baseLine = `${formatWeatherState({...taf.base, enabledBlocks: { wind: true, vis: true, clouds: true },}, true)}`;
  const changes = (taf.changes || [])
    .filter(c => {
      const eb = c.state.enabledBlocks;
      return eb ? (eb.wind || eb.vis || eb.clouds) : true;
    })
    .map((c) => {
      if (c.type === "FM") {
        const h = Number(c.from);
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

function Timeline({ changes, onSelectRange, onSelectChange, startHour }: TimelineProps) {
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

  function isInHoverSelection(h: number) {
    if (pendingRange !== null && hoverHour !== null) {
      return isBetweenCircular(h, pendingRange, hoverHour);
    }
    return false;
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
  return (
    <div
      className="flex border rounded-xl overflow-hidden select-none"
      onPointerLeave={() => {
        if (pendingRange !== null) setHover(null);
      }}
    >
      {hours.map((h, idx) => {
        const changeIndex = getChangeAtHour(h);
        const changeObj = getChangeObjAtHour(h);
        let bgClass = "bg-white";

        if (pendingRange !== null && hoverHour !== null && isInHoverSelection(h)) {
          bgClass = "bg-blue-200";
        } else if (pendingRange !== null && hoverHour === null && h === pendingRange) {
          bgClass = "bg-blue-200";
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
          <button
            key={h}
            type="button"
            aria-label={`Select ${String(h).padStart(2, "0")}Z`}
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
            onPointerEnter={() => {
              if (pendingRange !== null) setHover(h);
            }}
            onPointerLeave={() => {
              if (pendingRange !== null) setHover(null);
            }}
            className={`flex-1 h-12 text-xs flex items-center justify-center ${bgClass} hover:bg-blue-200 ${idx < hours.length - 1 ? "border-r" : ""} cursor-pointer focus:outline-none focus-visible:ring-blue-500`}
            style={{ transition: "background 0.1s" }}
          >
            {String(h).padStart(2, "0")}Z
          </button>
        );
      })}
    </div>
  );
}

function nextType(type: WeatherTrendType): WeatherTrendType {
  if (type === "TEMPO") return "BECMG";
  if (type === "BECMG") return "FM";
  return "TEMPO";
}

function ChangeEditor({ change, onUpdate, showActionButtons = false, onDelete, onChangeType }: ReadonlyChangeEditorProps) {
  if (!change) return null;

  const isBase = !("type" in change);
  const enabledBlocks = (change.state.enabledBlocks) || { wind: false, vis: false, clouds: false };
  const [windEnabled, setWindEnabled] = useState(enabledBlocks.wind ?? isBase);
  const [visEnabled, setVisEnabled] = useState(enabledBlocks.vis ?? isBase);
  const [cloudEnabled, setCloudEnabled] = useState(enabledBlocks.clouds ?? isBase);
  const [showDeleteChangeTooltip, setShowDeleteChangeTooltip] = useState(false);
  const state = emptyWeather(change.state);
  const wind = state.wind;
  const visibility = state.visibility;
  const clouds = (state.clouds && state.clouds.length > 0) ? state.clouds : [{ amount: "FEW", height: 0 }];
  const weatherArr = state.weather || [];
  const prevEnabledBlocks = change.state.enabledBlocks ?? {};
  const addWeather = (w: string) => {
    const arr = [...(change.state.weather || []), w];
    onUpdate({
      ...change,
      state: {
        ...change.state,
        weather: arr,
        enabledBlocks: {
          ...prevEnabledBlocks,
          vis: change.state.enabledBlocks?.vis ?? visEnabled,},
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
          ...prevEnabledBlocks,
          vis: change.state.enabledBlocks?.vis ?? visEnabled,
        },
      },
    });
  };
  const nearestVisibility = (val: number) => visibilityOptions.reduce((prev, curr) => {return Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev;}, visibilityOptions[0]);
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
          ...prevEnabledBlocks,
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
          ...prevEnabledBlocks,
          vis: change.state.enabledBlocks?.vis ?? visEnabled,
        },
      },
    });
  };
  const updateCloud = (index: number, field: "amount" | "height" | "cb" | "tcu", value: string | number | boolean) => {
    const prevClouds =
      change.state.clouds && change.state.clouds.length > 0
        ? [...change.state.clouds]
        : [{ amount: "FEW", height: 0 }];
    const target = { ...prevClouds[index] };
    if (field === "amount") {
      target.amount = String(value);
    }
    if (field === "height") {
      target.height = Math.max(0, Math.round(Number(value)));
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
          ...prevEnabledBlocks,
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
          ...prevEnabledBlocks,
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
          ...prevEnabledBlocks,
          clouds: change.state.enabledBlocks?.clouds ?? cloudEnabled,
        },
      },
    });
  };
  const weatherDisabled = false;
  const showError = visibility <= 5000 && (weatherArr.length === 0);
  const minVis = 50;
  const maxVis = 10000;

  return (
    <div className="border p-4 rounded-xl bg-gray-100 space-y-2 relative">
      <div className="flex items-center relative">
        <h3 className="font-semibold flex items-center m-0 p-0">
          Edit{" "}
          <span className="ml-2">
            <TypeButton showActionButtons={showActionButtons} onChangeType={onChangeType} change={change} />
          </span>
          {isBase ? (
            <>{String(Number(change.from.slice(-2))).padStart(2, "0")}Z</>
          ) : (
            <>{String(Number(change.from.slice(-2))).padStart(2, "0")}Z–{String(Number(change.to.slice(-2))).padStart(2, "0")}Z</>
          )}
        </h3>
        {showActionButtons && onDelete && (
          <div className="absolute right-0 inset-y-0 flex items-center justify-end">
            <div className="relative">
              <ChangeDeleteButton
                onClick={onDelete}
                setShowTooltip={setShowDeleteChangeTooltip}
                showTooltip={showDeleteChangeTooltip}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-4 mb-2">
        {/* Wind Section */}
        <div className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${windEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"}`}>
          {!isBase && windEnabled && (
            <button
              type="button"
              onClick={() => {
                setWindEnabled(false);
                onUpdate({
                  ...change,
                  state: {
                    ...change.state,
                    enabledBlocks: {
                      ...prevEnabledBlocks,
                      wind: false,
                    },
                  },
                });
              }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
              style={{ zIndex: 20 }}
            >X</button>
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
                        ...prevEnabledBlocks,
                        wind: true,
                      },
                    },
                  });
                }}
                className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
              >Active Wind to Edit</button>
            </div>
          )}
          <label className="text-sm">
            <span className="inline-block w-28">Wind Direction</span>
            <input
              type="number"
              className="border p-1 mr-2 rounded-xl px-3 w-20"
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
              className="border p-1 mr-2 rounded-xl px-3 w-20"
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
              className="border p-1 mr-2 rounded-xl px-3 w-20"
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
        <div className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${visEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"}`}>
          {!isBase && visEnabled && (
            <button
              type="button"
              onClick={() => {
                setVisEnabled(false);
                onUpdate({
                  ...change,
                  state: {
                    ...change.state,
                    enabledBlocks: {
                      ...prevEnabledBlocks,
                      vis: false,
                    },
                  },
                });
              }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
              style={{ zIndex: 20 }}
            >X</button>
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
                        ...prevEnabledBlocks,
                        vis: true,
                      },
                    },
                  });
                }}
                className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
              >Active Visibility/Weather to Edit</button>
            </div>
          )}
          <label htmlFor="visibility" className="block text-sm">
            <div className="flex items-center">
              <span id="visibility-label">Visibility</span>
              <span style={{marginLeft: '8px', fontSize: '14px', fontWeight: 500, color: '#333'}}>{visibility} m</span>
            </div>
            <div className="w-full mt-2">
              <input
                id="visibility"
                aria-labelledby="visibility-label"
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
          <div className="block text-sm">
            <div className="mb-1">Weather</div>
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              {weatherOptions.map((opt) => (
                <button
                  key={opt.code === " " ? "space" : opt.code}
                  type="button"
                  className={`px-2 py-1 rounded-xl border ${opt.color} text-black cursor-pointer`}
                  onClick={() => addWeather(opt.code)}
                  disabled={weatherDisabled}
                  tabIndex={0}
                  aria-label={`Add ${opt.code === " " ? "space" : opt.code}`}
                >{opt.code === " " ? (<span className="inline-block" style={{ minWidth: "3em" }}>space</span>) : (opt.code)}</button>
              ))}
            </div>
            <div className="border p-2 rounded-xl bg-white flex flex-wrap gap-2 items-center mt-2 h-10">
              {weatherArr.map((w, idx) => {
                const opt = weatherOptions.find(o => o.code === w);
                const bgClass = opt ? opt.color : "bg-white";
                return (
                  <button
                    key={idx + "-" + w + "-tag"}
                    type="button"
                    className={`inline-flex items-center ${bgClass} text-black px-2 py-0.5 rounded-xl border border-gray-300 ${w === " " ? "font-mono" : ""}`}
                    onClick={() => removeWeather(idx)}
                    aria-label={`Remove ${w === " " ? "space" : w}`}
                  >{w === " " ? <span className="font-mono" style={{ minWidth: "3em" }}>space</span> : w}</button>
                );
              })}
              {showError && (
                <span className="text-red-500 text-sm ml-2">Visibility ≤5000m, Weather Must Be Selected</span>
              )}
            </div>
          </div>
          {!visEnabled && (
            <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl"></div>
          )}
        </div>
      </div>
      {/* Clouds Section */}
      <div className={`block text-sm mt-2 border p-2 rounded-xl bg-white relative ${cloudEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"}`}>
        {!isBase && cloudEnabled && (
          <button
            type="button"
            onClick={() => {
              setCloudEnabled(false);
              onUpdate({
                ...change,
                state: {
                  ...change.state,
                  enabledBlocks: {
                    ...prevEnabledBlocks,
                    clouds: false,
                  },
                },
              });
            }}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
            style={{ zIndex: 20 }}
          >X</button>
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
                      ...prevEnabledBlocks,
                      clouds: true,
                    },
                  },
                });
              }}
              className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
            >Active Clouds to Edit</button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <span>Clouds</span>
        </div>
        <div className="space-y-2 mt-2">
          {clouds.map((c, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={c.amount}
                onChange={(e) => updateCloud(idx, "amount", e.target.value)}
                className="border p-1 rounded-xl px-3 w-20"
              >{cloudAmountOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select>
              <input
                type="number"
                value={c.height}
                min={0}
                step={1}
                onChange={(e) => updateCloud(idx, "height", e.target.value)}
                className="border p-1 rounded-xl px-3 w-20"
              />
              <span className="text-sm">(hundreds ft)</span>
              <label className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={!!c.cb}
                  onChange={(e) => updateCloud(idx, "cb", e.target.checked)}
                />
                <span>CB</span>
              </label>
              <label className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={!!c.tcu}
                  onChange={(e) => updateCloud(idx, "tcu", e.target.checked)}
                />
                <span>TCU</span>
              </label>
              {clouds.length > 1 && <CloudDeleteButton onClick={() => removeCloud(idx)} />}
            </div>
          ))}
          <button
            type="button"
            onClick={addCloud}
            className="bg-blue-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
          >Add Layer</button>
        </div>
        {!cloudEnabled && (
          <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl"></div>
        )}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipPosition(btn: HTMLButtonElement | null, tooltipWidth = 120, tooltipHeight = 32) {
  const padding = 8;

  if (!btn) return { top: 0, left: 0 };

  const rect = btn.getBoundingClientRect();
  const maxLeft = window.innerWidth - tooltipWidth - padding;
  const maxTop = window.innerHeight - tooltipHeight - padding;
  const rightLeft = rect.right + padding;
  const rightTop = rect.top + rect.height / 2 - tooltipHeight / 2;
  const overflowsRight = rightLeft + tooltipWidth > window.innerWidth - padding;
  const overflowsBottom = rect.bottom + tooltipHeight > window.innerHeight - padding;
  const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  const aboveTop = rect.top - tooltipHeight;
  const belowTop = rect.bottom + padding;
  let rawLeft: number ;
  let rawTop: number;

  if (overflowsRight || overflowsBottom) {
    rawLeft = centeredLeft;
    rawTop = aboveTop < padding ? belowTop : aboveTop;
  } else {
    rawLeft = rightLeft;
    rawTop = rightTop;
  }

  return { left: clamp(rawLeft, padding, maxLeft), top: clamp(rawTop, padding, maxTop) };
}

function useHoverTooltip(options?: Readonly<{ delayMs?: number; width?: number; height?: number }>) {
  const delayMs = options?.delayMs ?? 500;
  const width = options?.width ?? 120;
  const height = options?.height ?? 32;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showTooltip && btnRef.current) {
      setTooltipPos(getTooltipPosition(btnRef.current, width, height));
    }
  }, [showTooltip, width, height]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowTooltip(true), delayMs);
  };
  const onMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setShowTooltip(false);
  };

  return { btnRef, showTooltip, tooltipPos, onMouseEnter, onMouseLeave, setShowTooltip };
}

function CloudDeleteButton({ onClick }: CloudDeleteButtonProps) {
  const { btnRef, showTooltip, tooltipPos, onMouseEnter, onMouseLeave } = useHoverTooltip({ delayMs: 500 });

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        className="bg-red-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
        onMouseEnter={ onMouseEnter }
        onMouseLeave={ onMouseLeave }
        style={{ zIndex: 10 }}
      >X</button>
      {showTooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            fontSize: "0.75rem",
            borderRadius: "0.375rem",
            padding: "0.25rem 0.5rem",
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            pointerEvents: "none"
          }}
        >Delete Layer</div>
      )}
    </div>
  );
}

function ChangeDeleteButton({ onClick, setShowTooltip, showTooltip }: ChangeDeleteButtonProps) {
  const { btnRef, tooltipPos, onMouseEnter, onMouseLeave, setShowTooltip: setLocalShowTooltip } = useHoverTooltip({ delayMs: 500 });

  useEffect(() => {
    setLocalShowTooltip(showTooltip);
  }, [setLocalShowTooltip, showTooltip]);

  useEffect(() => {
    if (showTooltip) onMouseEnter();
    else onMouseLeave();
  }, [onMouseEnter, onMouseLeave, showTooltip]);

  return (
    <>
      <button
        ref={btnRef}
        className="bg-red-500 text-white px-2 py-1 rounded-xl text-xs cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => {
          onMouseEnter();
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          onMouseLeave();
          setShowTooltip(false);
        }}
        style={{ zIndex: 10 }}
        type="button"
      >X</button>
      {showTooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            fontSize: "0.75rem",
            borderRadius: "0.375rem",
            padding: "0.25rem 0.5rem",
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            pointerEvents: "none"
          }}
        >Delete Change</div>
      )}
    </>
  );
}

function TypeButton({ showActionButtons, onChangeType, change }: TypeButtonProps) {
  const { btnRef, showTooltip, tooltipPos, onMouseEnter, onMouseLeave } = useHoverTooltip({ delayMs: 500, width: 120, height: 32 });
  const isBase = !("type" in change);

  if (isBase) {
    return (
        <span className="inline-flex items-center px-3 py-1 rounded-xl font-semibold mr-1 bg-gray-300 text-black">BASE</span>
    );
  }

  if (!showActionButtons || !onChangeType) {
    return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-xl font-semibold mr-1 ${
            colorByType[change.type]
          }`}
        >{change.type}</span>
    );
  }
  const type = change.type;
  const next = nextType(type);
  const colorClass = colorByType[type];
  const tooltipText = `Switch to ${next}`;

  return (
    <>
      <button
        ref={btnRef}
        className={`px-3 py-1 rounded-xl font-semibold mr-1 ${colorClass} cursor-pointer`}
        onClick={(e) => {
          e.stopPropagation();
          onChangeType(next);
        }}
        type="button"
        aria-label="Change type"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >{type}</button>
      {showTooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            fontSize: "0.75rem",
            borderRadius: "0.375rem",
            padding: "0.25rem 0.7rem",
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            pointerEvents: "none"
          }}
        >{tooltipText}</div>
      )}
    </>
  );
}

function IssueTimeInput({value, onChange }: IssueTimeInputProps ) {
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    if (!value || value.length < 6) {
      const now = new Date();
      const day = String(now.getUTCDate()).padStart(2, "0");
      const hour = String(now.getUTCHours()).padStart(2, "0");
      const minute = String(now.getUTCMinutes()).padStart(2, "0");
      onChange(`${day}${hour}${minute}`);
    }
    didInitRef.current = true;
  }, [onChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replaceAll(/\D/g, "");
    if (val.length > 6) val = val.slice(0, 6);
    onChange(val);
  };

  return (
    <span className="inline-flex items-center border rounded-xl">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value.slice(0, 6)}
        onChange={handleChange}
        className="border-0 p-1 focus:outline-none w-24"
        style={{ borderRight: "none", borderRadius: "0.375rem 0 0 0.375rem" }}
        aria-label="Issue time (DDHHMM)"
        placeholder={value.slice(0, 6) ? undefined : "UTC Time"}
      />
      <span className="px-2" style={{height: "100%", fontWeight: 500, fontSize: "1rem"}}>Z</span>
    </span>
  );
}

function getTimelineStartHour(issueTime: string): number {
  const hour = Number(issueTime.slice(2, 4));
  const minute = Number(issueTime.slice(4, 6));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return (hour + (minute > 0 ? 1 : 0)) % 24;
}

export default function TafBuilder() {
  const [taf, setTaf] = useState<TAF>({
    station: "",
    issueTime: getCurrentIssueTimeUTC(),
    base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
    changes: []
  });

  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
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
      <h1 className="text-xl font-bold">TAF Visual Builder</h1>

      <section className="p-4 rounded-xl">
        <h2 className="font-semibold">Header</h2>
        <input
          value={taf.station}
          onChange={(e) => setTaf((prev) => ({ ...prev, station: e.target.value }))}
          className="border p-1 mr-2 rounded-xl w-30"
          placeholder="ICAO Code"
        />
        <IssueTimeInput
          value={taf.issueTime}
          onChange={(val) => setTaf((prev) => ({ ...prev, issueTime: val }))}
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
              const toDay = hour >= 23 ? day + 1 : day;
              return `${String(toDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`;
            })(),
            state: {
              ...taf.base,
              clouds: (taf.base.clouds && taf.base.clouds.length > 0) ? taf.base.clouds : [{ amount: "FEW", height: 0 }],
              enabledBlocks: { wind: true, vis: true, clouds: true }
            },
          }}
          onUpdate={(updated) => setTaf((prev) => ({
            ...prev,
            base: {
              ...updated.state,
              clouds: (updated.state.clouds && updated.state.clouds.length > 0) ? updated.state.clouds : [{ amount: "FEW", height: 0 }],
              enabledBlocks: undefined
            }
          }))}
        />
      </section>

      <section className="p-4 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold mb-0">Timeline</h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-yellow-300 rounded-sm border border-black"></span>
              <span className="text-xs">TEMPO</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-green-300 rounded-sm border border-black"></span>
              <span className="text-xs">BECMG</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 bg-orange-300 rounded-sm border border-black"></span>
              <span className="text-xs">FM</span>
            </div>
          </div>
        </div>
        <Timeline
          changes={taf.changes}
          startHour={timelineStartHour}
          onSelectRange={handleSelectRange}
          onSelectChange={(index) => {
            setSelectedChangeIndex((prev) =>
              prev === index ? null : index
            );
          }}
        />
      </section>

      {selectedChangeIndex !== null && (
        <section className="p-4 rounded-xl">
          <h2 className="font-semibold">Selected Change</h2>
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
        </section>
      )}

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