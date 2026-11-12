import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cloudAmountOptions } from "../constants/weather";
import { formatClouds } from "../utils/weather";
import ConditionCard from "./ConditionCard";
import NumericControl from "./inputs/NumericControl";
import { useLanguage } from "../features/i18n/LanguageContext";
const cloudHeightPickerOptions = Array.from({ length: 1000 }, (_, value) => ({
    value,
    label: String(value).padStart(3, "0"),
}));
export default function CloudSection({ isBase, cloudEnabled, clouds, baseCode, onSetEnabled, onUpdateCloud, onAddCloud, onRemoveCloud, }) {
    const { text } = useLanguage();
    return (_jsxs(ConditionCard, { tourId: "clouds", className: "cloud-card", title: text.conditions.clouds, isBase: isBase, enabled: cloudEnabled, onSetEnabled: onSetEnabled, output: formatClouds(clouds), inherited: baseCode, children: [_jsx("div", { className: "cloud-layers", children: clouds.map((c) => (_jsxs("div", { className: "cloud-layer-row", children: [_jsx("div", { className: "segmented segmented--small", role: "group", "aria-label": text.editor.cloudAmount, children: cloudAmountOptions.map((amount) => (_jsx("button", { type: "button", "aria-pressed": c.amount === amount, className: c.amount === amount ? "is-on" : "", onClick: () => onUpdateCloud(c.id, "amount", amount), children: amount }, amount))) }), _jsxs("span", { className: "cloud-measurement-group", "aria-label": text.editor.cloudHeight, children: [_jsx(NumericControl, { value: c.height, min: 0, max: 999, step: 1, mobileEditor: "select", mobileOptions: cloudHeightPickerOptions, formatValue: (v) => String(v).padStart(3, "0"), onChange: (value) => onUpdateCloud(c.id, "height", value) }), _jsx("span", { className: "field-unit", children: text.conditions.hundredsFeet })] }), _jsxs("span", { className: "cloud-type-group", children: [_jsx("button", { type: "button", className: `chip ${c.cb ? "is-on" : ""}`, "aria-pressed": !!c.cb, onClick: () => onUpdateCloud(c.id, "cb", !c.cb), children: "CB" }), _jsx("button", { type: "button", className: `chip ${c.tcu ? "is-on" : ""}`, "aria-pressed": !!c.tcu, onClick: () => onUpdateCloud(c.id, "tcu", !c.tcu), children: "TCU" })] }), clouds.length > 1 && (_jsx("button", { type: "button", "aria-label": text.actions.deleteCloud, title: text.actions.deleteLayer, onClick: () => onRemoveCloud(c.id), className: "cloud-delete-button", children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M6 6l12 12M18 6L6 18" }) }) }))] }, c.id))) }), _jsx("button", { type: "button", onClick: onAddCloud, className: "cloud-add-button", children: text.conditions.addLayer })] }));
}
