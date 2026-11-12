import { useEffect, useMemo, useRef, useState } from "react";
import ChangeEditor from "./components/ChangeEditor";
import GeneratedTafOutput from "./components/GeneratedTafOutput";
import IssueTimeInput from "./components/IssueTimeInput";
import { TafChecks, TafSummary } from "./components/TafInsights";
import Timeline from "./components/Timeline";
import WeatherScene from "./components/WeatherScene";
import { TourMenu } from "./features/tour/TourMenu";
import { useTour } from "./features/tour/TourContext";
import { TourProvider } from "./features/tour/TourProvider";
import { createTourDemoTaf } from "./features/tour/tourDemo";
import { useLanguage } from "./features/i18n/LanguageContext";
import { LanguageMenu } from "./features/i18n/LanguageMenu";
import type { TAF, TAFChange, WeatherTrendType } from "./types/taf";
import { addChange, generateTAFLines } from "./utils/taf";
import { describeBase, describePeriod } from "./utils/tafInsights";
import { getBaseForecastPeriod, getCurrentIssueTimeUTC, getTimelineStartHour } from "./utils/time";
import { formatHour, getChangeRange, indexToHour } from "./utils/timeline";
import { createCloudLayer, emptyWeather, getEffectiveState } from "./utils/weather";

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

function periodCode(change: TAFChange): string {
  const from = `${formatHour(Number(change.from))}Z`;
  return change.type === "FM" ? `FM ${from}` : `${change.type} ${from}–${formatHour(Number(change.to))}Z`;
}

const TYPE_ORDER: Record<WeatherTrendType, number> = { TEMPO: 0, BECMG: 1, FM: 2 };

