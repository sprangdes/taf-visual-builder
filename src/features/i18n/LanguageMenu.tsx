import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageContext";
import type { Language } from "./translations";

const options: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh-TW", label: "繁體中文" },
];

export function LanguageMenu() {
  const { language, setLanguage, text } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    <div className="language-menu-root" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="theme-toggle icon-button"
        aria-controls="language-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={text.language.open}
        title={text.language.open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18" />
        </svg>
      </button>
      {open && (
        <div id="language-menu" className="language-menu" role="menu" aria-label={text.language.menu}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={language === option.value}
              onClick={() => {
                setLanguage(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              <i aria-hidden="true">{language === option.value ? "✓" : ""}</i>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
