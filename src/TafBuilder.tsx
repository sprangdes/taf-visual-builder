import { useEffect, useRef, useState } from "react";
import ChangeEditor from "./components/ChangeEditor";
import GeneratedTafOutput from "./components/GeneratedTafOutput";
import IssueTimeInput from "./components/IssueTimeInput";
import SectionHeader from "./components/layout/SectionHeader";
import Timeline from "./components/Timeline";
import { TourMenu } from "./features/tour/TourMenu";
import { useTour } from "./features/tour/TourContext";
import { TourProvider } from "./features/tour/TourProvider";
import { createTourDemoTaf } from "./features/tour/tourDemo";
import type { TAF, TAFChange } from "./types/taf";
import { addTempo, generateTAF } from "./utils/taf";
import { getBaseForecastPeriod, getCurrentIssueTimeUTC, getTimelineStartHour } from "./utils/time";
import { createCloudLayer, emptyWeather } from "./utils/weather";

function createEmptyTaf(): TAF {
  return {
    station: "",
    issueTime: getCurrentIssueTimeUTC(),
    base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
    changes: [],
  };
}

function TourLauncher() {
  const tour = useTour();
  return <TourMenu onStart={tour.startTour} />;
}

export default function TafBuilder() {
  const [taf, setTaf] = useState<TAF>(createEmptyTaf);
  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (globalThis.window === undefined) return false;
    return globalThis.localStorage.getItem("taf-dark-mode") === "1";
  });
  const tafRef = useRef(taf);
  const selectedChangeIndexRef = useRef(selectedChangeIndex);
  const timelineStartHour = getTimelineStartHour(taf.issueTime);
  const basePeriod = getBaseForecastPeriod(taf.issueTime);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    globalThis.localStorage.setItem("taf-dark-mode", isDark ? "1" : "0");
    document.body.classList.toggle("taf-dark-page", isDark);
    return () => document.body.classList.remove("taf-dark-page");
  }, [isDark]);

  useEffect(() => {
    tafRef.current = taf;
  }, [taf]);

  useEffect(() => {
    selectedChangeIndexRef.current = selectedChangeIndex;
  }, [selectedChangeIndex]);

  function updateChange(index: number | null, updatedChange: TAFChange) {
    if (index === null) return;
    setTaf((previous) => {
      const changes = [...previous.changes];
      changes[index] = updatedChange;
      return { ...previous, changes };
    });
  }

  function handleDelete() {
    if (selectedChangeIndex === null) return;
    setTaf((previous) => {
      const changes = [...previous.changes];
      changes.splice(selectedChangeIndex, 1);
      return { ...previous, changes };
    });
    setSelectedChangeIndex(null);
  }

  function handleChangeType(type: "BECMG" | "FM" | "TEMPO") {
    if (selectedChangeIndex === null) return;
    setTaf((previous) => {
      const changes = [...previous.changes];
      changes[selectedChangeIndex] = { ...changes[selectedChangeIndex], type };
      return { ...previous, changes };
    });
  }

  const editor = {
    capture: () => ({ taf: tafRef.current, selectedChangeIndex: selectedChangeIndexRef.current }),
    loadDemo: () => {
      setTaf(createTourDemoTaf(getCurrentIssueTimeUTC()));
      setSelectedChangeIndex(0);
    },
    restore: (snapshot: { taf: TAF; selectedChangeIndex: number | null }) => {
      setTaf(snapshot.taf);
      setSelectedChangeIndex(snapshot.selectedChangeIndex);
    },
  };

  const changeLegend = (
    <div className="timeline-legend" aria-label="Change type legend">
      {(["TEMPO", "BECMG", "FM"] as const).map((type) => (
        <span key={type} className="timeline-legend-item">
          <i className={`timeline-legend-swatch timeline-legend-${type.toLowerCase()}`} aria-hidden="true" />
          {type}
        </span>
      ))}
    </div>
  );

  return (
    <TourProvider editor={editor}>
      <div className={`taf-app ${isDark ? "taf-dark" : ""}`}>
          <header className="workbench-appbar">
            <div className="workbench-brand">
              <span className="workbench-brand-mark" aria-hidden="true">TAF</span>
              <div>
                <h1>TAF Visual Builder</h1>
                <p>Aviation Weather Workbench</p>
              </div>
            </div>
            <div className="workbench-actions">
              <TourLauncher />
              <button
                type="button"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="theme-toggle icon-button"
                onClick={() => setIsDark((previous) => !previous)}
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
          </header>

          <main className="workbench-shell">
            <div className="workbench-page-heading"><h2>Create Terminal Aerodrome Forecast</h2></div>
            <div className="workbench-grid" data-testid="workbench-grid">
              <div className="workbench-editor">
                <section data-tour-id="context" className="taf-panel workbench-panel">
                  <SectionHeader step="01" title="Forecast context" description="Identify the aerodrome and forecast issue time." />
                  <div className="workbench-panel-body forecast-context-fields">
                    <label className="workbench-field" htmlFor="taf-station">
                      <span>ICAO station code</span>
                      <input id="taf-station" value={taf.station} onChange={(event) => setTaf((previous) => ({ ...previous, station: event.target.value }))} placeholder="ICAO Code" />
                    </label>
                    <label className="workbench-field" htmlFor="taf-issue-time">
                      <span>Issue time · DDHHMM</span>
                      <IssueTimeInput id="taf-issue-time" value={taf.issueTime} onChange={(value) => setTaf((previous) => ({ ...previous, issueTime: value }))} />
                    </label>
                  </div>
                </section>

                <section data-tour-id="base" className="taf-panel workbench-panel">
                  <SectionHeader step="02" title="Base forecast" description="Set prevailing conditions for the full validity period." aside={<span className="technical-time">{String(basePeriod.from).padStart(2, "0")}Z → {String(basePeriod.to).padStart(2, "0")}Z</span>} />
                  <div className="workbench-panel-body">
                    <ChangeEditor
                      change={{
                        from: basePeriod.from,
                        to: basePeriod.to,
                        state: {
                          ...taf.base,
                          clouds: taf.base.clouds?.length ? taf.base.clouds : [createCloudLayer({ amount: "FEW", height: 0 })],
                          enabledBlocks: { wind: true, vis: true, clouds: true },
                        },
                      }}
                      onUpdate={(updated) => setTaf((previous) => ({
                        ...previous,
                        base: {
                          ...updated.state,
                          clouds: updated.state.clouds?.length ? updated.state.clouds : [createCloudLayer({ amount: "FEW", height: 0 })],
                          enabledBlocks: undefined,
                        },
                      }))}
                    />
                  </div>
                </section>

                <section data-tour-id="timeline" className="taf-panel workbench-panel">
                  <SectionHeader step="03" title="Forecast timeline" description="Select a start and end hour to create a change block." aside={changeLegend} />
                  <div className="workbench-panel-body">
                    <Timeline
                      changes={taf.changes}
                      startHour={timelineStartHour}
                      isDark={isDark}
                      onSelectRange={(from, to) => {
                        const result = addTempo(taf, from, to);
                        setTaf(result.taf);
                        setSelectedChangeIndex(result.index);
                      }}
                      onSelectChange={(index) => setSelectedChangeIndex((previous) => previous === index ? null : index)}
                    />
                  </div>
                </section>

                {selectedChangeIndex !== null && (
                  <section data-tour-id="selected-change" className="taf-panel workbench-panel">
                    <SectionHeader step="04" title="Selected change" description="Fine-tune the conditions that change in this period." />
                    <div className="workbench-panel-body">
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
              </div>

              <section data-tour-id="output" className="taf-panel workbench-panel workbench-output">
                <SectionHeader step="05" title="Generated TAF" description="Updates live as conditions change." aside={<span className="live-indicator"><i aria-hidden="true" />Live</span>} />
                <div className="workbench-panel-body">
                  <GeneratedTafOutput
                    text={generateTAF(taf)}
                    station={taf.station}
                    validityFrom={basePeriod.from}
                    validityTo={basePeriod.to}
                    changeCount={taf.changes.length}
                  />
                </div>
              </section>
            </div>
          </main>
      </div>
    </TourProvider>
  );
}
