import { useEffect, useState } from "react";
import ChangeEditor from "./components/ChangeEditor";
import IssueTimeInput from "./components/IssueTimeInput";
import Timeline from "./components/Timeline";
import type { TAF, TAFChange } from "./types/taf";
import { addTempo, generateTAF } from "./utils/taf";
import { getBaseForecastPeriod, getCurrentIssueTimeUTC, getTimelineStartHour } from "./utils/time";
import { createCloudLayer, emptyWeather } from "./utils/weather";

export default function TafBuilder() {
  const [taf, setTaf] = useState<TAF>({
    station: "",
    issueTime: getCurrentIssueTimeUTC(),
    base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
    changes: [],
  });

  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("taf-dark-mode") === "1";
  });
  const timelineStartHour = getTimelineStartHour(taf.issueTime);
  const basePeriod = getBaseForecastPeriod(taf.issueTime);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taf-dark-mode", isDark ? "1" : "0");
    document.body.classList.toggle("taf-dark-page", isDark);
    return () => {
      document.body.classList.remove("taf-dark-page");
    };
  }, [isDark]);

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

  return (
    <div
      className={`taf-app mx-auto max-w-6xl lg:min-w-[1040px] p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5 ${
        isDark ? "taf-dark" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-bold">TAF Visual Builder</h1>
        <button
          type="button"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="theme-toggle border rounded-full w-9 h-9 inline-flex items-center justify-center"
          onClick={() => setIsDark((prev) => !prev)}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1ZM12 19a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1ZM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1ZM19 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1ZM4.22 4.22a1 1 0 0 1 1.42 0l1.41 1.41a1 1 0 1 1-1.41 1.42L4.22 5.64a1 1 0 0 1 0-1.42ZM16.95 16.95a1 1 0 0 1 1.41 0l1.42 1.41a1 1 0 1 1-1.42 1.42l-1.41-1.42a1 1 0 0 1 0-1.41ZM19.78 4.22a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 0 1-1.41-1.42l1.41-1.41a1 1 0 0 1 1.42 0ZM7.05 16.95a1 1 0 0 1 0 1.41l-1.41 1.42a1 1 0 1 1-1.42-1.42l1.42-1.41a1 1 0 0 1 1.41 0Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
              <path d="M21 14.5A9 9 0 1 1 9.5 3 7 7 0 1 0 21 14.5Z" />
            </svg>
          )}
        </button>
      </div>

      <section className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
        <h2 className="font-semibold">Header</h2>
        <div className="mt-2 flex flex-col items-start md:flex-row md:items-center gap-2">
          <input
            value={taf.station}
            onChange={(e) => setTaf((prev) => ({ ...prev, station: e.target.value }))}
            className="border p-1 rounded-xl w-36 md:w-40"
            placeholder="ICAO Code"
          />
          <div className="w-36 md:w-40">
            <IssueTimeInput
              value={taf.issueTime}
              onChange={(val) => setTaf((prev) => ({ ...prev, issueTime: val }))}
            />
          </div>
        </div>
      </section>

      <section className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
        <h2 className="font-semibold">Base Forecast</h2>
        <ChangeEditor
          change={{
            from: basePeriod.from,
            to: basePeriod.to,
            state: {
              ...taf.base,
              clouds:
                taf.base.clouds && taf.base.clouds.length > 0
                  ? taf.base.clouds
                  : [createCloudLayer({ amount: "FEW", height: 0 })],
              enabledBlocks: { wind: true, vis: true, clouds: true },
            },
          }}
          onUpdate={(updated) =>
            setTaf((prev) => ({
              ...prev,
              base: {
                ...updated.state,
                clouds:
                  updated.state.clouds && updated.state.clouds.length > 0
                    ? updated.state.clouds
                    : [createCloudLayer({ amount: "FEW", height: 0 })],
                enabledBlocks: undefined,
              },
            }))
          }
        />
      </section>

      <section className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <h2 className="font-semibold mb-0">Timeline</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <div className="flex items-center gap-1">
              <span
                className={`w-4 h-4 rounded-sm border border-black ${isDark ? "bg-yellow-700" : "bg-yellow-300"}`}
              />
              <span className="text-xs">TEMPO</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-4 h-4 rounded-sm border border-black ${isDark ? "bg-green-700" : "bg-green-300"}`}
              />
              <span className="text-xs">BECMG</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-4 h-4 rounded-sm border border-black ${isDark ? "bg-orange-700" : "bg-orange-300"}`}
              />
              <span className="text-xs">FM</span>
            </div>
          </div>
        </div>

        <Timeline
          changes={taf.changes}
          startHour={timelineStartHour}
          isDark={isDark}
          onSelectRange={handleSelectRange}
          onSelectChange={(index) => {
            setSelectedChangeIndex((prev) => (prev === index ? null : index));
          }}
        />
      </section>

      {selectedChangeIndex !== null && (
        <section className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
          <h2 className="font-semibold">Selected Change</h2>
          <div>
            <ChangeEditor
              key={selectedChangeIndex}
              change={taf.changes[selectedChangeIndex]}
              onUpdate={(updated) => updateChange(selectedChangeIndex, updated as TAFChange)}
              showActionButtons
              onDelete={handleDelete}
              onChangeType={handleChangeType}
            />
          </div>
        </section>
      )}

      <section className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
        <h2 className="font-semibold">Generated TAF</h2>
        <pre className="taf-code whitespace-pre-wrap overflow-x-auto text-xs sm:text-sm p-3 rounded-xl border">
          {generateTAF(taf)}
        </pre>
      </section>
    </div>
  );
}
