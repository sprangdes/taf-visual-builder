import { useState } from "react";

function getCurrentIssueTimeUTC(): string {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const minute = String(now.getUTCMinutes()).padStart(2, "0");
  return `${day}${hour}${minute}Z`;
}

// ---------- Types ----------
interface Wind {
  dir: number;
  speed: number;
  gust: number | null;
}

interface WeatherState {
  wind: Wind;
  visibility: number;
  weather: string[];
  clouds: { amount: string; height: number; cb?: boolean; tcu?: boolean }[];
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
  validFrom: string;
  validTo: string;
  base: WeatherState;
  changes: TAFChange[];
}

// ---------- Defaults ----------
const weatherOptions = [" ", "+", "-", "VC", "HZ", "BR", "FG", "DZ", "RA", "SH", "SN", "TS"];
const cloudAmountOptions = ["FEW", "SCT", "BKN", "OVC"];
const visibilityOptions = [
  50, 60, 80, 100, 200, 240, 300, 400, 480, 600, 800, 1000, 1200,
  1400, 1600, 2000, 2400, 2800, 3000, 3200, 4000, 4800, 5000,
  6000, 7000, 8000, 9000, 10000,
];

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

// ---------- Format Functions ----------
function formatWind({ dir, speed, gust }: Wind) {
  // Normalize dir for display: 0 => "000", 360 => "360"
  const normalizedDir = dir === 360 ? 360 : dir === 0 ? 0 : Math.round(dir / 10) * 10;
  const d = normalizedDir === 0 ? "000" : normalizedDir === 360 ? "360" : String(normalizedDir).padStart(3, "0");
  // Speed displayed as two digits, even if 0
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
  const vis = String(state.visibility >= 10000 ? 9999 : state.visibility).padStart(4, "0");
  return [
    formatWind(state.wind),
    vis,
    (state.weather || []).map(w => w).join(""), // 直接依照選取結果，不拆開
    formatClouds(state.clouds),
  ]
    .filter(Boolean)
    .join(" ");
}

function generateTAF(taf: TAF) {
  // Helper: get date/hour string (DDHH) given base date (from issueTime) and hour offset
  function getForecastDateHour(baseIssueTime: string, hour: string | number): string {
    // baseIssueTime: "DDHHMMZ"
    // hour: number or string, e.g., 8, "12"
    const baseDay = Number(baseIssueTime.slice(0, 2));
    const baseHour = Number(baseIssueTime.slice(2, 4));
    let h = typeof hour === "string" ? Number(hour) : hour;
    // If hour < baseHour, treat as next day (for validTo or toTime that wraps over midnight)
    let day = baseDay;
    if (h < baseHour) {
      day = baseDay + 1;
    }
    // If hour is >=24, wrap day forward
    if (h >= 24) {
      day += Math.floor(h / 24);
      h = h % 24;
    }
    // Pad day/hour
    return `${String(day).padStart(2, "0")}${String(h).padStart(2, "0")}`;
  }

  // Base Forecast time range based on issueTime
  const baseHour = Number(taf.issueTime.slice(2, 4));
  const baseDay = Number(taf.issueTime.slice(0, 2));

  // 起始下一整點
  const nextHour = (baseHour + 1) % 24;
  const fromDay = baseHour === 23 ? baseDay + 1 : baseDay;
  const baseFrom = `${String(fromDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`;

  // 結束時間為下一整點 + 24 小時
  let toHour = nextHour;
  let toDay = fromDay + 1; // 加一天
  const baseTo = `${String(toDay).padStart(2, "0")}${String(toHour).padStart(2, "0")}`;

  // Header line
  const header = `TAF ${taf.station} ${taf.issueTime} ${baseFrom}/${baseTo}`;

  // Base forecast line
  const baseLine = `${formatWeatherState(taf.base)}`;

  const changes = (taf.changes || [])
    .map((c) => {
      if (c.type === "FM") {
        // FM: from is DDHHMM, based on taf.issueTime's date and c.from hour
        // Use c.from as hour, taf.issueTime as base
        // Compose DDHHMM
        let h = typeof c.from === "string" ? Number(c.from) : c.from;
        let day = Number(taf.issueTime.slice(0, 2));
        const baseHour = Number(taf.issueTime.slice(2, 4));
        if (h < baseHour) day += 1;
        const dd = String(day).padStart(2, "0");
        const hh = String(h).padStart(2, "0");
        // Use 00 for MM
        const fmTime = `${dd}${hh}00`;
        return `FM${fmTime} ${formatWeatherState(c.state)}`;
      } else {
        // TEMPO/BECMG: show as DDHH/DDHH, both from/to as hour, based on taf.issueTime
        const fromTime = getForecastDateHour(taf.issueTime, c.from);
        const toTime = getForecastDateHour(taf.issueTime, c.to);
        return `${c.type} ${fromTime}/${toTime} ${formatWeatherState(c.state)}`;
      }
    })
    .join("\n");

  return [header + ' ' + baseLine, changes].filter(Boolean).join("\n");
}

