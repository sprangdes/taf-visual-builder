import { useState } from "react";
import { visibilityOptions } from "../constants/weather";
import type {
  BaseForecast,
  ChangeEditorProps,
  EditableBlockKey,
  TAFChange,
  WeatherState,
  Wind,
} from "../types/taf";
import { toBoundedNonNegativeInt, toWindDirection } from "../utils/number";
import { createCloudLayer, emptyWeather } from "../utils/weather";
import ChangeDeleteButton from "./buttons/ChangeDeleteButton";
import TypeButton from "./buttons/TypeButton";
import CloudSection from "./CloudSection";
import VisibilitySection from "./VisibilitySection";
import WindSection from "./WindSection";

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

    if (field === "dir") newWind.dir = toWindDirection(value);
    if (field === "speed") newWind.speed = toBoundedNonNegativeInt(value, 99);
    if (field === "gust") newWind.gust = value === "" ? null : toBoundedNonNegativeInt(value, 99);

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
      if (field === "height") target.height = toBoundedNonNegativeInt(value as string | number, 999);
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
    <div className="taf-editor border p-3 sm:p-4 rounded-xl bg-gray-100 space-y-3 relative">
      <div className="flex items-center relative pr-9">
        <h3 className="font-semibold text-sm sm:text-base flex flex-wrap items-center gap-y-1 m-0 p-0">
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

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-2">
        <WindSection
          isBase={isBase}
          windEnabled={windEnabled}
          wind={wind}
          onSetEnabled={(enabled) => setBlockEnabled("wind", enabled)}
          onUpdateWind={updateWind}
        />
        <VisibilitySection
          isBase={isBase}
          visEnabled={visEnabled}
          visibility={visibility}
          weatherArr={weatherArr}
          showError={showError}
          weatherDisabled={weatherDisabled}
          minVis={minVis}
          maxVis={maxVis}
          onSetEnabled={(enabled) => setBlockEnabled("vis", enabled)}
          onUpdateVisibility={updateVisibility}
          onAddWeather={addWeather}
          onRemoveWeather={removeWeather}
        />
      </div>
      <CloudSection
        isBase={isBase}
        cloudEnabled={cloudEnabled}
        clouds={clouds}
        onSetEnabled={(enabled) => setBlockEnabled("clouds", enabled)}
        onUpdateCloud={updateCloud}
        onAddCloud={addCloud}
        onRemoveCloud={removeCloud}
      />
    </div>
  );
}

export default function ChangeEditor(props: Readonly<ChangeEditorProps>) {
  if (!props.change) return null;
  return <ChangeEditorInner {...props} change={props.change} />;
}
