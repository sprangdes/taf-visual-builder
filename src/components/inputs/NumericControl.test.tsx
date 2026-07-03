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
