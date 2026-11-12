import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
import { addChange, generateTAFLines } from "./utils/taf";
import { describeBase, describePeriod } from "./utils/tafInsights";
import { getBaseForecastPeriod, getCurrentIssueTimeUTC, getTimelineStartHour } from "./utils/time";
import { formatHour, getChangeRange, indexToHour } from "./utils/timeline";
import { createCloudLayer, emptyWeather, getEffectiveState } from "./utils/weather";
import { getWeatherSceneParams } from "./utils/weatherScene";
import { formatLocalTime, getChangeInstant, getDaylight, getForecastInstant } from "./utils/daylight";
import { useRenderQuality } from "./hooks/useRenderQuality";
import { useInteractionHold } from "./hooks/useInteractionHold";
function createEmptyTaf() {
    return {
        station: "",
        issueTime: getCurrentIssueTimeUTC(),
        base: emptyWeather({ wind: { dir: 0, speed: 0, gust: 0 }, visibility: 10000 }),
        changes: [],
    };
}
function TourLauncher() {
    const tour = useTour();
    return _jsx(TourMenu, { onStart: tour.startTour });
}
function periodCode(change) {
    const from = `${formatHour(Number(change.from))}Z`;
    return change.type === "FM" ? `FM ${from}` : `${change.type} ${from}–${formatHour(Number(change.to))}Z`;
}
const TYPE_ORDER = { TEMPO: 0, BECMG: 1, FM: 2 };
export default function TafBuilder() {
    const { text } = useLanguage();
    const [taf, setTaf] = useState(createEmptyTaf);
    const [selectedChangeIndex, setSelectedChangeIndex] = useState(null);
    const [isDark, setIsDark] = useState(() => {
        if (globalThis.window === undefined)
            return false;
        return globalThis.localStorage.getItem("taf-dark-mode") === "1";
    });
    const [sceneAnimated, setSceneAnimated] = useState(() => {
        if (globalThis.window === undefined)
            return true;
        return globalThis.localStorage.getItem("taf-scene-motion") !== "0";
    });
    const [now, setNow] = useState(() => new Date());
    const tafRef = useRef(taf);
    const outputRef = useRef(null);
    const [outputVisible, setOutputVisible] = useState(false);
    const selectedChangeIndexRef = useRef(selectedChangeIndex);
    const timelineStartHour = getTimelineStartHour(taf.issueTime);
    const basePeriod = getBaseForecastPeriod(taf.issueTime);
    useEffect(() => {
        if (globalThis.window === undefined)
            return;
        globalThis.localStorage.setItem("taf-dark-mode", isDark ? "1" : "0");
        document.body.classList.toggle("taf-dark-page", isDark);
        return () => document.body.classList.remove("taf-dark-page");
    }, [isDark]);
    useEffect(() => {
        if (globalThis.window === undefined)
            return;
        globalThis.localStorage.setItem("taf-scene-motion", sceneAnimated ? "1" : "0");
    }, [sceneAnimated]);
    useEffect(() => {
        // Keep the base forecast's sky in step with the clock.
        const timer = window.setInterval(() => setNow(new Date()), 5 * 60 * 1000);
        return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
        tafRef.current = taf;
    }, [taf]);
    useEffect(() => {
        selectedChangeIndexRef.current = selectedChangeIndex;
    }, [selectedChangeIndex]);
    useEffect(() => {
        const node = outputRef.current;
        if (!node || typeof IntersectionObserver === "undefined")
            return;
        const observer = new IntersectionObserver(([entry]) => setOutputVisible(entry.isIntersecting), { threshold: 0.15 });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    const selectedChange = selectedChangeIndex === null ? null : taf.changes[selectedChangeIndex] ?? null;
    function updateChange(index, updatedChange) {
        setTaf((previous) => {
            const changes = [...previous.changes];
            changes[index] = updatedChange;
            return { ...previous, changes };
        });
    }
    function handleDelete() {
        if (selectedChangeIndex === null)
            return;
        setTaf((previous) => {
            const changes = [...previous.changes];
            changes.splice(selectedChangeIndex, 1);
            return { ...previous, changes };
        });
        setSelectedChangeIndex(null);
    }
    function handleChangeType(type) {
        if (selectedChangeIndex === null)
            return;
        setTaf((previous) => {
            const changes = [...previous.changes];
            const current = changes[selectedChangeIndex];
            const next = { ...current, type };
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
        restore: (snapshot) => {
            setTaf(snapshot.taf);
            setSelectedChangeIndex(snapshot.selectedChangeIndex);
        },
    };
    const baseForEditor = {
        ...taf.base,
        clouds: taf.base.clouds?.length ? taf.base.clouds : [createCloudLayer({ amount: "FEW", height: 0 })],
    };
    const sceneParams = useMemo(() => getWeatherSceneParams(getEffectiveState(taf.base, selectedChange)), [taf.base, selectedChange]);
    // The scene is decorative: let edits paint first and redraw the background when the browser is idle.
    const deferredSceneParams = useDeferredValue(sceneParams);
    // Time of day follows the period being edited (base forecast: now), in the browser's time zone.
    const sceneFrom = selectedChange ? getForecastInstant(taf.issueTime, Number(selectedChange.from), now).getTime() : now.getTime();
    const sceneMid = selectedChange ? getChangeInstant(taf.issueTime, selectedChange, now).getTime() : now.getTime();
    const daylight = useMemo(() => getDaylight(new Date(sceneMid)), [sceneMid]);
    const deferredDaylight = useDeferredValue(daylight);
    const sceneKey = useMemo(() => JSON.stringify([deferredSceneParams, deferredDaylight]), [deferredSceneParams, deferredDaylight]);
    const sceneTime = selectedChange
        ? selectedChange.type === "FM"
            ? `${formatLocalTime(new Date(sceneFrom))}–`
            : `${formatLocalTime(new Date(sceneFrom))}–${formatLocalTime(new Date(2 * sceneMid - sceneFrom))}`
        : formatLocalTime(now);
    const [forceMotion, setForceMotion] = useState(false);
    const quality = useRenderQuality(sceneAnimated && !forceMotion, sceneKey);
    const sceneMoving = sceneAnimated && (quality === "full" || forceMotion);
    const autoPaused = sceneAnimated && !sceneMoving;
    useInteractionHold(sceneMoving);
    const lines = generateTAFLines(taf);
    const currentLine = (lines.find((line) => line.changeIndex === selectedChangeIndex) ?? lines[0]).text;
    const baseLabel = describeBase(taf.issueTime, text.decode);
    const periodTabs = taf.changes
        .map((change, index) => ({ change, index, range: getChangeRange(change, taf.changes, timelineStartHour) }))
        .sort((a, b) => a.range.start - b.range.start || TYPE_ORDER[a.change.type] - TYPE_ORDER[b.change.type]);
    const sceneLabel = selectedChange ? periodCode(selectedChange) : text.sections.base.title;
    return (_jsx(TourProvider, { editor: editor, children: _jsxs("div", { className: `taf-app ${isDark ? "taf-dark" : ""} ${quality === "lite" ? "is-lite" : ""}`, "data-phase": deferredDaylight.phase, children: [_jsx(WeatherScene, { params: deferredSceneParams, daylight: deferredDaylight, animated: sceneMoving }), _jsxs("div", { className: "app-content", children: [_jsx("div", { className: "appbar-wrap", children: _jsxs("header", { className: "workbench-appbar glass-panel", children: [_jsxs("div", { className: "workbench-brand", children: [_jsx("span", { className: "workbench-brand-mark", "aria-hidden": "true", children: "TAF" }), _jsx("h1", { title: text.app.subtitle, children: text.app.title })] }), _jsxs("div", { className: "forecast-context", "data-tour-id": "context", role: "group", "aria-label": text.header.context, children: [_jsxs("label", { className: "context-field", htmlFor: "taf-station", children: [_jsx("span", { children: "ICAO" }), _jsx("input", { id: "taf-station", "aria-label": text.fields.station, value: taf.station, maxLength: 4, autoCapitalize: "characters", spellCheck: false, onChange: (event) => setTaf((previous) => ({ ...previous, station: event.target.value.toUpperCase() })), placeholder: "XXXX" })] }), _jsxs("label", { className: "context-field context-field--time", htmlFor: "taf-issue-time", children: [_jsx("span", { children: text.fields.issueTime.split(" · ")[0] }), _jsx(IssueTimeInput, { id: "taf-issue-time", value: taf.issueTime, onChange: (value) => setTaf((previous) => ({ ...previous, issueTime: value })) })] }), _jsxs("span", { className: "context-chip", children: [_jsx("span", { children: text.header.validity }), _jsxs("strong", { children: [basePeriod.from, "/", basePeriod.to] })] })] }), _jsxs("div", { className: "workbench-actions", children: [_jsxs("div", { className: "scene-control", role: "group", "aria-label": text.header.scene, children: [_jsx("button", { type: "button", "aria-label": sceneMoving ? text.scene.pause : text.scene.play, title: sceneMoving ? text.scene.pause : autoPaused ? text.scene.autoPaused : text.scene.play, className: "scene-control-button", onClick: () => {
                                                            if (sceneMoving) {
                                                                setSceneAnimated(false);
                                                                setForceMotion(false);
                                                            }
                                                            else {
                                                                setSceneAnimated(true);
                                                                if (quality !== "full")
                                                                    setForceMotion(true);
                                                            }
                                                        }, children: sceneMoving ? (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "currentColor", children: [_jsx("rect", { x: "6.5", y: "5", width: "3.5", height: "14", rx: "1" }), _jsx("rect", { x: "14", y: "5", width: "3.5", height: "14", rx: "1" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "currentColor", children: _jsx("path", { d: "M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" }) })) }), _jsxs("span", { className: "scene-control-info", "aria-live": "polite", title: `${text.header.scene}: ${sceneLabel} · ${text.scene.phases[daylight.phase]} ${sceneTime}`, children: [_jsx("strong", { children: sceneLabel }), _jsxs("span", { children: [text.scene.phases[daylight.phase], " ", sceneTime] })] })] }), _jsx("span", { className: "workbench-actions-divider", "aria-hidden": "true" }), _jsx(TourLauncher, {}), _jsx(LanguageMenu, {}), _jsx("button", { type: "button", "aria-label": isDark ? text.theme.light : text.theme.dark, title: isDark ? text.theme.light : text.theme.dark, className: "theme-toggle icon-button", onClick: () => setIsDark((previous) => !previous), children: isDark ? (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round", children: _jsx("path", { d: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" }) })) })] })] }) }), _jsxs("main", { className: "workbench-shell", children: [_jsx("h2", { className: "visually-hidden", children: text.app.pageTitle }), _jsxs("div", { className: "workbench-grid", "data-testid": "workbench-grid", children: [_jsxs("div", { className: "workbench-editor", children: [_jsxs("section", { "data-tour-id": "timeline", className: "glass-panel workbench-panel", "aria-labelledby": "timeline-title", children: [_jsxs("div", { className: "panel-heading", children: [_jsx("h2", { id: "timeline-title", children: text.sections.timeline.title }), _jsx("div", { className: "timeline-legend", "aria-label": text.legend, children: ["TEMPO", "BECMG", "FM"].map((type) => (_jsxs("span", { className: "timeline-legend-item", children: [_jsx("i", { className: `timeline-legend-swatch timeline-legend-${type.toLowerCase()}`, "aria-hidden": "true" }), type] }, type))) })] }), _jsx(Timeline, { changes: taf.changes, base: taf.base, startHour: timelineStartHour, selectedChangeIndex: selectedChangeIndex, onCreate: (type, range) => {
                                                                const result = addChange(taf, type, indexToHour(range.start, timelineStartHour), indexToHour(range.end, timelineStartHour));
                                                                setTaf(result.taf);
                                                                setSelectedChangeIndex(result.index);
                                                            }, onSelectChange: (index) => setSelectedChangeIndex(index), onSelectBase: () => setSelectedChangeIndex(null) })] }), _jsxs("section", { "data-tour-id": selectedChange ? "selected-change" : "base-editor", className: "glass-panel workbench-panel editor-panel", "aria-labelledby": "editor-title", children: [_jsx("h2", { id: "editor-title", className: "visually-hidden", children: selectedChange ? text.sections.selectedChange.title : text.sections.base.title }), _jsxs("nav", { className: "period-tabs", "aria-label": text.editor.periods, children: [_jsx("button", { type: "button", "data-tour-id": "base", className: `period-tab ${selectedChange ? "" : "is-on"}`, "aria-pressed": !selectedChange, onClick: () => setSelectedChangeIndex(null), children: text.sections.base.title }), periodTabs.map(({ change, index }) => (_jsxs("button", { type: "button", className: `period-tab ${selectedChangeIndex === index ? "is-on" : ""}`, "aria-pressed": selectedChangeIndex === index, onClick: () => setSelectedChangeIndex(index), children: [_jsx("i", { className: `timeline-legend-swatch timeline-legend-${change.type.toLowerCase()}`, "aria-hidden": "true" }), _jsx("span", { className: "mono", children: periodCode(change) })] }, index)))] }), selectedChange && selectedChangeIndex !== null ? (_jsx(ChangeEditor, { change: selectedChange, base: taf.base, periodLabel: describePeriod(selectedChange, text.decode), startHour: timelineStartHour, changes: taf.changes, onUpdate: (updated) => updateChange(selectedChangeIndex, updated), onDelete: handleDelete, onChangeType: handleChangeType }, selectedChangeIndex)) : (_jsx(ChangeEditor, { change: {
                                                                from: basePeriod.from,
                                                                to: basePeriod.to,
                                                                state: { ...baseForEditor, enabledBlocks: { wind: true, vis: true, clouds: true } },
                                                            }, base: baseForEditor, periodLabel: baseLabel, startHour: timelineStartHour, changes: taf.changes, onUpdate: (updated) => setTaf((previous) => ({
                                                                ...previous,
                                                                base: {
                                                                    ...updated.state,
                                                                    clouds: updated.state.clouds?.length ? updated.state.clouds : [createCloudLayer({ amount: "FEW", height: 0 })],
                                                                    enabledBlocks: undefined,
                                                                },
                                                            })) }, "base"))] })] }), _jsxs("aside", { className: "workbench-output", children: [_jsx("section", { id: "taf-output", ref: outputRef, "data-tour-id": "output", className: "glass-panel output-panel", "aria-label": text.sections.output.title, children: _jsx(GeneratedTafOutput, { lines: lines, station: taf.station, changes: taf.changes, selectedChangeIndex: selectedChangeIndex }) }), _jsx(TafChecks, { taf: taf }), _jsx(TafSummary, { taf: taf })] })] })] }), _jsxs("button", { type: "button", className: `mobile-output-bar glass-panel ${outputVisible ? "is-hidden" : ""}`, "aria-hidden": outputVisible, tabIndex: outputVisible ? -1 : 0, onClick: () => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), children: [_jsxs("span", { className: "mobile-output-bar-label", children: [_jsx("span", { children: text.sections.output.title }), _jsx("span", { "aria-hidden": "true", children: "\u2193" })] }), _jsx("code", { children: currentLine })] })] })] }) }));
}
