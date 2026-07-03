import { useEffect, useRef, useState } from "react";
import ChangeEditor from "./components/ChangeEditor";
import IssueTimeInput from "./components/IssueTimeInput";
import Timeline from "./components/Timeline";
import SectionHeader from "./components/layout/SectionHeader";
import GeneratedTafOutput from "./components/GeneratedTafOutput";
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
    if (globalThis.window === undefined) return false;
    return globalThis.localStorage.getItem("taf-dark-mode") === "1";
  });
  const tafRef = useRef(taf);
  const selectedChangeIndexRef = useRef<number | null>(selectedChangeIndex);
  const timelineStartHour = getTimelineStartHour(taf.issueTime);
  const basePeriod = getBaseForecastPeriod(taf.issueTime);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    globalThis.localStorage.setItem("taf-dark-mode", isDark ? "1" : "0");
    document.body.classList.toggle("taf-dark-page", isDark);
    return () => {
      document.body.classList.remove("taf-dark-page");
    };
  }, [isDark]);

  useEffect(() => {
    tafRef.current = taf;
  }, [taf]);

  useEffect(() => {
    selectedChangeIndexRef.current = selectedChangeIndex;
  }, [selectedChangeIndex]);

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

  async function handleStartTour() {
    const { default: introJs } = await import("intro.js");
    const intro = introJs();
    let cloudObserver: MutationObserver | null = null;
    let refreshTimer: number | null = null;
    const stopCloudObserver = () => {
      if (cloudObserver) {
        cloudObserver.disconnect();
        cloudObserver = null;
      }
    };
    const scheduleRefresh = (delay = 120) => {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
      refreshTimer = window.setTimeout(() => {
        intro.refresh();
        forceShowTooltip();
        scrollTooltipIntoViewIfNeeded();
        refreshTimer = null;
      }, delay);
    };
    const forceShowTooltip = () => {
      const tooltipLayer = document.querySelector(".introjs-tooltipReferenceLayer") as HTMLElement | null;
      const tooltip = document.querySelector(".introjs-tooltip") as HTMLElement | null;
      [tooltipLayer, tooltip].forEach((node) => {
        if (!node) return;
        node.classList.remove("introjs-hidden");
        node.style.visibility = "visible";
        node.style.opacity = "1";
        node.style.display = "block";
      });
    };
    const scrollTooltipIntoViewIfNeeded = () => {
      const layer = document.querySelector(".introjs-tooltipReferenceLayer") as HTMLElement | null;
      const tooltip = document.querySelector(".introjs-tooltip") as HTMLElement | null;
      const target = layer ?? tooltip;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const margin = 8;
      let dx = 0;
      let dy = 0;
      if (rect.left < margin) dx = rect.left - margin;
      if (rect.right > window.innerWidth - margin) dx = rect.right - (window.innerWidth - margin);
      if (rect.top < margin) dy = rect.top - margin;
      if (rect.bottom > window.innerHeight - margin) dy = rect.bottom - (window.innerHeight - margin);
      if (dx !== 0 || dy !== 0) {
        window.scrollBy({ left: dx, top: dy, behavior: "smooth" });
      }
    };
    const waitForVisibleElement = async (selector: string, timeoutMs = 1500) =>
      new Promise<HTMLElement | null>((resolve) => {
        const start = Date.now();
        const check = () => {
          const element = document.querySelector(selector) as HTMLElement | null;
          if (element) {
            const rect = element.getBoundingClientRect();
            const visible =
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth;
            if (visible) {
              resolve(element);
              return;
            }
          }
          if (Date.now() - start >= timeoutMs) {
            resolve(element ?? null);
            return;
          }
          requestAnimationFrame(check);
        };
        check();
      });
    const steps = [
      {
        element: "#tour-header",
        intro: "Start Here: Enter ICAO Code And Issue Time.",
      },
      {
        element: "#tour-base-forecast",
        intro: "Base Forecast: Set Wind, Visibility/Weather, and Cloud Layers.",
      },
      {
        element: "#tour-wind",
        intro: "Wind: Use +/- to Set Direction (10° Steps), Speed, and Gust.",
      },
      {
        element: "#tour-visibility",
        intro: "Visibility/Weather: Adjust Visibility and Add Weather Phenomena.",
      },
      {
        element: "#tour-clouds",
        intro: "Clouds: Choose Amount (FEW/SCT/BKN/OVC) and Height in x100 ft.",
      },
      {
        element: "#tour-timeline",
        intro: "Timeline: Select a Time Range to Create a Change Block.",
      },
      {
        element: "#tour-timeline",
        intro: "Click an Existing Block to Select It.",
      },
      {
        element: "#tour-selected-change",
        intro: "Change Settings: Fine‑Tune Details For The Chosen Time Block.",
      },
      {
        element: "#tour-change-header-selected",
        intro: "Use The Colored Type Button to Switch TEMPO/BECMG/FM.",
      },
      {
        element: "#tour-generated-taf",
        intro: "Generated TAF: The Final Output Updates Live As You Edit.",
      },
    ];
    const defaultIssueTime = getCurrentIssueTimeUTC();
    const defaultTaf: TAF = {
      station: "RCTP",
      issueTime: defaultIssueTime,
      base: emptyWeather({
        wind: { dir: 180, speed: 12, gust: 20 },
        visibility: 8000,
        weather: ["RA"],
        clouds: [{ id: "base-cloud-1", amount: "FEW", height: 20 }],
      }),
      changes: [
        {
          type: "TEMPO",
          from: "2",
          to: "5",
          state: {
            wind: { dir: 200, speed: 15, gust: 25 },
            visibility: 6000,
            weather: ["RA"],
            clouds: [{ id: "chg-cloud-1", amount: "BKN", height: 25 }],
            enabledBlocks: { wind: true, vis: true, clouds: true },
          },
        },
      ],
    };

    setTaf(defaultTaf);
    setSelectedChangeIndex(0);

    const waitForElements = (selectors: string[], timeoutMs = 2000) =>
      new Promise<void>((resolve) => {
        const ready = () => selectors.every((selector) => document.querySelector(selector));
        if (ready()) {
          resolve();
          return;
        }
        const observer = new MutationObserver(() => {
          if (ready()) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, timeoutMs);
      });

    intro
      .setOptions({
        nextLabel: "Next",
        prevLabel: "Back",
        doneLabel: "Done",
        exitOnOverlayClick: true,
        showProgress: true,
        steps,
      })
      .onafterchange(async (targetElement) => {
        stopCloudObserver();
        const currentStepIndex = (intro as unknown as { _currentStep?: number })._currentStep ?? 0;
        const currentStep = steps[currentStepIndex] as { element?: string } | undefined;
        const stepElement =
          currentStep && "element" in currentStep ? (currentStep as { element?: string }).element : undefined;
        if (typeof stepElement === "string") {
          const elementNode = document.querySelector(stepElement);
          const introItems = (intro as unknown as { _introItems?: Array<{ element?: Element }> })._introItems;
          if (elementNode && introItems && introItems[currentStepIndex]) {
            introItems[currentStepIndex].element = elementNode;
          }
        }
        let resolvedTarget =
            (typeof stepElement === "string" ? document.querySelector(stepElement) : null) ??
            (targetElement instanceof HTMLElement ? targetElement : null);
        if (typeof stepElement === "string") {
          const waited = await waitForVisibleElement(stepElement);
          if (waited) {
            resolvedTarget = waited;
          }
        }
        if (resolvedTarget instanceof HTMLElement) {
          const rect = resolvedTarget.getBoundingClientRect();
          const needsScroll =
              rect.top < 0 ||
              rect.left < 0 ||
              rect.bottom > window.innerHeight ||
              rect.right > window.innerWidth;
          if (needsScroll) {
            resolvedTarget.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
          }
        }
        intro.refresh();
        const id = (resolvedTarget as HTMLElement | null)?.id ?? "";
        if (id === "tour-clouds") {
          const cloudRoot = document.querySelector("#tour-clouds");
          if (cloudRoot) {
            cloudObserver = new MutationObserver(() => scheduleRefresh(0));
            cloudObserver.observe(cloudRoot, {childList: true, subtree: true, attributes: true});
          }
        }
        scheduleRefresh(120);
        scheduleRefresh(220);
        scheduleRefresh(360);
        scheduleRefresh(520);
        if (currentStepIndex === 1) {
          setTimeout(() => {
            intro.refresh();
            forceShowTooltip();
          }, 50);
          setTimeout(() => {
            intro.refresh();
            forceShowTooltip();
          }, 180);
          setTimeout(() => {
            intro.refresh();
            forceShowTooltip();
          }, 320);
        }
      })
      .onexit(() => {
        if (refreshTimer !== null) {
          window.clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        stopCloudObserver();
        setTaf({
          station: "",
          issueTime: getCurrentIssueTimeUTC(),
          base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
          changes: [],
        });
        setSelectedChangeIndex(null);
      })
      .oncomplete(() => {
        if (refreshTimer !== null) {
          window.clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        stopCloudObserver();
        setTaf({
          station: "",
          issueTime: getCurrentIssueTimeUTC(),
          base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
          changes: [],
        });
        setSelectedChangeIndex(null);
      });

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await waitForElements(["#tour-header", "#tour-base-forecast"]);
    intro.start();
    scheduleRefresh(0);
  }

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
          <button
            type="button"
            aria-label="Start guided tour"
            title="Start guided tour"
            className="theme-toggle icon-button"
            onClick={handleStartTour}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
              <path d="M12 3a9 9 0 1 0 6.36 15.36l2.14 2.14a1 1 0 0 0 1.41-1.41l-2.14-2.14A9 9 0 0 0 12 3Zm0 2a7 7 0 1 1 0 14a7 7 0 0 1 0-14Zm0 3a1 1 0 0 0 0 2a2 2 0 0 1 2 2a1 1 0 1 0 2 0a4 4 0 0 0-4-4Zm-1 6a1 1 0 1 0 2 0v-1a1 1 0 1 0-2 0v1Z" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="theme-toggle icon-button"
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
      </header>

      <main className="workbench-shell">
        <div className="workbench-page-heading">
          <h2>Create Terminal Aerodrome Forecast</h2>
        </div>
        <div className="workbench-grid" data-testid="workbench-grid">
          <div className="workbench-editor">
            <section id="tour-header" className="taf-panel workbench-panel">
              <SectionHeader step="01" title="Forecast context" description="Identify the aerodrome and forecast issue time." />
              <div className="workbench-panel-body forecast-context-fields">
                <label className="workbench-field" htmlFor="taf-station">
                  <span>ICAO station code</span>
                  <input id="taf-station" value={taf.station} onChange={(e) => setTaf((prev) => ({ ...prev, station: e.target.value }))} placeholder="ICAO Code" />
                </label>
                <label className="workbench-field" htmlFor="taf-issue-time">
                  <span>Issue time · DDHHMM</span>
                  <IssueTimeInput id="taf-issue-time" value={taf.issueTime} onChange={(val) => setTaf((prev) => ({ ...prev, issueTime: val }))} />
                </label>
              </div>
            </section>

            <section id="tour-base-forecast" className="taf-panel workbench-panel">
              <SectionHeader step="02" title="Base forecast" description="Set prevailing conditions for the full validity period." aside={<span className="technical-time">{String(basePeriod.from).padStart(2, "0")}Z → {String(basePeriod.to).padStart(2, "0")}Z</span>} />
              <div className="workbench-panel-body">
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
              </div>
            </section>

            <section id="tour-timeline" className="taf-panel workbench-panel">
              <SectionHeader step="03" title="Forecast timeline" description="Select a start and end hour to create a change block." aside={changeLegend} />
              <div className="workbench-panel-body">
              <Timeline
          changes={taf.changes}
          startHour={timelineStartHour}
          isDark={isDark}
          onSelectRange={handleSelectRange}
          onSelectChange={(index) => {
            setSelectedChangeIndex((prev) => (prev === index ? null : index));
          }}
              />
              </div>
            </section>

            {selectedChangeIndex !== null && (
              <section id="tour-selected-change" className="taf-panel workbench-panel">
                <SectionHeader step="04" title="Selected change" description="Fine-tune the conditions that change in this period." />
                <div id="tour-selected-change-settings" className="workbench-panel-body">
                  <ChangeEditor
              key={selectedChangeIndex}
              change={taf.changes[selectedChangeIndex]}
              onUpdate={(updated) => updateChange(selectedChangeIndex, updated as TAFChange)}
              showActionButtons
              onDelete={handleDelete}
              onChangeType={handleChangeType}
              headerId="tour-change-header-selected"
                  />
                </div>
              </section>
            )}
          </div>

          <section id="tour-generated-taf" className="taf-panel workbench-panel workbench-output">
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
  );
}
