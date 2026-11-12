import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useLanguage } from "../features/i18n/LanguageContext";
import { formatWind } from "../utils/weather";
import ConditionCard from "./ConditionCard";
import NumericControl from "./inputs/NumericControl";
const windDirectionOptions = Array.from({ length: 37 }, (_, index) => ({
    value: index * 10,
    label: String(index * 10),
}));
const twoDigitWindOptions = Array.from({ length: 100 }, (_, value) => ({
    value,
    label: String(value).padStart(2, "0"),
}));
function WindCompass({ wind, calmLabel }) {
    const calm = wind.speed === 0;
    const angle = ((wind.dir % 360) * Math.PI) / 180;
    const fromX = 60 + Math.sin(angle) * 46;
    const fromY = 60 - Math.cos(angle) * 46;
    const toX = 60 - Math.sin(angle) * 34;
    const toY = 60 + Math.cos(angle) * 34;
    const headAngle = Math.atan2(toY - fromY, toX - fromX);
    const head = [
        [toX, toY],
        [toX - 11 * Math.cos(headAngle - 0.45), toY - 11 * Math.sin(headAngle - 0.45)],
        [toX - 11 * Math.cos(headAngle + 0.45), toY - 11 * Math.sin(headAngle + 0.45)],
    ]
        .map((point) => point.map((value) => value.toFixed(1)).join(","))
        .join(" ");
    return (_jsxs("svg", { className: "wind-compass", viewBox: "0 0 120 120", role: "img", "aria-label": calm ? calmLabel : `${wind.dir}°`, children: [_jsx("circle", { cx: "60", cy: "60", r: "50", className: "wind-compass-ring" }), _jsx("circle", { cx: "60", cy: "60", r: "34", className: "wind-compass-inner" }), _jsx("text", { x: "60", y: "21", textAnchor: "middle", children: "N" }), _jsx("text", { x: "103", y: "64", textAnchor: "middle", children: "E" }), _jsx("text", { x: "60", y: "107", textAnchor: "middle", children: "S" }), _jsx("text", { x: "17", y: "64", textAnchor: "middle", children: "W" }), calm ? (_jsx("circle", { cx: "60", cy: "60", r: "6", className: "wind-compass-calm" })) : (_jsxs(_Fragment, { children: [_jsx("line", { x1: fromX, y1: fromY, x2: toX, y2: toY, className: "wind-compass-arrow" }), _jsx("polygon", { points: head, className: "wind-compass-head" }), _jsx("circle", { cx: fromX, cy: fromY, r: "5", className: "wind-compass-origin" })] }))] }));
}
export default function WindSection({ isBase, windEnabled, wind, baseWind, onSetEnabled, onUpdateWind, }) {
    const { text } = useLanguage();
    const rows = [
        { field: "dir", label: text.conditions.windDirection, value: wind.dir, max: 360, step: 10, unit: "°", options: windDirectionOptions, format: undefined },
        { field: "speed", label: text.conditions.windSpeed, value: wind.speed, max: 99, step: 1, unit: "KT", options: twoDigitWindOptions, format: (v) => String(v).padStart(2, "0") },
        { field: "gust", label: text.conditions.windGust, value: wind.gust ?? 0, max: 99, step: 1, unit: "KT", options: twoDigitWindOptions, format: (v) => String(v).padStart(2, "0") },
    ];
    return (_jsx(ConditionCard, { tourId: "wind", className: "wind-card", title: text.conditions.wind, isBase: isBase, enabled: windEnabled, onSetEnabled: onSetEnabled, output: formatWind(wind), inherited: formatWind(baseWind), children: _jsxs("div", { className: "wind-layout", children: [_jsx(WindCompass, { wind: wind, calmLabel: text.editor.calm }), _jsx("div", { className: "wind-fields", children: rows.map((row) => (_jsxs("div", { className: "wind-field", children: [_jsx("span", { className: "field-label", children: row.label }), _jsxs("span", { className: "wind-control-group", children: [_jsx(NumericControl, { value: row.value, min: 0, max: row.max, step: row.step, mobileEditor: "select", mobileOptions: row.options, formatValue: row.format, onChange: (value) => onUpdateWind(row.field, value) }), _jsx("span", { className: "field-unit", children: row.unit })] })] }, row.field))) })] }) }));
}
