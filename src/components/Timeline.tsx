import { useRef, useState } from "react";
import type { TAFChange, WeatherTrendType } from "../types/taf";
import { useLanguage } from "../features/i18n/LanguageContext";
import {
  TIMELINE_HOURS,
  formatHour,
  getChangeRange,
  getTimelineHours,
  rangesOverlap,
  type TimelineRange,
} from "../utils/timeline";
import { formatWeatherState } from "../utils/weather";
import type { WeatherState } from "../types/taf";

const LANES: WeatherTrendType[] = ["TEMPO", "BECMG", "FM"];

interface TimelineProps {
  changes: TAFChange[];
  base: WeatherState;
  startHour: number;
  selectedChangeIndex: number | null;
  /** Range is given as timeline indexes: `start` inclusive, `end` exclusive. */
  onCreate: (type: WeatherTrendType, range: TimelineRange) => void;
  onSelectChange: (index: number) => void;
  onSelectBase: () => void;
}

interface Pending {
  type: WeatherTrendType;
  index: number;
}

function gridColumn(range: TimelineRange): string {
  return `${range.start + 1} / ${range.end + 1}`;
}

export default function Timeline({
  changes,
  base,
  startHour,
  selectedChangeIndex,
  onCreate,
  onSelectChange,
  onSelectBase,
}: Readonly<TimelineProps>) {
  const { text } = useLanguage();
  const hours = getTimelineHours(startHour);
  const [pending, setPending] = useState<Pending | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const dragRef = useRef<{ type: WeatherTrendType; index: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const laneRanges = (type: WeatherTrendType) =>
    changes
      .map((change, index) => ({ change, index }))
      .filter(({ change }) => change.type === type)
      .map(({ change, index }) => ({ index, change, range: getChangeRange(change, changes, startHour) }));

  const isFree = (type: WeatherTrendType, range: TimelineRange) =>
    !laneRanges(type).some((entry) => rangesOverlap(entry.range, range));

  const commit = (type: WeatherTrendType, a: number, b: number) => {
    const range: TimelineRange =
      type === "FM" ? { start: a, end: TIMELINE_HOURS } : { start: Math.min(a, b), end: Math.max(a, b) + 1 };
    const target = type === "FM" ? { start: a, end: a + 1 } : range;
    setPending(null);
    setHoverIndex(null);
    if (!isFree(type, target)) return;
    onCreate(type, range);
  };

  const handleCellClick = (type: WeatherTrendType, index: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (type === "FM") {
      commit(type, index, index);
      return;
    }
    if (pending && pending.type === type) {
      commit(type, pending.index, index);
      return;
    }
    setPending({ type, index });
  };

  const previewRange = (type: WeatherTrendType): TimelineRange | null => {
    if (!pending || pending.type !== type) return null;
    const other = hoverIndex ?? pending.index;
    return { start: Math.min(pending.index, other), end: Math.max(pending.index, other) + 1 };
  };

  return (
    <div className="timeline">
      <div className="timeline-scroll">
        <div className="timeline-grid" onPointerLeave={() => setHoverIndex(null)}>
          <div className="timeline-row timeline-ruler" aria-hidden="true">
            <span className="timeline-lane-label" />
            <div className="timeline-track timeline-track--ruler">
              {hours.map((hour, index) => (
                <span key={hour} className={`timeline-tick ${hour === 0 ? "is-midnight" : ""}`} style={{ gridColumn: index + 1 }}>
                  {index % 3 === 0 || hour === 0 ? `${formatHour(hour)}Z` : ""}
                </span>
              ))}
            </div>
          </div>

          <div className="timeline-row">
            <span className="timeline-lane-label">{text.timeline.base}</span>
            <div className="timeline-track">
              <button
                type="button"
                className={`timeline-bar timeline-bar--base ${selectedChangeIndex === null ? "is-selected" : ""}`}
                style={{ gridColumn: `1 / ${TIMELINE_HOURS + 1}` }}
                aria-pressed={selectedChangeIndex === null}
                onClick={onSelectBase}
              >
                <strong>{text.sections.base.title}</strong>
                <span className="timeline-bar-code">{formatWeatherState({ ...base, enabledBlocks: { wind: true, vis: true, clouds: true } }, true)}</span>
              </button>
            </div>
          </div>

          {LANES.map((type) => {
            const entries = laneRanges(type);
            const preview = previewRange(type);
            const covered = new Set<number>();
            entries.forEach(({ range }) => {
              for (let i = range.start; i < range.end; i += 1) covered.add(i);
            });
            return (
              <div key={type} className={`timeline-row timeline-row--${type.toLowerCase()}`}>
                <span className="timeline-lane-label">{type}</span>
                <div className="timeline-track" data-lane={type}>
                  {hours.map((hour, index) =>
                    covered.has(index) ? null : (
                      <button
                        key={hour}
                        type="button"
                        className={`timeline-cell ${preview && index >= preview.start && index < preview.end ? "is-preview" : ""} ${pending?.type === type && pending.index === index ? "is-anchor" : ""}`}
                        style={{ gridColumn: index + 1 }}
                        aria-label={text.actions.selectHour(type, formatHour(hour))}
                        onClick={() => handleCellClick(type, index)}
                        onPointerDown={(event) => {
                          if (event.pointerType !== "mouse" || type === "FM") return;
                          dragRef.current = { type, index, moved: false };
                        }}
                        onPointerEnter={() => {
                          setHoverIndex(index);
                          const drag = dragRef.current;
                          if (drag && drag.type === type && drag.index !== index) {
                            drag.moved = true;
                            setPending({ type, index: drag.index });
                          }
                        }}
                        onPointerUp={() => {
                          const drag = dragRef.current;
                          dragRef.current = null;
                          if (drag && drag.moved && drag.type === type) {
                            suppressClickRef.current = true;
                            commit(type, drag.index, index);
                          }
                        }}
                      />
                    ),
                  )}
                  {entries.map(({ change, index, range }) => {
                    const from = `${formatHour(Number(change.from))}Z`;
                    const label = type === "FM" ? `FM ${from}` : `${from}–${formatHour(Number(change.to))}Z`;
                    return (
                      <button
                        key={`bar-${index}`}
                        type="button"
                        className={`timeline-bar timeline-bar--${type.toLowerCase()} ${selectedChangeIndex === index ? "is-selected" : ""}`}
                        style={{ gridColumn: gridColumn(range) }}
                        aria-pressed={selectedChangeIndex === index}
                        onClick={() => onSelectChange(index)}
                      >
                        <span className="timeline-bar-code">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="timeline-hint" aria-live="polite">
        {pending ? text.timeline.pendingHint(formatHour(hours[pending.index])) : text.timeline.hint}
      </p>
    </div>
  );
}
