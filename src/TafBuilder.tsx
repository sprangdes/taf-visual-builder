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
  clouds: { amount: string; height: number }[];
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
const weatherOptions = ["RA", "SN", "DZ", "FG", "BR", "TS", "SH", "HZ"];
const cloudAmountOptions = ["FEW", "SCT", "BKN", "OVC"];
const visibilityOptions = [
  50, 60, 80, 100, 200, 240, 300, 400, 480, 600, 800, 1000, 1200,
  1400, 1600, 2000, 2400, 2800, 3000, 3200, 4000, 4800, 5000,
  6000, 7000, 8000, 9000, 10000,
];

function emptyWeather({
  wind = { dir: 0, speed: 0, gust: null },
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

function formatClouds(clouds: { amount: string; height: number }[]) {
  return (clouds || [])
    .map((c) => `${c.amount}${String(c.height).padStart(3, "0")}`)
    .join(" ");
}

function formatWeatherState(state: WeatherState) {
  const vis = String(state.visibility >= 10000 ? 9999 : state.visibility).padStart(4, "0");
  return [
    formatWind(state.wind),
    vis,
    (state.weather || []).join(""),
    formatClouds(state.clouds),
  ]
    .filter(Boolean)
    .join(" ");
}

function generateTAF(taf: TAF) {
  const header = `TAF ${taf.station} ${taf.issueTime} ${taf.validFrom}/${taf.validTo}`;
  const baseForecast = formatWeatherState(taf.base);

  const changes = (taf.changes || [])
    .map((c) => {
      if (c.type === "FM") {
        const fmTime = String(c.from).padStart(6, "0");
        return `FM${fmTime} ${formatWeatherState(c.state)}`;
      } else {
        const fromTime = String(c.from).padStart(4, "0");
        const toTime = String(c.to).padStart(4, "0");
        return `${c.type} ${fromTime}/${toTime} ${formatWeatherState(c.state)}`;
      }
    })
    .join("\n");

  return [header, baseForecast, changes].filter(Boolean).join("\n");
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
  const { pendingRange, selectHour, hoverHour, setHover, reset } = useTimeRange();
  // Returns the index of the first change covering this hour, or -1 if none
  const getChangeAtHour = (h: number) =>
    (changes || []).findIndex((c) => h >= Number(c.from) && h <= Number(c.to));
  // Returns the change object at this hour, or null if none
  const getChangeObjAtHour = (h: number) =>
    (changes || []).find((c) => h >= Number(c.from) && h <= Number(c.to)) || null;

  // Track drag selection state in local state
  const [internalPending, setInternalPending] = useState<number | null>(null);
  const [internalHover, setInternalHover] = useState<number | null>(null);

  // We want to use the hook's state, but also expose it to the parent Timeline component
  // So, we combine both: the hook's state (pendingRange, hoverHour) and our own internal state.
  // But since Timeline is a function component, we need to "lift" state up to this component.
  // Let's use the hook's state for the actual logic.

  // Helper to determine if hour is in current drag/hover range
  function isInHoverSelection(h: number) {
    if (pendingRange !== null && hoverHour !== null) {
      const s = Math.min(pendingRange, hoverHour);
      const e = Math.max(pendingRange, hoverHour);
      return h >= s && h <= e;
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
      {hours.map((h) => {
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
            onClick={() =>
              changeIndex !== -1
                ? onSelectChange(changeIndex)
                : selectHour(h, onSelectRange)
            }
            onMouseEnter={() => {
              if (pendingRange !== null) setHover(h);
            }}
            onMouseLeave={() => {
              if (pendingRange !== null) setHover(null);
            }}
            className={`flex-1 h-12 text-xs flex items-center justify-center border-r cursor-pointer ${bgClass}`}
            style={{ transition: "background 0.1s" }}
          >
            {h}Z
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
  const weather = state.weather;
  const clouds = state.clouds || [];

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

  const updateWeather = (value: string) => {
    onUpdate({ ...change, state: { ...state, weather: value ? [value] : [] } });
  };

  const updateCloud = (index: number, field: "amount" | "height", value: string | number) => {
    const updatedClouds = [...clouds];
    const target = { ...updatedClouds[index] };

    if (field === "amount") {
      target.amount = String(value);
    }

    if (field === "height") {
      const h = Math.max(0, Math.round(Number(value)));
      target.height = h;
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

  const showError = visibility <= 5000 && weather.length === 0;

  // Calculate left position for value label
  const minVis = 50;
  const maxVis = 10000;
  const sliderWidth = 300; // approximate width in px of the slider container for positioning
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
      <h3 className="font-semibold flex items-center">
        Edit{" "}
        <span className="ml-2">
          {renderTypeButton()}
        </span>
        {change.from}Z–{change.to}Z
      </h3>

      <label className="block text-sm">
        Wind Direction (0-360°, 10° increments)
        <input
          type="number"
          className="border ml-2"
          value={wind.dir}
          step={10}
          min={0}
          max={360}
          onChange={(e) => updateWind("dir", e.target.value)}
        />
      </label>

      <label className="block text-sm">
        Wind Speed
        <input
          type="number"
          className="border ml-2"
          value={wind.speed}
          min={0}
          step={1}
          onChange={(e) => updateWind("speed", e.target.value)}
        />
      </label>

      <label className="block text-sm">
        Wind Gust
        <input
          type="number"
          className="border ml-2"
          value={wind.gust ?? ""}
          min={0}
          step={1}
          onChange={(e) => updateWind("gust", e.target.value)}
        />
      </label>

      <label className="block text-sm">
        Visibility
        <div className="relative w-full mt-2" style={{ maxWidth: "300px" }}>
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

      <label className="block text-sm">
        Weather
        <select
          value={weather[0] || ""}
          onChange={(e) => updateWeather(e.target.value)}
          disabled={weatherDisabled}
          className="border ml-2"
        >
          <option value="">--Select--</option>
          {weatherOptions.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>

      <div className="block text-sm">
        <div className="flex items-center justify-between">
          <span>Clouds</span>
          <button
            type="button"
            onClick={addCloud}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Add Layer
          </button>
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

              <button
                type="button"
                onClick={() => removeCloud(idx)}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      {showError && (
        <div className="text-red-500 text-sm">Visibility ≤5000, weather must be selected</div>
      )}

      {showActionButtons && onDelete && (
        <button
          className="absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          delete
        </button>
      )}
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
    base: emptyWeather({ wind: { dir: 0, speed: 0, gust: null }, visibility: 9999 }),
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
    const newChange: TAFChange = {
      type: "TEMPO",
      from: String(from),
      to: String(to),
      state: emptyWeather({ wind: { dir: 0, speed: 0, gust: null }, visibility: 9999 }),
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

      <section className="border p-4 rounded">
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

      <section className="border p-4 rounded">
        <h2 className="font-semibold">Base Forecast</h2>
        <ChangeEditor
          change={{ from: taf.validFrom, to: taf.validTo, state: taf.base }}
          onUpdate={(updated) => setTaf((prev) => ({ ...prev, base: updated.state }))}
        />
      </section>

      <section className="border p-4 rounded">
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

      <section className="border p-4 rounded">
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

      <section className="border p-4 rounded bg-gray-50">
        <h2 className="font-semibold">Generated TAF</h2>
        <pre className="whitespace-pre-wrap text-sm bg-black text-green-400 p-3 rounded">
          {generateTAF(taf)}
        </pre>
      </section>
    </div>
  );
}