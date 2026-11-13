import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../features/i18n/LanguageProvider";
import NumericControl from "./NumericControl";

function renderControl(props: React.ComponentProps<typeof NumericControl>) {
  return render(
    <LanguageProvider>
      <NumericControl {...props} />
    </LanguageProvider>,
  );
}

describe("NumericControl mobile editors", () => {
  it("emits explicit native picker values without replacing desktop controls", () => {
    const onChange = vi.fn();
    renderControl({
      value: 0,
      min: 0,
      max: 20,
      onChange,
      mobileEditor: "select",
      mobileOptions: [
        { value: 0, label: "000" },
        { value: 10, label: "010" },
        { value: 20, label: "020" },
      ],
    });

    const editor = screen.getByRole("combobox");
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.getAttribute("value"))).toEqual(["0", "10", "20"]);
    expect(options.map((option) => option.textContent)).toEqual(["000", "010", "020"]);
    expect(screen.getByRole("spinbutton")).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(2);

    fireEvent.change(editor, { target: { value: "20" } });
    expect(onChange).toHaveBeenLastCalledWith(20);
  });
});

describe("NumericControl direct entry", () => {
  it("commits typed values on Enter, clamped and snapped to step", () => {
    const onChange = vi.fn();
    renderControl({ value: 0, min: 0, max: 360, step: 10, onChange });
    const input = screen.getByRole("spinbutton");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "247" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(250);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(360);
  });

  it("reverts on Escape without emitting", () => {
    const onChange = vi.fn();
    renderControl({ value: 5, min: 0, max: 99, onChange, formatValue: (v) => String(v).padStart(2, "0") });
    const input = screen.getByRole("spinbutton");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "42" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("05");
  });
});

describe("NumericControl click-and-type", () => {
  it("replaces the whole value with the first digit typed after focusing", () => {
    const onChange = vi.fn();
    renderControl({ value: 0, min: 0, max: 999, onChange, formatValue: (v) => String(v).padStart(3, "0") });
    const input = screen.getByRole("spinbutton");

    fireEvent.focus(input);
    // Simulate Safari: the click leaves a collapsed caret at the end of the full value.
    (input as HTMLInputElement).setSelectionRange(3, 3);
    fireEvent.keyDown(input, { key: "2" });
    expect(input).toHaveValue("2");
    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(25);
  });

  it("clears the field when the first key is Backspace", () => {
    renderControl({ value: 270, min: 0, max: 360, step: 10, onChange: vi.fn() });
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(input).toHaveValue("");
  });

  it("edits normally once the caret has been moved", () => {
    renderControl({ value: 270, min: 0, max: 360, step: 10, onChange: vi.fn() });
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    fireEvent.keyDown(input, { key: "5" });
    expect(input).toHaveValue("270");
  });

  it("keeps shortcuts such as Cmd+V working", () => {
    renderControl({ value: 12, min: 0, max: 99, onChange: vi.fn() });
    const input = screen.getByRole("spinbutton");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "v", metaKey: true });
    expect(input).toHaveValue("12");
  });
});
