import { useId, useMemo, type CSSProperties } from "react";
import type { WeatherState } from "../types/taf";
import {
  getWeatherSceneParams,
  mixColor,
  seededRandom,
  type SceneCloudLayer,
  type WeatherSceneParams,
} from "../utils/weatherScene";

const VIEW_W = 1600;
const VIEW_H = 1010;

interface SceneSvgProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

function SceneSvg({ children, className = "", style }: Readonly<SceneSvgProps>) {
  return (
    <div className={`weather-scene-layer ${className}`} style={style}>
      <svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice" focusable="false">
        {children}
      </svg>
    </div>
  );
}

function bandStops(top: number, bottom: number) {
  const fade = 0.1;
  return [
    { offset: Math.max(0, top - fade), color: top <= 0 ? "#fff" : "#000" },
    { offset: top, color: "#fff" },
    { offset: bottom, color: "#fff" },
    { offset: Math.min(1, bottom + fade), color: "#000" },
  ];
}

function cloudFrequency(layer: SceneCloudLayer): string {
  if (layer.convective) return "0.0032 0.006";
  if (layer.height <= 20) return "0.0055 0.016";
  if (layer.height <= 60) return "0.0042 0.0095";
  return "0.003 0.007";
}

interface CloudLayerProps {
  id: string;
  index: number;
  layer: SceneCloudLayer;
  params: WeatherSceneParams;
}

