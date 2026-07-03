import { useEffect, useRef, useState } from "react";
import { tourCatalog } from "./tourDefinitions";
import type { TourId } from "./types";

interface TourMenuProps {
  onStart: (id: TourId) => void;
}

export function TourMenu({ onStart }: Readonly<TourMenuProps>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="tour-menu-root" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        aria-controls="guided-tour-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open guided tours"
        title="Open guided tours"
        className="theme-toggle icon-button"
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
          <path d="M12 3a9 9 0 1 0 6.36 15.36l2.14 2.14a1 1 0 0 0 1.41-1.41l-2.14-2.14A9 9 0 0 0 12 3Zm0 2a7 7 0 1 1 0 14a7 7 0 0 1 0-14Zm0 3a1 1 0 0 0 0 2a2 2 0 0 1 2 2a1 1 0 1 0 2 0a4 4 0 0 0-4-4Zm-1 6a1 1 0 1 0 2 0v-1a1 1 0 1 0-2 0v1Z" />
        </svg>
      </button>
      {open && (
        <div id="guided-tour-menu" className="tour-menu" role="menu" aria-label="Guided tours">
          <p className="tour-menu-label">Guided briefing</p>
          {tourCatalog.map((tour) => (
            <button
              key={tour.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onStart(tour.id);
              }}
            >
              <strong>{tour.label}</strong>
              <span>{tour.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface TourExitDialogProps {
  onResolve: (decision: "keep" | "restore") => void;
}

export function TourExitDialog({ onResolve }: Readonly<TourExitDialogProps>) {
  return (
    <div className="tour-exit-backdrop">
      <section className="tour-exit-dialog" role="dialog" aria-modal="true" aria-labelledby="tour-exit-title">
        <p className="tour-menu-label">Guided briefing complete</p>
        <h2 id="tour-exit-title">Keep the demonstration forecast?</h2>
        <p>You can keep the example values or restore the forecast you had before starting.</p>
        <div className="tour-exit-actions">
          <button type="button" className="tour-flight-back" onClick={() => onResolve("restore")}>Restore my forecast</button>
          <button type="button" className="tour-flight-next" onClick={() => onResolve("keep")}>Keep demo result</button>
        </div>
      </section>
    </div>
  );
}
