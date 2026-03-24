import { useEffect, useRef, useState } from "react";
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
    const multiHighlightClass = "introjs-multi-highlight";
    const stopCloudObserver = () => {
      if (cloudObserver) {
        cloudObserver.disconnect();
        cloudObserver = null;
      }
    };
    const clearMultiHighlight = () => {
      document.querySelectorAll(`.${multiHighlightClass}`).forEach((node) => {
        node.classList.remove(multiHighlightClass);
      });
    };
    const setMultiHighlightTargets = (selectors: string[]) => {
      clearMultiHighlight();
      selectors.forEach((selector) => {
        const target = document.querySelector(selector);
        if (target instanceof HTMLElement) {
          target.classList.add(multiHighlightClass);
        }
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
        clearMultiHighlight();
        const currentStepIndex = (intro as unknown as { _currentStep?: number })._currentStep ?? 0;
        const currentStep = steps[currentStepIndex] as
          | { multiHighlightTarget?: string; multiHighlightTargets?: string[] }
          | undefined;
        const stepElement =
          currentStep && "element" in currentStep ? (currentStep as { element?: string }).element : undefined;
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
            resolvedTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          }
        }
        intro.refresh();
        const id = (resolvedTarget as HTMLElement | null)?.id ?? "";
        if (currentStep?.multiHighlightTargets) {
          setMultiHighlightTargets(currentStep.multiHighlightTargets);
        } else if (currentStep?.multiHighlightTarget) {
          setMultiHighlightTargets([currentStep.multiHighlightTarget]);
        }
        if (id === "tour-clouds") {
          const cloudRoot = document.querySelector("#tour-clouds");
          if (cloudRoot) {
            cloudObserver = new MutationObserver(() => intro.refresh());
            cloudObserver.observe(cloudRoot, { childList: true, subtree: true, attributes: true });
          }
        }
        setTimeout(() => {
          intro.refresh();
          scrollTooltipIntoViewIfNeeded();
        }, 120);
        setTimeout(() => scrollTooltipIntoViewIfNeeded(), 220);
        setTimeout(() => scrollTooltipIntoViewIfNeeded(), 360);
        setTimeout(() => scrollTooltipIntoViewIfNeeded(), 520);
      })
      .onexit(() => {
        stopCloudObserver();
        clearMultiHighlight();
        setTaf({
          station: "",
          issueTime: getCurrentIssueTimeUTC(),
          base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
          changes: [],
        });
        setSelectedChangeIndex(null);
      })
      .oncomplete(() => {
        stopCloudObserver();
        clearMultiHighlight();
        setTaf({
          station: "",
          issueTime: getCurrentIssueTimeUTC(),
          base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
          changes: [],
        });
        setSelectedChangeIndex(null);
      })
      ;

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await waitForElements(["#tour-selected-change", "#tour-change-header-selected"]);
    intro.start();
    setTimeout(() => intro.refresh(), 0);
  }

  return (
    <div
      className={`taf-app mx-auto max-w-6xl lg:min-w-[1040px] p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5 ${
        isDark ? "taf-dark" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-bold">TAF Visual Builder</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Start guided tour"
            title="Start guided tour"
            className="theme-toggle border rounded-full w-9 h-9 inline-flex items-center justify-center"
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
      </div>

      <section id="tour-header" className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
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

      <section id="tour-base-forecast" className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
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

      <section id="tour-timeline" className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
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
        <section id="tour-selected-change" className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
          <h2 className="font-semibold">Selected Change</h2>
          <div id="tour-selected-change-settings">
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

      <section id="tour-generated-taf" className="taf-panel border border-gray-200 p-3 sm:p-4 rounded-xl">
        <h2 className="font-semibold">Generated TAF</h2>
        <pre className="taf-code whitespace-pre-wrap overflow-x-auto text-xs sm:text-sm p-3 rounded-xl border">
          {generateTAF(taf)}
        </pre>
      </section>
    </div>
  );
}
