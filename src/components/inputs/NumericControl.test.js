import { jsx as _jsx } from "react/jsx-runtime";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../features/i18n/LanguageProvider";
import NumericControl from "./NumericControl";
function renderControl(props) {
    return render(_jsx(LanguageProvider, { children: _jsx(NumericControl, { ...props }) }));
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