function CloudLayer({ id, index, layer, params }: Readonly<CloudLayerProps>) {
  const slope = layer.convective ? 3 : 2.8;
  const offset = -1.55 + layer.cover * 0.85 + (layer.convective ? 0.15 : 0);
  const lighting = mixColor("#ffffff", "#596075", params.darkness * (layer.convective ? 1 : 0.85));
  const elevation = Math.round(56 - params.darkness * 26);
  const duration = Math.max(18, 60 - params.windSpeed);
  const style = {
    animationDuration: `${duration}s`,
    animationDirection: params.drift < 0 ? "alternate-reverse" : "alternate",
  } as CSSProperties;

  return (
    <SceneSvg className="weather-scene-drift" style={style}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          {bandStops(layer.top, layer.bottom).map((stop, stopIndex) => (
            <stop key={stopIndex} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width={VIEW_W} height={VIEW_H} fill={`url(#${id}-g)`} />
        </mask>
        <filter id={`${id}-f`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={cloudFrequency(layer)} numOctaves={layer.convective ? 6 : 5} seed={17 + index * 12} result="n" />
          <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${slope} ${offset.toFixed(2)}`} result="a" />
          <feDiffuseLighting in="a" surfaceScale={layer.convective ? 6 : 4} diffuseConstant="1.05" lightingColor={lighting} result="l">
            <feDistantLight azimuth="235" elevation={elevation} />
          </feDiffuseLighting>
          <feComposite in="l" in2="a" operator="in" result="c" />
          <feGaussianBlur in="c" stdDeviation="1.4" />
        </filter>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} filter={`url(#${id}-f)`} mask={`url(#${id}-m)`} opacity="0.94" />
    </SceneSvg>
  );
}

interface PrecipitationLayerProps {
  id: string;
  depth: "near" | "far";
  params: WeatherSceneParams;
}

function PrecipitationLayer({ id, depth, params }: Readonly<PrecipitationLayerProps>) {
  const precipitation = params.precipitation!;
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
  } as CSSProperties;

  let shapes: React.ReactNode;
  if (kind === "snow") {
    const opacity = near ? 0.75 : 0.5;
    shapes = (
      <g fill={`rgba(240,245,255,${opacity})`}>
        {marks.map((mark, index) => (
          <circle key={index} cx={mark.x} cy={mark.y} r={(near ? 1.6 : 0.8) + mark.size * (near ? 1.4 : 0.8)} />
        ))}
      </g>
    );
  } else {
    const drizzle = kind === "drizzle";
    const minLength = drizzle ? (near ? 6 : 4) : near ? 34 : 14;
    const extraLength = drizzle ? (near ? 6 : 4) : near ? 26 : 10;
    const opacity = drizzle ? (near ? 0.28 : 0.18) : (near ? 0.3 : 0.2) + intensity * (near ? 0.08 : 0.05);
    shapes = (
      <g stroke={`rgba(205,215,238,${opacity.toFixed(2)})`} strokeWidth={near ? 1.3 : 0.9} strokeLinecap="round">
        {marks.map((mark, index) => (
          <line key={index} x1={mark.x} y1={mark.y} x2={mark.x} y2={mark.y + minLength + mark.size * extraLength} />
        ))}
      </g>
    );
  }

  return (
    <SceneSvg>
      <defs>
        <pattern id={`${id}-p`} width={tile} height={tile} patternUnits="userSpaceOnUse" patternTransform={`rotate(${-slant})`}>
          {shapes}
        </pattern>
      </defs>
      <g className="weather-scene-fall" style={fallStyle}>
        <rect x={-600} y={-600} width={VIEW_W + 1200} height={VIEW_H + 1200} fill={`url(#${id}-p)`} />
      </g>
    </SceneSvg>
  );
}

function FogLayer({ id, fog }: Readonly<{ id: string; fog: number }>) {
  return (
    <SceneSvg style={{ opacity: Math.min(1, fog * 1.1) }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset={Math.max(0, 0.5 - fog * 0.5)} stopColor="#000" />
          <stop offset="0.9" stopColor="#fff" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width={VIEW_W} height={VIEW_H} fill={`url(#${id}-g)`} />
        </mask>
        <filter id={`${id}-f`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.007" numOctaves="3" seed="5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.66  0 0 0 0 0.74  0 0 0 1.3 -0.3" />
        </filter>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} filter={`url(#${id}-f)`} mask={`url(#${id}-m)`} />
    </SceneSvg>
  );
}

function LightningBolt({ id }: Readonly<{ id: string }>) {
  return (
    <SceneSvg className="weather-scene-bolt">
      <defs>
        <filter id={`${id}-glow`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`} fill="none" stroke="#f3f0ff" strokeLinejoin="round" strokeLinecap="round">
        <path d="M1010 330 L996 392 L1018 404 L982 478 L1006 488 L966 586 L988 594 L948 702 L962 708 L934 790" strokeWidth="2.6" />
        <path d="M1006 488 L1040 548 L1030 558 L1064 622" strokeWidth="1.4" />
        <path d="M966 586 L938 630 L946 640 L920 690" strokeWidth="1.1" />
      </g>
    </SceneSvg>
  );
}

interface WeatherSceneProps {
  state: WeatherState;
}

/** Decorative background that renders the weather of the period being edited. */
export default function WeatherScene({ state }: Readonly<WeatherSceneProps>) {
  const params = useMemo(() => getWeatherSceneParams(state), [state]);
  const uid = `ws${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const d = params.darkness;
  const sky = [
    mixColor("#173871", "#0c111b", d),
    mixColor("#2a5895", "#1a2131", d),
    mixColor("#4777b0", "#2b3242", d),
  ];

  return (
    <div className="weather-scene" aria-hidden="true" data-testid="weather-scene">
      <SceneSvg>
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky[0]} />
            <stop offset="0.6" stopColor={sky[1]} />
            <stop offset="1" stopColor={sky[2]} />
          </linearGradient>
          <radialGradient id={`${uid}-sun`} cx="0.14" cy="0.04" r="0.5">
            <stop offset="0" stopColor="rgb(255,236,204)" stopOpacity="0.45" />
            <stop offset="1" stopColor="rgb(255,236,204)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill={`url(#${uid}-sky)`} />
        <rect width={VIEW_W} height={VIEW_H} fill={`url(#${uid}-sun)`} opacity={Math.max(0, 1 - d * 1.4)} />
      </SceneSvg>

      {params.thunder && <div className="weather-scene-flash" />}

      {params.layers.map((layer, index) => (
        <CloudLayer key={index} id={`${uid}-c${index}`} index={index} layer={layer} params={params} />
      ))}

      {params.thunder && <LightningBolt id={`${uid}-bolt`} />}
      {params.precipitation && <PrecipitationLayer id={`${uid}-pf`} depth="far" params={params} />}
      {params.fog > 0 && <FogLayer id={`${uid}-fog`} fog={params.fog} />}
      {params.haze && <div className="weather-scene-haze" />}
      {params.precipitation && <PrecipitationLayer id={`${uid}-pn`} depth="near" params={params} />}
      <div className="weather-scene-vignette" style={{ opacity: 0.35 + d * 0.45 }} />
    </div>
  );
}
