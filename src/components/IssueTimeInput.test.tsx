import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../features/i18n/LanguageProvider";
import IssueTimeInput from "./IssueTimeInput";

describe("IssueTimeInput mobile keyboard", () => {
  it("requests a numeric keyboard and emits at most six digits", () => {
    const onChange = vi.fn();
    render(
      <LanguageProvider>
        <IssueTimeInput id="issue-time" value="031100" onChange={onChange} />
      </LanguageProvider>,
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("pattern", "[0-9]*");
    expect(input).toHaveAttribute("maxlength", "6");

    fireEvent.change(input, { target: { value: "03A110099" } });
    expect(onChange).toHaveBeenLastCalledWith("031100");
  });
});
