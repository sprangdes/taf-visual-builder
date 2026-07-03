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
  it("provides a bounded numeric keyboard editor without replacing existing controls", () => {
    const onChange = vi.fn();
    renderControl({
      value: 20,
      min: 0,
      max: 99,
      onChange,
      mobileEditor: "numeric",
    });

    const editor = screen.getByRole("textbox");
    expect(editor).toHaveAttribute("inputmode", "numeric");
    expect(editor).toHaveAttribute("pattern", "[0-9]*");
    expect(editor).toHaveAttribute("min", "0");
    expect(editor).toHaveAttribute("max", "99");
    expect(screen.getByRole("spinbutton")).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(2);

    fireEvent.change(editor, { target: { value: "120" } });
    expect(onChange).toHaveBeenLastCalledWith(99);
  });

  it("provides the ordered native cloud amount options", () => {
    const onChange = vi.fn();
    renderControl({
      value: 0,
      min: 0,
      max: 3,
      onChange,
      mobileEditor: "select",
      mobileOptions: ["FEW", "SCT", "BKN", "OVC"],
    });

    const editor = screen.getByRole("combobox");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "FEW",
      "SCT",
      "BKN",
      "OVC",
    ]);

    fireEvent.change(editor, { target: { value: "2" } });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });
});
