import { useState } from "react";
import { cloudAmountOptions, visibilityOptions, weatherOptions } from "../constants/weather";
import type {
  BaseForecast,
  ChangeEditorProps,
  EditableBlockKey,
  TAFChange,
  WeatherState,
  Wind,
} from "../types/taf";
import { createCloudLayer, emptyWeather } from "../utils/weather";
import ChangeDeleteButton from "./buttons/ChangeDeleteButton";
import CloudDeleteButton from "./buttons/CloudDeleteButton";
import TypeButton from "./buttons/TypeButton";

interface ChangeEditorInnerProps extends Omit<ChangeEditorProps, "change"> {
  change: TAFChange | BaseForecast;
}

function nearestVisibility(val: number): number {
  return visibilityOptions.reduce(
    (prev, curr) => (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev),
    visibilityOptions[0],
  );
}

function ChangeEditorInner({
  change,
  onUpdate,
  showActionButtons = false,
  onDelete,
  onChangeType,
}: Readonly<ChangeEditorInnerProps>) {
  const isBase = !("type" in change);
  const enabledBlocks = change.state.enabledBlocks || { wind: false, vis: false, clouds: false };
  const [windEnabled, setWindEnabled] = useState(enabledBlocks.wind ?? isBase);
  const [visEnabled, setVisEnabled] = useState(enabledBlocks.vis ?? isBase);
  const [cloudEnabled, setCloudEnabled] = useState(enabledBlocks.clouds ?? isBase);
  const [showDeleteChangeTooltip, setShowDeleteChangeTooltip] = useState(false);

  const state = emptyWeather(change.state);
  const wind = state.wind;
  const visibility = state.visibility;
  const clouds =
    state.clouds && state.clouds.length > 0
      ? state.clouds
      : [createCloudLayer({ amount: "FEW", height: 0 })];
  const weatherArr = state.weather || [];
  const prevEnabledBlocks = change.state.enabledBlocks ?? {};

  const updateChangeState = (patch: Partial<WeatherState>) => {
    onUpdate({
      ...change,
      state: {
        ...change.state,
        ...patch,
      },
    });
  };

  const setBlockEnabled = (block: EditableBlockKey, enabled: boolean) => {
    if (block === "wind") setWindEnabled(enabled);
    if (block === "vis") setVisEnabled(enabled);
    if (block === "clouds") setCloudEnabled(enabled);

    updateChangeState({
      enabledBlocks: {
        ...prevEnabledBlocks,
        [block]: enabled,
      },
    });
  };

  const addWeather = (w: string) => {
    const arr = [...(change.state.weather || []), w];
    updateChangeState({
      weather: arr,
      enabledBlocks: {
        ...prevEnabledBlocks,
        vis: change.state.enabledBlocks?.vis ?? visEnabled,
      },
    });
  };

  const removeWeather = (idx: number) => {
    const arr = [...(change.state.weather || [])];
    arr.splice(idx, 1);
    updateChangeState({
      weather: arr,
      enabledBlocks: {
        ...prevEnabledBlocks,
        vis: change.state.enabledBlocks?.vis ?? visEnabled,
      },
    });
  };

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

    updateChangeState({
      wind: newWind,
      enabledBlocks: {
        ...prevEnabledBlocks,
        wind: change.state.enabledBlocks?.wind ?? windEnabled,
      },
    });
  };

  const updateVisibility = (value: number) => {
    const vis = nearestVisibility(Number(value));
    updateChangeState({
      visibility: vis,
      enabledBlocks: {
        ...prevEnabledBlocks,
        vis: change.state.enabledBlocks?.vis ?? visEnabled,
      },
    });
  };

  const updateCloud = (
    id: string,
    field: "amount" | "height" | "cb" | "tcu",
    value: string | number | boolean,
  ) => {
    const prevClouds =
      change.state.clouds && change.state.clouds.length > 0
        ? change.state.clouds.map((c) => (c.id ? c : createCloudLayer(c)))
        : [createCloudLayer({ amount: "FEW", height: 0 })];

    const nextClouds = prevClouds.map((c) => {
      if (c.id !== id) return c;

      const target = { ...c };
      if (field === "amount") target.amount = String(value);
      if (field === "height") target.height = Math.max(0, Math.round(Number(value)));
      if (field === "cb") {
        target.cb = Boolean(value);
        if (target.cb) target.tcu = false;
      }
      if (field === "tcu") {
        target.tcu = Boolean(value);
        if (target.tcu) target.cb = false;
      }
      return target;
    });

    updateChangeState({
      clouds: nextClouds,
      enabledBlocks: {
        ...prevEnabledBlocks,
        clouds: change.state.enabledBlocks?.clouds ?? cloudEnabled,
      },
    });
  };

  const addCloud = () => {
    const prevClouds = (change.state.clouds || []).map((c) => (c.id ? c : createCloudLayer(c)));
    const updatedClouds = [...prevClouds, createCloudLayer({ amount: "FEW", height: 0 })];
    updateChangeState({
      clouds: updatedClouds,
      enabledBlocks: {
        ...prevEnabledBlocks,
        clouds: change.state.enabledBlocks?.clouds ?? cloudEnabled,
      },
    });
  };

  const removeCloud = (id: string) => {
    const prevClouds = (change.state.clouds || []).map((c) => (c.id ? c : createCloudLayer(c)));
    if (prevClouds.length <= 1) return;

    const updatedClouds = prevClouds.filter((c) => c.id !== id);
    updateChangeState({
      clouds: updatedClouds,
      enabledBlocks: {
        ...prevEnabledBlocks,
        clouds: change.state.enabledBlocks?.clouds ?? cloudEnabled,
      },
    });
  };

  const weatherDisabled = false;
  const showError = visibility <= 5000 && weatherArr.length === 0;
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
            <>
              {String(Number(change.from.slice(-2))).padStart(2, "0")}Z-{String(
                Number(change.to.slice(-2)),
              ).padStart(2, "0")}
              Z
            </>
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
        <div
          className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${
            windEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"
          }`}
        >
          {!isBase && windEnabled && (
            <button
              type="button"
              onClick={() => {
                setBlockEnabled("wind", false);
              }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
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
                  setBlockEnabled("wind", true);
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
          {!windEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl" />}
        </div>

        <div
          className={`flex-1 border p-2 rounded-xl flex flex-col gap-2 bg-white relative ${
            visEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"
          }`}
        >
          {!isBase && visEnabled && (
            <button
              type="button"
              onClick={() => {
                setBlockEnabled("vis", false);
              }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
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
                  setBlockEnabled("vis", true);
                }}
                className="bg-gray-800 text-white px-3 py-1 rounded-xl text-sm"
              >
                Active Visibility/Weather to Edit
              </button>
            </div>
          )}
          <label htmlFor="visibility" className="block text-sm">
            <div className="flex items-center">
              <span id="visibility-label">Visibility</span>
              <span style={{ marginLeft: "8px", fontSize: "14px", fontWeight: 500, color: "#333" }}>
                {visibility} m
              </span>
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
                >
                  {opt.code === " " ? (
                    <span className="inline-block" style={{ minWidth: "3em" }}>
                      space
                    </span>
                  ) : (
                    opt.code
                  )}
                </button>
              ))}
            </div>

            <div className="border p-2 rounded-xl bg-white flex flex-wrap gap-2 items-center mt-2 h-10">
              {weatherArr.map((w, idx) => {
                const opt = weatherOptions.find((o) => o.code === w);
                const bgClass = opt ? opt.color : "bg-white";
                return (
                  <button
                    key={`${idx}-${w}-tag`}
                    type="button"
                    className={`inline-flex items-center ${bgClass} text-black px-2 py-0.5 rounded-xl border border-gray-300 ${
                      w === " " ? "font-mono" : ""
                    }`}
                    onClick={() => removeWeather(idx)}
                    aria-label={`Remove ${w === " " ? "space" : w}`}
                  >
                    {w === " " ? (
                      <span className="font-mono" style={{ minWidth: "3em" }}>
                        space
                      </span>
                    ) : (
                      w
                    )}
                  </button>
                );
              })}
              {showError && (
                <span className="text-red-500 text-sm ml-2">Visibility 5000m Or Below, Weather Must Be Selected</span>
              )}
            </div>
          </div>
          {!visEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl" />}
        </div>
      </div>

      <div
        className={`block text-sm mt-2 border p-2 rounded-xl bg-white relative ${
          cloudEnabled ? "" : "opacity-60 bg-gray-300 pointer-events-none grayscale"
        }`}
      >
        {!isBase && cloudEnabled && (
          <button
            type="button"
            onClick={() => {
              setBlockEnabled("clouds", false);
            }}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-base font-semibold rounded-full hover:bg-gray-200 transition text-gray-400"
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
                setBlockEnabled("clouds", true);
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
          {clouds.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <select
                value={c.amount}
                onChange={(e) => updateCloud(c.id, "amount", e.target.value)}
                className="border p-1 rounded-xl px-3 w-20"
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
                onChange={(e) => updateCloud(c.id, "height", e.target.value)}
                className="border p-1 rounded-xl px-3 w-20"
              />
              <span className="text-sm">(hundreds ft)</span>
              <label className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={!!c.cb}
                  onChange={(e) => updateCloud(c.id, "cb", e.target.checked)}
                />
                <span>CB</span>
              </label>
              <label className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={!!c.tcu}
                  onChange={(e) => updateCloud(c.id, "tcu", e.target.checked)}
                />
                <span>TCU</span>
              </label>
              {clouds.length > 1 && <CloudDeleteButton onClick={() => removeCloud(c.id)} />}
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

        {!cloudEnabled && <div className="absolute inset-0 bg-gray-400/40 backdrop-blur-[2px] rounded-xl" />}
      </div>
    </div>
  );
}

export default function ChangeEditor(props: Readonly<ChangeEditorProps>) {
  if (!props.change) return null;
  return <ChangeEditorInner {...props} change={props.change} />;
}
