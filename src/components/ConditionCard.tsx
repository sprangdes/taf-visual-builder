import type { ReactNode } from "react";
import { useLanguage } from "../features/i18n/LanguageContext";

interface ConditionCardProps {
  tourId: string;
  className: string;
  title: string;
  isBase: boolean;
  enabled: boolean;
  onSetEnabled: (enabled: boolean) => void;
  /** TAF code produced by this section. */
  output: string;
  /** TAF code inherited from the base forecast when the section is not included. */
  inherited: string;
  children: ReactNode;
}

export default function ConditionCard({
  tourId,
  className,
  title,
  isBase,
  enabled,
  onSetEnabled,
  output,
  inherited,
  children,
}: Readonly<ConditionCardProps>) {
  const { text } = useLanguage();
  const active = isBase || enabled;

  return (
    <section data-tour-id={tourId} className={`condition-card ${className} ${active ? "" : "is-inactive"}`}>
      <header className="condition-card-header">
        <h3>{title}</h3>
        {!isBase && (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={text.editor.include(title)}
            className="include-switch"
            onClick={() => onSetEnabled(!enabled)}
          >
            <span className="include-switch-label" aria-hidden="true">{text.editor.included}</span>
            <span className="include-switch-track" aria-hidden="true"><i /></span>
          </button>
        )}
      </header>
      {active ? (
        <>
          {children}
          <p className="condition-output">
            <span>{text.editor.output}</span>
            <code>{output || "—"}</code>
          </p>
        </>
      ) : (
        <p className="condition-inherited">{text.editor.notIncluded(inherited)}</p>
      )}
    </section>
  );
}
