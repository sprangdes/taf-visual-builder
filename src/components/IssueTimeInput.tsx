import { useEffect, useRef } from "react";
import type React from "react";
import type { IssueTimeInputProps } from "../types/taf";
import { getCurrentIssueTimeUTC } from "../utils/time";

export default function IssueTimeInput({ value, onChange }: Readonly<IssueTimeInputProps>) {
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
    <span className="inline-flex items-center border rounded-xl w-full">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value.slice(0, 6)}
        onChange={handleChange}
        className="border-0 p-1 focus:outline-none w-full min-w-0"
        style={{ borderRight: "none", borderRadius: "0.375rem 0 0 0.375rem" }}
        aria-label="Issue time (DDHHMM)"
        placeholder={value.slice(0, 6) ? undefined : "UTC Time"}
      />
      <span className="px-2" style={{ height: "100%", fontWeight: 500, fontSize: "1rem" }}>
        Z
      </span>
    </span>
  );
}
