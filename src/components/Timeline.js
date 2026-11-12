import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { useLanguage } from "../features/i18n/LanguageContext";
import { TIMELINE_HOURS, formatHour, getChangeRange, getTimelineHours, rangesOverlap, } from "../utils/timeline";
import { formatWeatherState } from "../utils/weather";
const LANES = ["TEMPO", "BECMG", "FM"];
function gridColumn(range) {
    return `${range.start + 1} / ${range.end + 1}`;
}
export default function Timeline({ changes, base, startHour, selectedChangeIndex, onCreate, onSelectChange, onSelectBase, }) {
    const { text } = useLanguage();
    const hours = getTimelineHours(startHour);
    const [pending, setPending] = useState(null);
    const [hoverIndex, setHoverIndex] = useState(null);
    // Roving tab stop: each lane is a single Tab stop and arrow keys move between hours.
    const [focusIndex, setFocusIndex] = useState({});
    const dragRef = useRef(null);
    const suppressClickUntilRef = useRef(0);
    const indexFromPointer = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
        return Math.min(TIMELINE_HOURS - 1, Math.max(0, Math.floor(ratio * TIMELINE_HOURS)));
    };
    const laneRanges = (type) => changes
        .map((change, index) => ({ change, index }))
        .filter(({ change }) => change.type === type)
        .map(({ change, index }) => ({ index, change, range: getChangeRange(change, changes, startHour) }));
    const isFree = (type, range) => !laneRanges(type).some((entry) => rangesOverlap(entry.range, range));
    const commit = (type, a, b) => {
        const range = type === "FM" ? { start: a, end: TIMELINE_HOURS } : { start: Math.min(a, b), end: Math.max(a, b) + 1 };
        const target = type === "FM" ? { start: a, end: a + 1 } : range;
        setPending(null);
        setHoverIndex(null);
        if (!isFree(type, target))
            return;
        onCreate(type, range);
    };
    const handleCellClick = (type, index, timeStamp) => {
        if (timeStamp < suppressClickUntilRef.current)
            return;
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
    const handleCellKeyDown = (event, type) => {
        const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Escape"];
        if (!keys.includes(event.key))
            return;
        event.preventDefault();
        if (event.key === "Escape") {
            setPending(null);
            setHoverIndex(null);
            return;
        }
        const grid = event.currentTarget.closest(".timeline-grid");
        const track = event.currentTarget.parentElement;
        if (!grid || !track)
            return;
        const cells = Array.from(track.querySelectorAll(".timeline-cell"));
        const position = cells.indexOf(event.currentTarget);
        let next;
        if (event.key === "ArrowLeft")
            next = cells[position - 1];
        if (event.key === "ArrowRight")
            next = cells[position + 1];
        if (event.key === "Home")
            next = cells[0];
        if (event.key === "End")
            next = cells[cells.length - 1];
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            const lanes = Array.from(grid.querySelectorAll(".timeline-track[data-lane]"));
            const target = lanes[lanes.indexOf(track) + (event.key === "ArrowUp" ? -1 : 1)];
            const column = Number(event.currentTarget.dataset.index);
            const candidates = target ? Array.from(target.querySelectorAll(".timeline-cell")) : [];
            next = candidates.find((cell) => Number(cell.dataset.index) >= column) ?? candidates[candidates.length - 1];
        }
        if (!next)
            return;
        next.focus();
        const index = Number(next.dataset.index);
        if (pending && pending.type === type)
            setHoverIndex(index);
    };
    const previewRange = (type) => {
        if (!pending || pending.type !== type)
            return null;
        const other = hoverIndex ?? pending.index;
        return { start: Math.min(pending.index, other), end: Math.max(pending.index, other) + 1 };
    };
    return (_jsxs("div", { className: "timeline", children: [_jsx("div", { className: "timeline-scroll", children: _jsxs("div", { className: "timeline-grid", onPointerLeave: () => setHoverIndex(null), children: [_jsxs("div", { className: "timeline-row timeline-ruler", "aria-hidden": "true", children: [_jsx("span", { className: "timeline-lane-label" }), _jsx("div", { className: "timeline-track timeline-track--ruler", children: hours.map((hour, index) => (_jsx("span", { className: `timeline-tick ${hour === 0 ? "is-midnight" : ""}`, style: { gridColumn: index + 1 }, children: index % 3 === 0 || hour === 0 ? `${formatHour(hour)}Z` : "" }, hour))) })] }), _jsxs("div", { className: "timeline-row", children: [_jsx("span", { className: "timeline-lane-label", children: text.timeline.base }), _jsx("div", { className: "timeline-track", children: _jsxs("button", { type: "button", className: `timeline-bar timeline-bar--base ${selectedChangeIndex === null ? "is-selected" : ""}`, style: { gridColumn: `1 / ${TIMELINE_HOURS + 1}` }, "aria-pressed": selectedChangeIndex === null, onClick: onSelectBase, children: [_jsx("strong", { children: text.sections.base.title }), _jsx("span", { className: "timeline-bar-code", children: formatWeatherState({ ...base, enabledBlocks: { wind: true, vis: true, clouds: true } }, true) })] }) })] }), LANES.map((type) => {
                            const entries = laneRanges(type);
                            const preview = previewRange(type);
                            const covered = new Set();
                            entries.forEach(({ range }) => {
                                for (let i = range.start; i < range.end; i += 1)
                                    covered.add(i);
                            });
                            const freeIndexes = hours.map((_, index) => index).filter((index) => !covered.has(index));
                            const preferred = focusIndex[type];
                            const laneTabStop = preferred !== undefined && freeIndexes.includes(preferred) ? preferred : freeIndexes[0];
                            return (_jsxs("div", { className: `timeline-row timeline-row--${type.toLowerCase()}`, children: [_jsx("span", { className: "timeline-lane-label", children: type }), _jsxs("div", { className: "timeline-track", "data-lane": type, onPointerDown: (event) => {
                                            const target = event.target;
                                            if (event.pointerType !== "mouse" || event.button !== 0 || type === "FM")
                                                return;
                                            if (!target.classList.contains("timeline-cell"))
                                                return;
                                            event.preventDefault();
                                            const index = indexFromPointer(event);
                                            dragRef.current = { type, index, moved: false };
                                        }, onPointerMove: (event) => {
                                            const drag = dragRef.current;
                                            if (!drag || drag.type !== type)
                                                return;
                                            const index = indexFromPointer(event);
                                            setHoverIndex(index);
                                            if (index !== drag.index && !drag.moved) {
                                                drag.moved = true;
                                                // Capture only once dragging starts so a plain click still reaches the cell.
                                                event.currentTarget.setPointerCapture?.(event.pointerId);
                                                setPending({ type, index: drag.index });
                                            }
                                        }, onPointerUp: (event) => {
                                            const drag = dragRef.current;
                                            dragRef.current = null;
                                            if (event.currentTarget.hasPointerCapture?.(event.pointerId))
                                                event.currentTarget.releasePointerCapture(event.pointerId);
                                            if (!drag || drag.type !== type || !drag.moved)
                                                return;
                                            suppressClickUntilRef.current = event.timeStamp + 300;
                                            commit(type, drag.index, indexFromPointer(event));
                                        }, onPointerCancel: () => {
                                            dragRef.current = null;
                                        }, children: [hours.map((hour, index) => covered.has(index) ? null : (_jsx("button", { type: "button", className: `timeline-cell ${preview && index >= preview.start && index < preview.end ? "is-preview" : ""} ${pending?.type === type && pending.index === index ? "is-anchor" : ""}`, style: { gridColumn: index + 1 }, "aria-label": text.actions.selectHour(type, formatHour(hour)), "data-index": index, tabIndex: index === laneTabStop ? 0 : -1, onFocus: () => setFocusIndex((current) => ({ ...current, [type]: index })), onKeyDown: (event) => handleCellKeyDown(event, type), onClick: (event) => handleCellClick(type, index, event.timeStamp), onPointerEnter: () => {
                                                    if (!dragRef.current)
                                                        setHoverIndex(index);
                                                } }, hour))), entries.map(({ change, index, range }) => {
                                                const from = `${formatHour(Number(change.from))}Z`;
                                                const label = type === "FM" ? `FM ${from}` : `${from}–${formatHour(Number(change.to))}Z`;
                                                return (_jsx("button", { type: "button", className: `timeline-bar timeline-bar--${type.toLowerCase()} ${selectedChangeIndex === index ? "is-selected" : ""}`, style: { gridColumn: gridColumn(range) }, "aria-pressed": selectedChangeIndex === index, onClick: () => onSelectChange(index), children: _jsx("span", { className: "timeline-bar-code", children: label }) }, `bar-${index}`));
                                            })] })] }, type));
                        })] }) }), _jsx("p", { className: "timeline-hint", "aria-live": "polite", children: pending ? text.timeline.pendingHint(formatHour(hours[pending.index])) : text.timeline.hint })] }));
}
