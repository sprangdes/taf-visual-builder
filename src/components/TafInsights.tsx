import { useLanguage } from "../features/i18n/LanguageContext";
import type { TAF } from "../types/taf";
import { getTafChecks, getTafSummary } from "../utils/tafInsights";

const CHECK_ICON = { ok: "✓", warn: "!", info: "i" } as const;

export function TafChecks({ taf }: Readonly<{ taf: TAF }>) {
  const { text } = useLanguage();
  const checks = getTafChecks(taf, text);
  return (
    <section className="glass-panel insight-panel" aria-labelledby="taf-checks-title">
      <h2 id="taf-checks-title">{text.output.checks}</h2>
      <ul className="check-list">
        {checks.map((check, index) => (
          <li key={index} className={`check-item check-item--${check.level}`}>
            <span className="check-icon" aria-hidden="true">{CHECK_ICON[check.level]}</span>
            <span>{check.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TafSummary({ taf }: Readonly<{ taf: TAF }>) {
  const { text } = useLanguage();
  const lines = getTafSummary(taf, text.decode);
  return (
    <section className="glass-panel insight-panel" aria-labelledby="taf-summary-title">
      <h2 id="taf-summary-title">{text.output.summary}</h2>
      <div className="summary-list">
        {lines.map((line, index) => (
          <p key={index} className={`summary-line summary-line--${line.type.toLowerCase()}`}>{line.text}</p>
        ))}
      </div>
    </section>
  );
}