export default function TafBuilder() {
  const { text } = useLanguage();
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

  const selectedChange = selectedChangeIndex === null ? null : taf.changes[selectedChangeIndex] ?? null;

  function updateChange(index: number, updatedChange: TAFChange) {
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

  function handleChangeType(type: WeatherTrendType) {
    if (selectedChangeIndex === null) return;
    setTaf((previous) => {
      const changes = [...previous.changes];
      const current = changes[selectedChangeIndex];
      const next: TAFChange = { ...current, type };
      if (type !== "FM" && current.type === "FM") {
        const range = getChangeRange(current, previous.changes, getTimelineStartHour(previous.issueTime));
        next.to = String(indexToHour(Math.min(range.start + 1, 24), getTimelineStartHour(previous.issueTime)));
      }
      changes[selectedChangeIndex] = next;
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

  const baseForEditor = {
    ...taf.base,
    clouds: taf.base.clouds?.length ? taf.base.clouds : [createCloudLayer({ amount: "FEW", height: 0 })],
  };

  const sceneState = useMemo(() => getEffectiveState(taf.base, selectedChange), [taf.base, selectedChange]);
  const lines = generateTAFLines(taf);
  const baseLabel = describeBase(taf.issueTime, text.decode);
  const periodTabs = taf.changes
    .map((change, index) => ({ change, index, range: getChangeRange(change, taf.changes, timelineStartHour) }))
    .sort((a, b) => a.range.start - b.range.start || TYPE_ORDER[a.change.type] - TYPE_ORDER[b.change.type]);
  const sceneLabel = selectedChange ? periodCode(selectedChange) : text.sections.base.title;

  return (
    <TourProvider editor={editor}>
      <div className={`taf-app ${isDark ? "taf-dark" : ""}`}>
        <WeatherScene key={selectedChangeIndex ?? "base"} state={sceneState} />

        <div className="app-content">
          <div className="appbar-wrap">
            <header className="workbench-appbar glass-panel">
              <div className="workbench-brand">
                <span className="workbench-brand-mark" aria-hidden="true">TAF</span>
                <div>
                  <h1>{text.app.title}</h1>
                  <p>{text.app.subtitle}</p>
                </div>
              </div>

              <div className="forecast-context" data-tour-id="context" role="group" aria-label={text.header.context}>
                <label className="context-field" htmlFor="taf-station">
                  <span>ICAO</span>
                  <input
                    id="taf-station"
                    aria-label={text.fields.station}
                    value={taf.station}
                    maxLength={4}
                    autoCapitalize="characters"
                    spellCheck={false}
                    onChange={(event) => setTaf((previous) => ({ ...previous, station: event.target.value.toUpperCase() }))}
                    placeholder={text.fields.stationPlaceholder}
                  />
                </label>
                <label className="context-field context-field--time" htmlFor="taf-issue-time">
                  <span>{text.fields.issueTime.split(" · ")[0]}</span>
                  <IssueTimeInput id="taf-issue-time" value={taf.issueTime} onChange={(value) => setTaf((previous) => ({ ...previous, issueTime: value }))} />
                </label>
                <span className="context-chip">
                  <span>{text.header.validity}</span>
                  <strong>{basePeriod.from}/{basePeriod.to}</strong>
                </span>
                <span className="context-chip context-chip--scene" aria-live="polite">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a5 5 0 1 1 1.6-9.7A6 6 0 0 1 20 11a4 4 0 0 1-1 7H7Z" /></svg>
                  <span>{text.header.scene}</span>
                  <strong>{sceneLabel}</strong>
                </span>
              </div>

              <div className="workbench-actions">
                <TourLauncher />
                <LanguageMenu />
                <button
                  type="button"
                  aria-label={isDark ? text.theme.light : text.theme.dark}
                  title={isDark ? text.theme.light : text.theme.dark}
                  className="theme-toggle icon-button"
                  onClick={() => setIsDark((previous) => !previous)}
                >
                  {isDark ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
                    </svg>
                  )}
                </button>
              </div>
            </header>
          </div>

          <main className="workbench-shell">
            <h2 className="visually-hidden">{text.app.pageTitle}</h2>
            <div className="workbench-grid" data-testid="workbench-grid">
              <div className="workbench-editor">
                <section data-tour-id="timeline" className="glass-panel workbench-panel" aria-labelledby="timeline-title">
                  <div className="panel-heading">
                    <h2 id="timeline-title">{text.sections.timeline.title}</h2>
                    <div className="timeline-legend" aria-label={text.legend}>
                      {(["TEMPO", "BECMG", "FM"] as const).map((type) => (
                        <span key={type} className="timeline-legend-item">
                          <i className={`timeline-legend-swatch timeline-legend-${type.toLowerCase()}`} aria-hidden="true" />
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Timeline
                    changes={taf.changes}
                    base={taf.base}
                    startHour={timelineStartHour}
                    selectedChangeIndex={selectedChangeIndex}
                    onCreate={(type, range) => {
                      const result = addChange(
                        taf,
                        type,
                        indexToHour(range.start, timelineStartHour),
                        indexToHour(range.end, timelineStartHour),
                      );
                      setTaf(result.taf);
                      setSelectedChangeIndex(result.index);
                    }}
                    onSelectChange={(index) => setSelectedChangeIndex(index)}
                    onSelectBase={() => setSelectedChangeIndex(null)}
                  />
                </section>

                <section
                  data-tour-id={selectedChange ? "selected-change" : "base-editor"}
                  className="glass-panel workbench-panel editor-panel"
                  aria-labelledby="editor-title"
                >
                  <h2 id="editor-title" className="visually-hidden">
                    {selectedChange ? text.sections.selectedChange.title : text.sections.base.title}
                  </h2>
                  <nav className="period-tabs" aria-label={text.editor.periods}>
                    <button
                      type="button"
                      data-tour-id="base"
                      className={`period-tab ${selectedChange ? "" : "is-on"}`}
                      aria-pressed={!selectedChange}
                      onClick={() => setSelectedChangeIndex(null)}
                    >
                      {text.sections.base.title}
                    </button>
                    {periodTabs.map(({ change, index }) => (
                      <button
                        key={index}
                        type="button"
                        className={`period-tab ${selectedChangeIndex === index ? "is-on" : ""}`}
                        aria-pressed={selectedChangeIndex === index}
                        onClick={() => setSelectedChangeIndex(index)}
                      >
                        <i className={`timeline-legend-swatch timeline-legend-${change.type.toLowerCase()}`} aria-hidden="true" />
                        <span className="mono">{periodCode(change)}</span>
                      </button>
                    ))}
                  </nav>

                  {selectedChange && selectedChangeIndex !== null ? (
                    <ChangeEditor
                      key={selectedChangeIndex}
                      change={selectedChange}
                      base={taf.base}
                      periodLabel={describePeriod(selectedChange, text.decode)}
                      startHour={timelineStartHour}
                      changes={taf.changes}
                      onUpdate={(updated) => updateChange(selectedChangeIndex, updated as TAFChange)}
                      onDelete={handleDelete}
                      onChangeType={handleChangeType}
                    />
                  ) : (
                    <ChangeEditor
                      key="base"
                      change={{
                        from: basePeriod.from,
                        to: basePeriod.to,
                        state: { ...baseForEditor, enabledBlocks: { wind: true, vis: true, clouds: true } },
                      }}
                      base={baseForEditor}
                      periodLabel={baseLabel}
                      startHour={timelineStartHour}
                      changes={taf.changes}
                      onUpdate={(updated) => setTaf((previous) => ({
                        ...previous,
                        base: {
                          ...updated.state,
                          clouds: updated.state.clouds?.length ? updated.state.clouds : [createCloudLayer({ amount: "FEW", height: 0 })],
                          enabledBlocks: undefined,
                        },
                      }))}
                    />
                  )}
                </section>
              </div>

              <aside className="workbench-output">
                <section data-tour-id="output" className="glass-panel output-panel" aria-label={text.sections.output.title}>
                  <GeneratedTafOutput
                    lines={lines}
                    station={taf.station}
                    changes={taf.changes}
                    selectedChangeIndex={selectedChangeIndex}
                  />
                </section>
                <TafChecks taf={taf} />
                <TafSummary taf={taf} />
              </aside>
            </div>
          </main>
        </div>
      </div>
    </TourProvider>
  );
}