// ---------- Timeline Hook ----------
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

// ---------- Timeline Component ----------
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

  // Map hour → index on circular timeline
  const hourIndexMap = new Map<number, number>();
  hours.forEach((h, idx) => hourIndexMap.set(h, idx));

  // Determine if target hour is between start and end on circular timeline
  function isBetweenCircular(target: number, start: number, end: number): boolean {
    const t = hourIndexMap.get(target);
    const s = hourIndexMap.get(start);
    const e = hourIndexMap.get(end);
    if (t === undefined || s === undefined || e === undefined) return false;

    if (s <= e) {
      return t >= s && t <= e;
    }

    // Cross midnight on circular array
    return t >= s || t <= e;
  }
  const { pendingRange, selectHour, hoverHour, setHover, reset } = useTimeRange();
  // Returns the index of the first change covering this hour, or -1 if none (circular)
  const getChangeAtHour = (h: number) =>
    (changes || []).findIndex((c) =>
      isBetweenCircular(h, Number(c.from), Number(c.to))
    );
  // Returns the change object at this hour, or null if none (circular)
  const getChangeObjAtHour = (h: number) =>
    (changes || []).find((c) =>
      isBetweenCircular(h, Number(c.from), Number(c.to))
    ) || null;

  // Track drag selection state in local state
  const [internalPending, setInternalPending] = useState<number | null>(null);
  const [internalHover, setInternalHover] = useState<number | null>(null);

  // We want to use the hook's state, but also expose it to the parent Timeline component
  // So, we combine both: the hook's state (pendingRange, hoverHour) and our own internal state.
  // But since Timeline is a function component, we need to "lift" state up to this component.
  // Let's use the hook's state for the actual logic.

  // Helper to determine if hour is in current drag/hover range (circular)
  function isInHoverSelection(h: number) {
    if (pendingRange !== null && hoverHour !== null) {
      return isBetweenCircular(h, pendingRange, hoverHour);
    }
    return false;
  }

  // Helper to determine if hour is the pending start
  function isPendingStart(h: number) {
    return pendingRange !== null && h === pendingRange;
  }

  // Mouse event handlers for drag selection
  // Only allow drag select on empty cells (not already covered by a change)
  return (
    <div
      className="flex border rounded overflow-hidden select-none"
      onMouseLeave={() => {
        if (pendingRange !== null) setHover(null);
      }}
    >
      {hours.map((h, idx) => {
        const changeIndex = getChangeAtHour(h);
        const changeObj = getChangeObjAtHour(h);
        let bgClass = "bg-white";
        // If currently selecting and hovering, highlight the range in blue
        if (pendingRange !== null && hoverHour !== null && isInHoverSelection(h)) {
          bgClass = "bg-blue-300";
        } else if (pendingRange !== null && hoverHour === null && h === pendingRange) {
          // Only start selected, no hover yet
          bgClass = "bg-blue-300";
        } else if (changeObj) {
          // Set color according to type
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

// ---------- ChangeEditor Component ----------
interface ChangeEditorProps {
  change: TAFChange | BaseForecast | null;
  onUpdate: (updated: TAFChange | BaseForecast) => void;
  showActionButtons?: boolean;
  onDelete?: () => void;
  onChangeType?: (type: "BECMG" | "FM" | "TEMPO") => void;
}

function ChangeEditor({ change, onUpdate, showActionButtons = false, onDelete, onChangeType }: ChangeEditorProps) {
  if (!change) return null;

  const state = emptyWeather(change.state);
  const wind = state.wind;
  const visibility = state.visibility;
  const clouds = state.clouds || [];

  // 新增 weather 狀態直接依賴 state.weather
  const weatherArr = state.weather || [];

  // 新增天氣現象，append 到陣列（包括空格）
  const addWeather = (w: string) => {
    const arr = [...weatherArr, w];
    onUpdate({ ...change, state: { ...state, weather: arr } });
  };

  // 移除指定 index 的天氣現象
  const removeWeather = (idx: number) => {
    const arr = weatherArr.slice();
    arr.splice(idx, 1);
    onUpdate({ ...change, state: { ...state, weather: arr } });
  };

  const nearestVisibility = (val: number) =>
    visibilityOptions.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );

  const updateWind = (field: keyof Wind, value: number | string) => {
    const newWind: Wind = { ...wind };
    if (field === "dir") {
      let dirVal = Number(value);
      if (dirVal < 0) dirVal = 0;
      else if (dirVal > 360) dirVal = 360;
      dirVal = Math.round(dirVal / 10) * 10;
      newWind.dir = dirVal;
    }
    if (field === "speed") newWind.speed = Math.max(0, Math.round(Number(value)));
    if (field === "gust") newWind.gust = value ? Math.round(Number(value)) : null;
    onUpdate({ ...change, state: { ...state, wind: newWind } });
  };

  const updateVisibility = (value: number) => {
    const vis = nearestVisibility(Number(value));
    onUpdate({ ...change, state: { ...state, visibility: vis } });
  };

  const updateCloud = (
    index: number,
    field: "amount" | "height" | "cb" | "tcu",
    value: string | number | boolean
  ) => {
    const updatedClouds = [...clouds];
    const target = { ...updatedClouds[index] };

    if (field === "amount") {
      target.amount = String(value);
    }

    if (field === "height") {
      const h = Math.max(0, Math.round(Number(value)));
      target.height = h;
    }

    if (field === "cb") {
      target.cb = Boolean(value);
      // if checked, unset tcu
      if (target.cb) target.tcu = false;
    }
    if (field === "tcu") {
      target.tcu = Boolean(value);
      // if checked, unset cb
      if (target.tcu) target.cb = false;
    }

    updatedClouds[index] = target;
    onUpdate({ ...change, state: { ...state, clouds: updatedClouds } });
  };

  const addCloud = () => {
    const updatedClouds = [...clouds, { amount: "FEW", height: 0 }];
    onUpdate({ ...change, state: { ...state, clouds: updatedClouds } });
  };

  const removeCloud = (index: number) => {
    const updatedClouds = [...clouds];
    updatedClouds.splice(index, 1);
    onUpdate({ ...change, state: { ...state, clouds: updatedClouds } });
  };

  const weatherDisabled = false;

  const showError = visibility <= 5000 && (weatherArr.length === 0);

  // Calculate left position for value label
  const minVis = 50;
  const maxVis = 10000;
  // We'll calculate relative left position based on visibility value
  const clampedVis = Math.min(Math.max(visibility, minVis), maxVis);
  const relativePos = ((clampedVis - minVis) / (maxVis - minVis)) * 100;

  // Determine current type for buttons (if any)
  const currentType = "type" in change && change.type ? change.type : null;
  const allTypes: ("TEMPO" | "BECMG" | "FM")[] = ["TEMPO", "BECMG", "FM"];

  // For cycling type: TEMPO → BECMG → FM → TEMPO
  function nextType(type: "TEMPO" | "BECMG" | "FM"): "TEMPO" | "BECMG" | "FM" {
    if (type === "TEMPO") return "BECMG";
    if (type === "BECMG") return "FM";
    return "TEMPO";
  }

  // For displaying as a button
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
          className={`px-3 py-1 rounded font-semibold mr-1 ${colorClass}`}
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
      <span className="bg-gray-300 px-2 rounded font-semibold text-black mr-1">
        BASE
      </span>
    );
  }

  return (
    <div className="border p-4 rounded bg-gray-100 space-y-2 relative">
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
              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
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

      {/* ---- Top Layer: Wind block (left) + Visibility/Weather block (right) ---- */}
      <div className="flex gap-4 mb-2">
        {/* Wind block (left) */}
        <div className="flex-1 border p-2 rounded flex flex-col gap-2 bg-white">
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
          </label>
        </div>
        {/* Visibility + Weather block (right) */}
      <div className="flex-1 border p-2 rounded flex flex-col gap-2 bg-white">
        <label className="block text-sm">
          Visibility
          <div className="relative w-full mt-2">
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
            <div
              className="absolute top-0 -mt-6 bg-white border rounded px-2 py-0.5 text-xs shadow"
              style={{
                width: "80px",
                left: `calc(${relativePos}% - 40px)`,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                textAlign: "center",
                overflow: "hidden",
              }}
            >
              {visibility === 10000 ? "10000+" : String(visibility).padStart(4, "0")}
            </div>
          </div>
        </label>
          {showError && (
            <div className="text-red-500 text-sm">Visibility ≤5000, weather must be selected</div>
          )}
          <div className="block text-sm">
            <div className="mb-1">Weather</div>
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              {/* "+" 按鈕 */}
              <button
                key="+"
                type="button"
                className="px-2 py-1 rounded border bg-blue-200 text-black"
                onClick={() => addWeather("+")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add +"
              >
                +
              </button>
              {/* "-" 按鈕 */}
              <button
                key="-"
                type="button"
                className="px-2 py-1 rounded border bg-blue-200 text-black"
                onClick={() => addWeather("-")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add -"
              >
                -
              </button>
              {/* "VC" 按鈕 */}
              <button
                key="VC"
                type="button"
                className="px-2 py-1 rounded border bg-purple-200 text-black"
                onClick={() => addWeather("VC")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add VC"
              >
                VC
              </button>
              {/* 空白按鈕 */}
              <button
                key="space"
                type="button"
                className="px-2 py-1 rounded border bg-white text-black font-mono"
                onClick={() => addWeather(" ")}
                disabled={weatherDisabled}
                tabIndex={0}
                aria-label="Add space"
              >
                <span className="inline-block" style={{ minWidth: "3em" }}>
                  space
                </span>
              </button>
              {/* 分隔線 */}
              <span className="border-l mx-1 h-6" />
              {/* 其他天氣現象按鈕 */}
              {weatherOptions
                .filter((w) => !["+", "-", "VC", " "].includes(w))
                .map((w) => {
                  // 天氣現象按鈕背景顏色
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
                      className={`px-2 py-1 rounded border ${bgClass} text-black`}
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
            {/* 已選天氣標籤容器，明顯區隔，位於按鈕區下方 */}
            {weatherArr.length > 0 && (
              <div className="border p-2 rounded bg-white flex flex-wrap gap-2 items-center mt-2">
                {weatherArr.map((w, idx) => (
                  <span
                    key={idx + "-" + w + "-tag"}
                    className={
                      w === " "
                        ? "inline-flex items-center bg-white text-black px-2 py-0.5 rounded font-mono border border-gray-400"
                        : "inline-flex items-center bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200"
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
            )}
          </div>
        </div>
      </div>

      {/* ---- Bottom Layer: Clouds ---- */}
      <div className="block text-sm mt-2 border p-2 rounded bg-white">
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
              {/* CB/TCU checkboxes */}
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
              <button
                type="button"
                onClick={() => removeCloud(idx)}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCloud}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Add Layer
          </button>
        </div>
      </div>

      {/* moved delete button up to header area */}
    </div>
  );
}

// ---------- TafBuilder ----------
export default function TafBuilder() {
  const [taf, setTaf] = useState<TAF>({
    station: "RCTP",
    issueTime: getCurrentIssueTimeUTC(),
    validFrom: "1006",
    validTo: "1106",
    base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
    changes: [],
  });

  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null);

  function getTimelineStartHour(issueTime: string): number {
    // Expect format DDHHMMZ
    const hour = Number(issueTime.slice(2, 4));
    const minute = Number(issueTime.slice(4, 6));
    if (isNaN(hour) || isNaN(minute)) return 0;
    return (hour + (minute > 0 ? 1 : 0)) % 24;
  }

  const timelineStartHour = getTimelineStartHour(taf.issueTime);
  // Remove showActionButtons state entirely
  // const [showActionButtons, setShowActionButtons] = useState(false);

  function addTempo(taf: TAF, from: number, to: number) {
    // 預設天氣狀況為 base forecast
    let defaultState: WeatherState = taf.base;
    // 從最後往前找最近的 BECMG
    for (let i = taf.changes.length - 1; i >= 0; i--) {
      if (taf.changes[i].type === "BECMG") {
        defaultState = taf.changes[i].state;
        break;
      }
    }
    // 深拷貝 defaultState
    const deepCopyState: WeatherState = {
      wind: { ...defaultState.wind },
      visibility: defaultState.visibility,
      weather: [...(defaultState.weather || [])],
      clouds: (defaultState.clouds || []).map(cloud => ({ ...cloud })),
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
    // setShowActionButtons(true); // removed
  }

  function updateChange(index: number | null, updatedChange: TAFChange) {
    if (index === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      changes[index] = updatedChange;
      return { ...prev, changes };
    });
  }

  // Remove handleSelectedChangeClick function
  // function handleSelectedChangeClick() {
  //   if (selectedChangeIndex !== null) {
  //     setShowActionButtons((prev) => !prev);
  //   }
  // }

  function handleDelete() {
    if (selectedChangeIndex === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      changes.splice(selectedChangeIndex, 1);
      return { ...prev, changes };
    });
    setSelectedChangeIndex(null);
    // setShowActionButtons(false); // removed
  }

  function handleChangeType(type: "BECMG" | "FM" | "TEMPO") {
    if (selectedChangeIndex === null) return;
    setTaf((prev) => {
      const changes = [...prev.changes];
      const change = changes[selectedChangeIndex];
      changes[selectedChangeIndex] = { ...change, type };
      return { ...prev, changes };
    });
    // setShowActionButtons(false); // removed
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">TAF Visual Builder (MVP)</h1>

      <section className="p-4 rounded">
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

      <section className="p-4 rounded">
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
              const toHour = (nextHour + 24) % 24; // 24-hour later
              const toDay = hour >= 23 ? day + 1 : day + 1; // next day
              return `${String(toDay).padStart(2, "0")}${String(nextHour).padStart(2, "0")}`;
            })(),
            state: taf.base,
          }}
          onUpdate={(updated) => setTaf((prev) => ({ ...prev, base: updated.state }))}
        />
      </section>

      <section className="p-4 rounded">
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

      <section className="p-4 rounded">
        <h2 className="font-semibold">Selected Change</h2>
        {selectedChangeIndex !== null ? (
          <div>
            <ChangeEditor
              change={taf.changes[selectedChangeIndex]}
              onUpdate={(updated) => updateChange(selectedChangeIndex, updated as TAFChange)}
              showActionButtons={true} // always show action buttons if selectedChangeIndex !== null
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
        <pre className="whitespace-pre-wrap text-sm bg-black text-green-400 p-3 rounded">
          {generateTAF(taf)}
        </pre>
      </section>
    </div>
  );
}