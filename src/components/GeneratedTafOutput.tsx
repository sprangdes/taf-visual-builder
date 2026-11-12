import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../features/i18n/LanguageContext";
import type { TAFChange } from "../types/taf";
import type { TafLine } from "../utils/taf";

interface GeneratedTafOutputProps {
  lines: TafLine[];
  station: string;
  changes: readonly TAFChange[];
  selectedChangeIndex: number | null;
}

const keywordPattern = /^(TAF|TEMPO|BECMG|FM\d{6})$/;
const accentPattern = /^(\d{3}(\d{2}|P\d{2})(G\d{2})?KT|\d{4}|FEW\d{3}(CB|TCU)?|SCT\d{3}(CB|TCU)?|BKN\d{3}(CB|TCU)?|OVC\d{3}(CB|TCU)?|VV\d{3}|[-+]?(VC)?(SH|TS)?(RA|DZ|SN)?(BR|FG|HZ)?)$/;

function tokenClass(token: string, station: string): string | undefined {
  if (!token.trim()) return undefined;
  if (keywordPattern.test(token)) return "taf-code-keyword";
  if (token === station || accentPattern.test(token)) return "taf-code-accent";
  return undefined;
}

export default function GeneratedTafOutput({ lines, station, changes, selectedChangeIndex }: Readonly<GeneratedTafOutputProps>) {
  const { text } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullText = lines.map((line) => line.text).join("\n");

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="output-header">
        <div className="output-title">
          <h2>{text.sections.output.title}</h2>
          <span className="live-indicator"><i aria-hidden="true" />{text.output.live}</span>
        </div>
        <button type="button" className="copy-button" aria-label={text.output.copyAria} onClick={copy}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>
          <span aria-live="polite">{copied ? text.output.copied : text.output.copy}</span>
        </button>
      </div>
      <pre data-testid="generated-taf" className="taf-code">
        {lines.map((line, lineIndex) => {
          const type = line.changeIndex === null ? "base" : changes[line.changeIndex]?.type.toLowerCase();
          const selected = line.changeIndex !== null && line.changeIndex === selectedChangeIndex;
          return (
            <span key={lineIndex} className={`taf-code-line taf-code-line--${type} ${selected ? "is-selected" : ""}`}>
              {line.text.split(/(\s+)/).map((token, index) => (
                <span key={`${index}-${token}`} className={tokenClass(token, station)}>{token}</span>
              ))}
            </span>
          );
        })}
      </pre>
    </>
  );
}
