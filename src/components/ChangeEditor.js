import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { visibilityOptions } from "../constants/weather";
import { toBoundedNonNegativeInt, toWindDirection } from "../utils/number";
import { TIMELINE_HOURS, formatHour, getChangeRange, getTimelineHours, indexToHour, rangesOverlap, } from "../utils/timeline";
import { createCloudLayer, emptyWeather, formatClouds, formatVisibility, getWeatherGroups, } from "../utils/weather";
import CloudSection from "./CloudSection";
import VisibilitySection from "./VisibilitySection";
import WindSection from "./WindSection";
import { useLanguage } from "../features/i18n/LanguageContext";
const TYPES = ["TEMPO", "BECMG", "FM"];
function nearestVisibility(val) {
    return visibilityOptions.reduce((prev, curr) => (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev), visibilityOptions[0]);
}
export default function ChangeEditor({ change, base, periodLabel, startHour, changes, onUpdate, onDelete, onChangeType, }) {
    const { text } = useLanguage();
    const isBase = !("type" in change);
    const enabledBlocks = change.state.enabledBlocks ?? {};
    const windEnabled = isBase || Boolean(enabledBlocks.wind);
    const visEnabled = isBase || Boolean(enabledBlocks.vis);
    const cloudEnabled = isBase || Boolean(enabledBlocks.clouds);
    const state = emptyWeather(change.state);
    const clouds = state.clouds.length > 0 ? state.clouds : [createCloudLayer({ amount: "FEW", height: 0 })];
    const weatherArr = state.weather || [];
    const updateChangeState = (patch) => {
        onUpdate({ ...change, state: { ...change.state, ...patch } });
    };
    const setBlockEnabled = (block, enabled) => {
        updateChangeState({ enabledBlocks: { ...enabledBlocks, [block]: enabled } });
    };
    const currentClouds = () => change.state.clouds && change.state.clouds.length > 0
        ? change.state.clouds.map((c) => (c.id ? c : createCloudLayer(c)))
        : [createCloudLayer({ amount: "FEW", height: 0 })];
    const updateWind = (field, value) => {
        const nextWind = { ...(change.state.wind || { dir: 0, speed: 0, gust: null }) };
        if (field === "dir")
            nextWind.dir = toWindDirection(value);
        if (field === "speed")
            nextWind.speed = toBoundedNonNegativeInt(value, 99);
        if (field === "gust")
            nextWind.gust = value === "" ? null : toBoundedNonNegativeInt(value, 99);
        updateChangeState({ wind: nextWind });
    };
    const updateCloud = (id, field, value) => {
        const nextClouds = currentClouds().map((c) => {
            if (c.id !== id)
                return c;
            const target = { ...c };
            if (field === "amount")
                target.amount = String(value);
            if (field === "height")
                target.height = toBoundedNonNegativeInt(value, 999);
            if (field === "cb") {
                target.cb = Boolean(value);
                if (target.cb)
                    target.tcu = false;
            }
            if (field === "tcu") {
                target.tcu = Boolean(value);
                if (target.tcu)
                    target.cb = false;
            }
            return target;
        });
        updateChangeState({ clouds: nextClouds });
    };
    const addCloud = () => updateChangeState({ clouds: [...currentClouds(), createCloudLayer({ amount: "FEW", height: 0 })] });
    const removeCloud = (id) => {
        const prev = currentClouds();
        if (prev.length <= 1)
            return;
        updateChangeState({ clouds: prev.filter((c) => c.id !== id) });
    };
    const hours = getTimelineHours(startHour);
    const trend = isBase ? null : change;
    const range = trend ? getChangeRange(trend, changes, startHour) : null;
    const typeConflicts = (type) => {
        if (!trend || !range)
            return false;
        const candidate = type === "FM" || trend.type === "FM" ? { start: range.start, end: range.start + 1 } : range;
        return changes.some((other) => other !== trend && other.type === type && rangesOverlap(getChangeRange(other, changes, startHour), candidate));
    };
    const setRange = (start, end) => {
        if (!trend)
            return;
        const safeEnd = Math.min(TIMELINE_HOURS, Math.max(end, start + 1));
        onUpdate({ ...trend, from: String(indexToHour(start, startHour)), to: String(indexToHour(safeEnd, startHour)) });
    };
    const baseVisCode = [formatVisibility(base.visibility), ...getWeatherGroups(base.weather || [])].join(" ");
    return (_jsxs("div", { className: "period-editor", children: [_jsxs("div", { className: "period-editor-header", children: [trend && range ? (_jsxs("div", { className: "period-controls", children: [_jsx("div", { className: "segmented", role: "group", "aria-label": text.actions.changeType, "data-tour-id": "change-type", children: TYPES.map((type) => (_jsx("button", { type: "button", "aria-pressed": trend.type === type, disabled: trend.type !== type && typeConflicts(type), title: trend.type !== type && typeConflicts(type) ? text.editor.typeConflict(type) : undefined, className: `type-option type-option--${type.toLowerCase()} ${trend.type === type ? "is-on" : ""}`, onClick: () => onChangeType?.(type), children: type }, type))) }), _jsxs("div", { className: "period-range", children: [_jsxs("label", { className: "time-select", children: [_jsx("span", { className: "visually-hidden", children: text.editor.from }), _jsx("select", { value: range.start, onChange: (e) => setRange(Number(e.target.value), range.end), children: hours.map((hour, index) => (_jsxs("option", { value: index, children: [formatHour(hour), "Z"] }, hour))) })] }), _jsx("span", { "aria-hidden": "true", children: "\u2192" }), trend.type === "FM" ? (_jsx("span", { className: "period-range-end", children: text.timeline.untilEnd })) : (_jsxs("label", { className: "time-select", children: [_jsx("span", { className: "visually-hidden", children: text.editor.to }), _jsx("select", { value: range.end, onChange: (e) => setRange(range.start, Number(e.target.value)), children: hours.map((_, index) => {
                                                    const boundary = index + 1;
                                                    return (_jsxs("option", { value: boundary, disabled: boundary <= range.start, children: [formatHour(startHour + boundary), "Z"] }, boundary));
                                                }) })] }))] }), _jsx("p", { className: "period-note", children: text.editor.note })] })) : (_jsxs("div", { className: "period-controls", children: [_jsx("span", { className: "period-badge", children: "BASE" }), _jsx("span", { className: "period-range-text", children: periodLabel })] })), onDelete && (_jsxs("button", { type: "button", className: "change-delete-button", onClick: onDelete, children: [_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" }) }), text.actions.deleteChange] }))] }), _jsxs("div", { className: "condition-grid", children: [_jsx(WindSection, { isBase: isBase, windEnabled: windEnabled, wind: state.wind, baseWind: base.wind, onSetEnabled: (enabled) => setBlockEnabled("wind", enabled), onUpdateWind: updateWind }), _jsx(VisibilitySection, { isBase: isBase, visEnabled: visEnabled, visibility: state.visibility, weatherArr: weatherArr, baseCode: baseVisCode, showError: state.visibility <= 5000 && weatherArr.length === 0, minVis: 50, maxVis: 10000, onSetEnabled: (enabled) => setBlockEnabled("vis", enabled), onUpdateVisibility: (value) => updateChangeState({ visibility: nearestVisibility(Number(value)) }), onAddWeather: (w) => updateChangeState({ weather: [...(change.state.weather || []), w] }), onRemoveWeather: (idx) => {
                            const arr = [...(change.state.weather || [])];
                            arr.splice(idx, 1);
                            updateChangeState({ weather: arr });
                        } }), _jsx(CloudSection, { isBase: isBase, cloudEnabled: cloudEnabled, clouds: clouds, baseCode: formatClouds(base.clouds || []), onSetEnabled: (enabled) => setBlockEnabled("clouds", enabled), onUpdateCloud: updateCloud, onAddCloud: addCloud, onRemoveCloud: removeCloud })] })] }));
}
