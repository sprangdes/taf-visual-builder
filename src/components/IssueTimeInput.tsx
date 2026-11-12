import { useEffect, useRef } from "react";
import type React from "react";
import type { IssueTimeInputProps } from "../types/taf";
import { getCurrentIssueTimeUTC } from "../utils/time";
import { useLanguage } from "../features/i18n/LanguageContext";

export default function IssueTimeInput({ id, value, onChange }: Readonly<IssueTimeInputProps>) {
  const { text } = useLanguage();
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    if (!value || value.length < 6) {
      onChange(getCurrentIssueTimeUTC());
    }
    didInitRef.current = true;
  }, [onChange, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replaceAll(/\D/g, "");
    if (val.length > 6) val = val.slice(0, 6);
    onChange(val);
  };

  return (
    <span className="issue-time-input">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value.slice(0, 6)}
        onChange={handleChange}
        aria-label={text.fields.issueTime.replace(" · ", " (") + ")"}
        placeholder={value.slice(0, 6) ? undefined : "DDHHMM"}
      />
      <span aria-hidden="true">Z</span>
    </span>
  );
}
