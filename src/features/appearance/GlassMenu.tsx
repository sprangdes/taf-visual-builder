import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { applyGlassClarity, clampClarity, DEFAULT_GLASS_CLARITY, GLASS_STORAGE_KEY, readStoredClarity } from "./glass";

/** Header button with a popover slider that sets how clear the liquid glass panels are. */
export function GlassMenu() {
  const { text } = useLanguage();
  const [open, setOpen] = useState(false);
  const [clarity, setClarity] = useState(readStoredClarity);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Before paint, so the first frame already uses the stored transparency.
  useLayoutEffect(() => {
    applyGlassClarity(clarity);
  }, [clarity]);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(GLASS_STORAGE_KEY, String(clarity));
    } catch {
      // Storage can be unavailable (private mode); the setting then lasts for this visit only.
    }
  }, [clarity]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="glass-menu-root" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        aria-controls="glass-menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={text.glass.open}
        title={text.glass.open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor" fillOpacity="0.35" stroke="none" />
          <path d="M8.5 8.2a4.6 4.6 0 0 1 3-1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div id="glass-menu" className="glass-menu" role="dialog" aria-label={text.glass.title}>
          <div className="glass-menu-header">
            <span>{text.glass.title}</span>
            <strong>{clarity}%</strong>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={clarity}
            aria-label={text.glass.title}
            aria-valuetext={text.glass.value(clarity)}
            style={{ "--glass-progress": `${clarity}%` } as CSSProperties}
            onChange={(event) => setClarity(clampClarity(Number(event.target.value)))}
          />
          <div className="glass-menu-scale" aria-hidden="true">
            <span>{text.glass.frosted}</span>
            <span>{text.glass.clear}</span>
          </div>
          <button
            type="button"
            className="glass-menu-reset"
            disabled={clarity === DEFAULT_GLASS_CLARITY}
            onClick={() => setClarity(DEFAULT_GLASS_CLARITY)}
          >
            {text.glass.reset}
          </button>
        </div>
      )}
    </div>
  );
}
