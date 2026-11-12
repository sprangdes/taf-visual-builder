import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useId, useMemo } from "react";
import { getSceneLight } from "../utils/sceneLight";
import { mixColor, seededRandom, } from "../utils/weatherScene";
const VIEW_W = 1600;
const VIEW_H = 1010;
/** Layers are refreshed at a low rate: each step repaints the glass panels above them. */
const PRECIPITATION_FPS = 15;
const DRIFT_STEPS = 50;
function SceneSvg({ children, className = "", style, lowRes = false }) {
    const svg = (_jsx("svg", { width: "100%", height: "100%", viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, preserveAspectRatio: "xMidYMid slice", focusable: "false", children: children }));
    return (_jsx("div", { className: `weather-scene-layer ${className}`, style: style, children: lowRes ? _jsx("div", { className: "weather-scene-lowres", children: svg }) : svg }));
}
function bandStops(top, bottom) {
    const fade = 0.1;
    return [
        { offset: Math.max(0, top - fade), color: top <= 0 ? "#fff" : "#000" },
        { offset: top, color: "#fff" },
        { offset: bottom, color: "#fff" },
        { offset: Math.min(1, bottom + fade), color: "#000" },
    ];
}
function cloudFrequency(layer) {
    if (layer.convective)
        return "0.0032 0.006";
    if (layer.height <= 20)
        return "0.0055 0.016";
    if (layer.height <= 60)
        return "0.0042 0.0095";
    return "0.003 0.007";
}
function CloudLayer({ id, index, layer, params, light }) {
    const slope = layer.convective ? 3 : 2.8;
    const offset = -1.55 + layer.cover * 0.85 + (layer.convective ? 0.15 : 0);
    const lighting = mixColor(light.cloudLight, light.stormShade, params.darkness * (layer.convective ? 1 : 0.85));
    const elevation = light.elevation;
    const duration = Math.max(18, 60 - params.windSpeed);
    const style = {
        animationDuration: `${duration}s`,
        animationDirection: params.drift < 0 ? "alternate-reverse" : "alternate",
        animationTimingFunction: `steps(${DRIFT_STEPS})`,
    };
    return (_jsxs(SceneSvg, { className: "weather-scene-drift", style: style, lowRes: true, children: [_jsxs("defs", { children: [_jsx("linearGradient", { id: `${id}-g`, x1: "0", y1: "0", x2: "0", y2: "1", children: bandStops(layer.top, layer.bottom).map((stop, stopIndex) => (_jsx("stop", { offset: stop.offset, stopColor: stop.color }, stopIndex))) }), _jsx("mask", { id: `${id}-m`, children: _jsx("rect", { width: VIEW_W, height: VIEW_H, fill: `url(#${id}-g)` }) }), _jsxs("filter", { id: `${id}-f`, x: "0", y: "0", width: "100%", height: "100%", colorInterpolationFilters: "sRGB", children: [_jsx("feTurbulence", { type: "fractalNoise", baseFrequency: cloudFrequency(layer), numOctaves: layer.convective ? 6 : 5, seed: 17 + index * 12, result: "n" }), _jsx("feColorMatrix", { in: "n", type: "matrix", values: `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${slope} ${offset.toFixed(2)}`, result: "a" }), _jsx("feDiffuseLighting", { in: "a", surfaceScale: layer.convective ? 6 : 4, diffuseConstant: "1.05", lightingColor: lighting, result: "l", children: _jsx("feDistantLight", { azimuth: light.azimuth, elevation: elevation }) }), _jsx("feComposite", { in: "l", in2: "a", operator: "in", result: "c" }), _jsx("feGaussianBlur", { in: "c", stdDeviation: "1.4" })] })] }), _jsx("rect", { width: VIEW_W, height: VIEW_H, filter: `url(#${id}-f)`, mask: `url(#${id}-m)`, opacity: "0.94" })] }));
}
function PrecipitationLayer({ id, depth, params, night }) {
    const precipitation = params.precipitation;
    const near = depth === "near";
    const intensity = precipitation.intensity;
    const kind = precipitation.kind;
    const tile = kind === "snow" ? (near ? 220 : 160) : kind === "drizzle" ? (near ? 200 : 140) : near ? 240 : 160;
    const slant = kind === "snow" ? params.slant * 0.6 : params.slant;
    const marks = useMemo(() => {
        const random = seededRandom((near ? 101 : 202) + intensity * 7 + kind.length);
        const base = kind === "drizzle" ? 30 : kind === "snow" ? 16 : near ? 12 : 16;
        const count = base + intensity * (kind === "snow" ? 8 : 6);
        return Array.from({ length: count }, () => {
            const x = Math.round(random() * tile);
            const y = Math.round(random() * tile);
            const size = random();
            return { x, y, size };
        });
    }, [intensity, kind, near, tile]);
    const radians = (slant * Math.PI) / 180;
    const duration = kind === "snow" ? (near ? 5 : 8) : kind === "drizzle" ? (near ? 0.9 : 1.4) : near ? 0.36 : 0.7;
    const fallStyle = {
        "--fall-x": `${(Math.sin(radians) * tile).toFixed(1)}px`,
        "--fall-y": `${(Math.cos(radians) * tile).toFixed(1)}px`,
        "--fall-duration": `${duration}s`,
        "--fall-steps": Math.max(2, Math.round(duration * PRECIPITATION_FPS)),
    };
    let shapes;
    if (kind === "snow") {
        const opacity = near ? 0.75 : 0.5;
        shapes = (_jsx("g", { fill: `rgba(240,245,255,${opacity})`, children: marks.map((mark, index) => (_jsx("circle", { cx: mark.x, cy: mark.y, r: (near ? 1.6 : 0.8) + mark.size * (near ? 1.4 : 0.8) }, index))) }));
    }
    else {
        const drizzle = kind === "drizzle";
        const minLength = drizzle ? (near ? 6 : 4) : near ? 34 : 14;
        const extraLength = drizzle ? (near ? 6 : 4) : near ? 26 : 10;
        const opacity = drizzle ? (near ? 0.28 : 0.18) : (near ? 0.3 : 0.2) + intensity * (near ? 0.08 : 0.05);
        shapes = (_jsx("g", { stroke: `rgba(205,215,238,${opacity.toFixed(2)})`, strokeWidth: near ? 1.3 : 0.9, strokeLinecap: "round", children: marks.map((mark, index) => (_jsx("line", { x1: mark.x, y1: mark.y, x2: mark.x, y2: mark.y + minLength + mark.size * extraLength }, index))) }));
    }
    // The pattern is drawn in CSS pixels on an oversized layer that is moved by exactly one
    // tile per loop. Animating the HTML wrapper keeps the motion on the compositor.
    const margin = tile * 2;
    return (_jsx("div", { className: "weather-scene-precip", style: { inset: -margin, opacity: 1 - night * 0.35, ...fallStyle }, children: _jsxs("svg", { width: "100%", height: "100%", focusable: "false", children: [_jsx("defs", { children: _jsx("pattern", { id: `${id}-p`, width: tile, height: tile, patternUnits: "userSpaceOnUse", patternTransform: `rotate(${-slant})`, children: shapes }) }), _jsx("rect", { width: "100%", height: "100%", fill: `url(#${id}-p)` })] }) }));
}
function FogLayer({ id, fog, night }) {
    const [r, g, b] = [0.62 - night * 0.38, 0.66 - night * 0.38, 0.74 - night * 0.36].map((v) => v.toFixed(2));
    return (_jsxs(SceneSvg, { style: { opacity: Math.min(1, fog * 1.1) }, lowRes: true, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: `${id}-g`, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: Math.max(0, 0.5 - fog * 0.5), stopColor: "#000" }), _jsx("stop", { offset: "0.9", stopColor: "#fff" })] }), _jsx("mask", { id: `${id}-m`, children: _jsx("rect", { width: VIEW_W, height: VIEW_H, fill: `url(#${id}-g)` }) }), _jsxs("filter", { id: `${id}-f`, x: "0", y: "0", width: "100%", height: "100%", colorInterpolationFilters: "sRGB", children: [_jsx("feTurbulence", { type: "fractalNoise", baseFrequency: "0.0016 0.007", numOctaves: "3", seed: "5" }), _jsx("feColorMatrix", { type: "matrix", values: `0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 1.3 -0.3` })] })] }), _jsx("rect", { width: VIEW_W, height: VIEW_H, filter: `url(#${id}-f)`, mask: `url(#${id}-m)` })] }));
}
function LightningBolt({ id }) {
    return (_jsxs(SceneSvg, { className: "weather-scene-bolt", children: [_jsx("defs", { children: _jsxs("filter", { id: `${id}-glow`, x: "-50%", y: "-10%", width: "200%", height: "120%", children: [_jsx("feGaussianBlur", { stdDeviation: "7", result: "b" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "b" }), _jsx("feMergeNode", { in: "b" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] }) }), _jsxs("g", { filter: `url(#${id}-glow)`, fill: "none", stroke: "#f3f0ff", strokeLinejoin: "round", strokeLinecap: "round", children: [_jsx("path", { d: "M1010 330 L996 392 L1018 404 L982 478 L1006 488 L966 586 L988 594 L948 702 L962 708 L934 790", strokeWidth: "2.6" }), _jsx("path", { d: "M1006 488 L1040 548 L1030 558 L1064 622", strokeWidth: "1.4" }), _jsx("path", { d: "M966 586 L938 630 L946 640 L920 690", strokeWidth: "1.1" })] })] }));
}
const STARS = (() => {
    const random = seededRandom(4242);
    return Array.from({ length: 140 }, () => ({
        x: Math.round(random() * VIEW_W),
        y: Math.round(random() * VIEW_H * 0.68),
        r: 0.5 + random() * 1.1,
        o: 0.35 + random() * 0.65,
    }));
})();
function SkyLayer({ uid, params, daylight, light }) {
    const d = params.darkness;
    const maxCover = params.layers.reduce((max, layer) => Math.max(max, layer.cover), 0);
    const clearSky = (1 - maxCover * 0.85) * (1 - d * 0.7);
    const sunY = 0.92 - Math.max(0, daylight.sun) * 0.8;
    const sunColor = mixColor("#fff1d6", "#ffab6e", daylight.twilight);
    const sunOpacity = Math.min(1, Math.max(0, (daylight.sun + 0.2) * 2.5)) * (1 - d * 0.9) * 0.6;
    const horizonColor = daylight.sunX < 0.5 ? "#ffb98a" : "#ff9566";
    const horizonOpacity = daylight.twilight * (1 - d * 0.7) * 0.5;
    const starOpacity = daylight.night * clearSky * (1 - params.fog);
    const moon = daylight.moon;
    const moonOpacity = moon ? Math.min(1, daylight.night * 1.4) * Math.max(0.15, clearSky) : 0;
    const moonX = moon ? moon.x * VIEW_W : 0;
    const moonY = moon ? (0.72 - moon.height * 0.58) * VIEW_H : 0;
    const moonR = 26;
    // Shadow disc offset: 0 = new moon (fully covered), 2r = full moon (uncovered).
    const shadowOffset = moon ? (moon.waxing ? -1 : 1) * moon.illumination * moonR * 2 : 0;
    return (_jsxs(SceneSvg, { children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: `${uid}-sky`, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: light.sky[0] }), _jsx("stop", { offset: "0.6", stopColor: light.sky[1] }), _jsx("stop", { offset: "1", stopColor: light.sky[2] })] }), _jsxs("radialGradient", { id: `${uid}-sun`, cx: daylight.sunX, cy: sunY, r: daylight.twilight > 0.5 ? 0.55 : 0.4, children: [_jsx("stop", { offset: "0", stopColor: sunColor, stopOpacity: "0.9" }), _jsx("stop", { offset: "0.18", stopColor: sunColor, stopOpacity: "0.35" }), _jsx("stop", { offset: "1", stopColor: sunColor, stopOpacity: "0" })] }), _jsxs("linearGradient", { id: `${uid}-horizon`, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0.45", stopColor: horizonColor, stopOpacity: "0" }), _jsx("stop", { offset: "1", stopColor: horizonColor, stopOpacity: "1" })] }), _jsxs("radialGradient", { id: `${uid}-moonglow`, children: [_jsx("stop", { offset: "0", stopColor: "#dfe6ff", stopOpacity: "0.45" }), _jsx("stop", { offset: "1", stopColor: "#dfe6ff", stopOpacity: "0" })] }), moon && (_jsxs("mask", { id: `${uid}-moonmask`, children: [_jsx("circle", { cx: moonX, cy: moonY, r: moonR, fill: "#fff" }), _jsx("circle", { cx: moonX + shadowOffset, cy: moonY, r: moonR, fill: "#000" })] }))] }), _jsx("rect", { width: VIEW_W, height: VIEW_H, fill: `url(#${uid}-sky)` }), horizonOpacity > 0.01 && _jsx("rect", { width: VIEW_W, height: VIEW_H, fill: `url(#${uid}-horizon)`, opacity: horizonOpacity }), starOpacity > 0.02 && (_jsx("g", { fill: "#ffffff", opacity: starOpacity.toFixed(2), children: STARS.map((star, index) => (_jsx("circle", { cx: star.x, cy: star.y, r: star.r, opacity: star.o }, index))) })), sunOpacity > 0.01 && _jsx("rect", { width: VIEW_W, height: VIEW_H, fill: `url(#${uid}-sun)`, opacity: sunOpacity.toFixed(2) }), moon && moonOpacity > 0.02 && (_jsxs("g", { opacity: moonOpacity.toFixed(2), "data-testid": "scene-moon", children: [_jsx("circle", { cx: moonX, cy: moonY, r: moonR * 7, fill: `url(#${uid}-moonglow)`, opacity: 0.4 + moon.illumination * 0.6 }), _jsx("circle", { cx: moonX, cy: moonY, r: moonR, fill: "#2a3150", opacity: "0.35" }), _jsx("circle", { cx: moonX, cy: moonY, r: moonR, fill: "#f3f0e4", mask: `url(#${uid}-moonmask)` })] }))] }));
}
/** Decorative background that renders the weather of the period being edited. */
function WeatherScene({ params, daylight, animated = true }) {
    const uid = `ws${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
    const d = params.darkness;
    const light = getSceneLight(daylight, d);
    return (_jsxs("div", { className: `weather-scene ${animated ? "" : "is-paused"}`, "aria-hidden": "true", "data-testid": "weather-scene", "data-phase": daylight.phase, children: [_jsx(SkyLayer, { uid: uid, params: params, daylight: daylight, light: light }), params.thunder && _jsx("div", { className: "weather-scene-flash" }), params.layers.map((layer, index) => (_jsx(CloudLayer, { id: `${uid}-c${index}`, index: index, layer: layer, params: params, light: light }, index))), params.thunder && _jsx(LightningBolt, { id: `${uid}-bolt` }), params.precipitation && _jsx(PrecipitationLayer, { id: `${uid}-pf`, depth: "far", params: params, night: light.night }), params.fog > 0 && _jsx(FogLayer, { id: `${uid}-fog`, fog: params.fog, night: light.night }), params.haze && _jsx("div", { className: "weather-scene-haze" }), params.precipitation && _jsx(PrecipitationLayer, { id: `${uid}-pn`, depth: "near", params: params, night: light.night }), _jsx("div", { className: "weather-scene-vignette", style: { opacity: Math.min(1, 0.35 + d * 0.45 + light.night * 0.2) } })] }));
}
/** Re-render only when the drawn scene actually changes (not on every forecast edit). */
export default memo(WeatherScene, (previous, next) => previous.animated === next.animated &&
    JSON.stringify(previous.params) === JSON.stringify(next.params) &&
    JSON.stringify(previous.daylight) === JSON.stringify(next.daylight));
