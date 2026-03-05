import { useState } from "react";
import type { TAFChange, TimelineProps } from "../types/taf";
import { timelineColorByType } from "../constants/weather";
import { useTimeRange } from "../hooks/useTimeRange";

function createHourIndexMap(hours: number[]): Map<number, number> {
  const hourIndexMap = new Map<number, number>();
  hours.forEach((h, idx) => hourIndexMap.set(h, idx));
  return hourIndexMap;
}

function isBetweenCircular(target: number, start: number, end: number, hourIndexMap: Map<number, number>): boolean {
  const t = hourIndexMap.get(target);
  const s = hourIndexMap.get(start);
  const e = hourIndexMap.get(end);

  if (t === undefined || s === undefined || e === undefined) return false;
  if (s <= e) return t >= s && t <= e;
  return t >= s || t <= e;
}

function getChangeAtHour(changes: TAFChange[], h: number, hourIndexMap: Map<number, number>): number {
  return (changes || []).findIndex((c) => isBetweenCircular(h, Number(c.from), Number(c.to), hourIndexMap));
}

function getChangeObjAtHour(changes: TAFChange[], h: number, hourIndexMap: Map<number, number>): TAFChange | null {
  return (
    (changes || []).find((c) => isBetweenCircular(h, Number(c.from), Number(c.to), hourIndexMap)) ||
    null
  );
}

export default function Timeline({
  changes,
  onSelectRange,
  onSelectChange,
  startHour,
  isDark = false,
}: Readonly<TimelineProps>) {
  const hours = Array.from({ length: 24 }, (_, i) => (startHour + i) % 24);
  const hourIndexMap = createHourIndexMap(hours);
  const { pendingRange, selectHour, hoverHour, setHover, reset } = useTimeRange();
  const [hoveredChangeIndex, setHoveredChangeIndex] = useState<number | null>(null);
  const [hoveredFreeHour, setHoveredFreeHour] = useState<number | null>(null);
  const timelineBaseColorByType = isDark
    ? {
        TEMPO: "bg-yellow-700",
        BECMG: "bg-green-700",
        FM: "bg-orange-700",
      }
    : timelineColorByType;
  const timelineHoverColorByType = isDark
    ? {
        TEMPO: "bg-yellow-800",
        BECMG: "bg-green-800",
        FM: "bg-orange-800",
      }
    : {
        TEMPO: "bg-yellow-400",
        BECMG: "bg-green-400",
        FM: "bg-orange-400",
      };
  const neutralHoverClass = isDark ? "bg-slate-600" : "bg-gray-200";
  const neutralBaseClass = isDark ? "bg-slate-800 text-gray-100" : "bg-white";
  const separatorClass = isDark
    ? "bg-slate-500/90 shadow-[1px_0_0_0_rgba(15,23,42,0.9)]"
    : "bg-white/90 shadow-[1px_0_0_0_rgba(31,41,55,0.35)]";

  const isInHoverSelection = (h: number): boolean => {
    if (pendingRange !== null && hoverHour !== null) {
      return isBetweenCircular(h, pendingRange, hoverHour, hourIndexMap);
    }
    return false;
  };

  return (
    <div
      className="overflow-x-auto lg:overflow-x-visible touch-pan-x"
      onPointerLeave={() => {
        setHoveredChangeIndex(null);
        setHoveredFreeHour(null);
        if (pendingRange !== null) setHover(null);
      }}
    >
      <div
        className={`inline-flex min-w-max lg:flex lg:min-w-0 lg:w-full border rounded-xl overflow-hidden select-none ${
          isDark ? "border-slate-500" : ""
        }`}
      >
        {hours.map((h, idx) => {
          const changeIndex = getChangeAtHour(changes, h, hourIndexMap);
          const changeObj = getChangeObjAtHour(changes, h, hourIndexMap);
          let bgClass = neutralBaseClass;

          if (pendingRange !== null && hoverHour !== null && isInHoverSelection(h)) {
            bgClass = neutralHoverClass;
          } else if (pendingRange !== null && hoverHour === null && h === pendingRange) {
            bgClass = neutralHoverClass;
          } else if (changeIndex !== -1 && hoveredChangeIndex === changeIndex) {
            bgClass = timelineHoverColorByType[changes[changeIndex].type];
          } else if (changeIndex === -1 && hoveredFreeHour === h) {
            bgClass = neutralHoverClass;
          } else if (changeObj) {
            bgClass = timelineBaseColorByType[changeObj.type];
          }

          return (
            <button
              key={h}
              type="button"
              aria-label={`Select ${String(h).padStart(2, "0")}Z`}
              onClick={() => {
                if (changeIndex !== -1) {
                  onSelectChange(changeIndex);
                  return;
                }

                if (pendingRange === null) {
                  selectHour(h, onSelectRange);
                } else {
                  onSelectRange(pendingRange, h);
                  reset();
                }
              }}
              onPointerEnter={() => {
                if (changeIndex === -1) {
                    setHoveredChangeIndex(null);
                    setHoveredFreeHour(h);
                } else {
                    setHoveredChangeIndex(changeIndex);
                    setHoveredFreeHour(null);
                }
                if (pendingRange !== null) setHover(h);
              }}
              onPointerLeave={() => {
                setHoveredChangeIndex(null);
                setHoveredFreeHour(null);
                if (pendingRange !== null) setHover(null);
              }}
              className={`relative shrink-0 w-14 sm:w-16 lg:w-auto lg:flex-1 h-11 sm:h-12 text-xs flex items-center justify-center ${bgClass} cursor-pointer focus:outline-none focus-visible:ring-blue-500`}
              style={{ transition: "background 0.1s" }}
            >
              <span className="relative z-20">{String(h).padStart(2, "0")}Z</span>
              {idx < hours.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute right-0 top-0 z-30 h-full w-px ${separatorClass}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
