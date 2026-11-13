import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TafBuilder from "./TafBuilder";
import { LanguageProvider } from "./features/i18n/LanguageProvider";

function render(node: React.ReactNode) {
  return rtlRender(<LanguageProvider>{node}</LanguageProvider>);
}

vi.mock("./utils/time", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils/time")>();
  return { ...actual, getCurrentIssueTimeUTC: () => "031100" };
});

describe("TafBuilder aviation workbench", () => {
  beforeEach(() => localStorage.clear());

  it("renders the redesigned workbench sections in order", () => {
    render(<TafBuilder />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    expect(headings).toEqual([
      "Create Terminal Aerodrome Forecast",
      "Forecast timeline",
      "Base forecast",
      "Generated TAF",
      "Checks",
      "Plain-language summary",
    ]);
    expect(screen.getByTestId("weather-scene")).toBeInTheDocument();
  });

  it("associates context labels with their inputs", () => {
    render(<TafBuilder />);
    expect(screen.getByLabelText("ICAO station code")).toBeVisible();
    expect(screen.getByLabelText("Issue time (DDHHMM)")).toBeVisible();
  });

  it("keeps generated output connected to the existing state", () => {
    render(<TafBuilder />);
    fireEvent.change(screen.getByLabelText("ICAO station code"), { target: { value: "RCTP" } });
    expect(screen.getByTestId("generated-taf")).toHaveTextContent("TAF RCTP 031100Z");
  });

  it("creates a change on the matching timeline lane and selects it", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select TEMPO 12Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 14Z"));
    expect(screen.getByRole("heading", { name: "Selected change" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TEMPO", pressed: true })).toBeVisible();

    fireEvent.click(screen.getByRole("switch", { name: "Include Wind" }));
    expect(screen.getByTestId("generated-taf")).toHaveTextContent("TEMPO 0312/0315 00000KT");
  });

  it("creates FM groups from a single hour until the end of validity", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select FM 18Z"));
    fireEvent.click(screen.getByRole("switch", { name: "Include Cloud layers" }));
    expect(screen.getByTestId("generated-taf")).toHaveTextContent("FM031800 FEW000");
  });

  it("switches between the base forecast and changes with period tabs", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select BECMG 13Z"));
    fireEvent.click(screen.getByLabelText("Select BECMG 13Z"));
    expect(screen.getByRole("button", { name: /BECMG 13Z–14Z/ })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Base forecast", pressed: false }));
    expect(screen.getByRole("heading", { name: "Base forecast", level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Include Wind" })).not.toBeInTheDocument();
  });

  it("lets the user pause the weather animation and remembers the choice", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Pause background animation" }));
    expect(screen.getByTestId("weather-scene")).toHaveClass("is-paused");
    // Pausing must freeze the motion layers only, never the scene's own fade-in.
    const css = readFileSync("src/index.css", "utf8");
    expect(css).not.toMatch(/\.weather-scene\.is-paused\s*[,{]/);
    expect(localStorage.getItem("taf-scene-motion")).toBe("0");
    expect(screen.getByRole("button", { name: "Play background animation" })).toBeVisible();
  });

  it("supports forcing a lighter rendering level for slow devices", () => {
    window.history.pushState({}, "", "/?fx=lite");
    render(<TafBuilder />);
    expect(document.querySelector(".taf-app")).toHaveClass("is-lite");
    expect(screen.getByTestId("weather-scene")).toHaveClass("is-paused");
    expect(screen.getByRole("button", { name: "Play background animation" })).toBeVisible();
    window.history.pushState({}, "", "/");
  });

  it("holds the weather animation while the user is editing", () => {
    render(<TafBuilder />);
    fireEvent.keyDown(window, { key: "a" });
    expect(document.documentElement).toHaveClass("scene-hold");
  });

  it("keeps the weather animation running while the page scrolls or buttons are pressed", () => {
    render(<TafBuilder />);
    document.documentElement.classList.remove("scene-hold");
    fireEvent.scroll(window);
    fireEvent.wheel(window, { deltaY: 120 });
    fireEvent.pointerDown(window, { pointerType: "touch" });
    fireEvent.pointerDown(window, { pointerType: "mouse" });
    fireEvent.click(window);
    expect(document.documentElement).not.toHaveClass("scene-hold");
    fireEvent.keyDown(window, { key: "1" });
    expect(document.documentElement).toHaveClass("scene-hold");
  });

  it("retains theme persistence", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(localStorage.getItem("taf-dark-mode")).toBe("1");
  });

  it("switches the workbench to Traditional Chinese without clearing editor data", () => {
    render(<TafBuilder />);
    fireEvent.change(screen.getByLabelText("ICAO station code"), { target: { value: "RCTP" } });
    fireEvent.click(screen.getByRole("button", { name: "Choose language" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "繁體中文" }));

    expect(screen.getByRole("heading", { name: "建立機場終端預報" })).toBeInTheDocument();
    expect(screen.getByLabelText("ICAO 機場代碼")).toHaveValue("RCTP");
    expect(screen.getByRole("heading", { name: "基本預報" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "風" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "能見度與天氣現象" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "雲層" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "白話解讀" })).toBeVisible();
    expect(screen.getByText(/靜風；?，?能見度 10 公里以上/)).toBeVisible();
    expect(screen.getByRole("button", { name: "切換至深色模式" })).toBeVisible();
    expect(screen.getByTestId("generated-taf")).toHaveTextContent("TAF RCTP");
  });

  it("keeps the editing controls of the redesigned cards", () => {
    render(<TafBuilder />);
    expect(screen.getByTestId("workbench-grid")).toContainElement(screen.getByTestId("generated-taf"));
    expect(screen.getByRole("heading", { name: "Wind" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Visibility & weather" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cloud layers" })).toBeVisible();
    expect(screen.getByTestId("generated-taf").querySelector(".taf-code-keyword")).not.toBeNull();
    expect(screen.getByRole("slider", { name: "Visibility" }).getAttribute("style")).toContain("--visibility-progress: 100%");
    expect(screen.getByText("Maximum 10,000 m")).toBeVisible();
    expect(document.querySelectorAll(".wind-control-group")).toHaveLength(3);

    const mobilePickers = Array.from(document.querySelectorAll<HTMLSelectElement>("select.numeric-control-mobile-editor"));
    expect(mobilePickers).toHaveLength(4);
    const optionLabels = (picker: HTMLSelectElement) => Array.from(picker.options, (option) => option.textContent);
    expect(optionLabels(mobilePickers[0])).toHaveLength(37);
    expect(optionLabels(mobilePickers[1])).toHaveLength(100);
    expect(optionLabels(mobilePickers[2])).toHaveLength(100);
    expect(optionLabels(mobilePickers[3])).toHaveLength(1000);

    fireEvent.click(screen.getByRole("button", { name: "Add -" }));
    fireEvent.click(screen.getByRole("button", { name: "Add RA" }));
    expect(screen.getByText("9999 -RA")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "BKN" }));
    fireEvent.click(screen.getByRole("button", { name: "CB" }));
    expect(screen.getByRole("button", { name: "CB" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("generated-taf")).toHaveTextContent("9999 -RA BKN000CB");

    const addLayer = screen.getByRole("button", { name: "Add Layer" });
    fireEvent.click(addLayer);
    fireEvent.click(addLayer);
    expect(document.querySelectorAll(".cloud-layers > .cloud-layer-row")).toHaveLength(3);
  });

  it("deletes the selected change and returns to the base forecast", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select TEMPO 12Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 14Z"));
    fireEvent.click(screen.getByRole("button", { name: "Delete change" }));
    expect(screen.getByRole("heading", { name: "Base forecast", level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText("Select TEMPO 13Z")).toBeInTheDocument();
  });

  it("uses the system destructive action for deleting a cloud layer", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Add Layer" }));

    const deleteLayers = screen.getAllByRole("button", { name: "Delete cloud layer" });
    expect(deleteLayers).toHaveLength(2);
    expect(deleteLayers[0]).toHaveClass("cloud-delete-button");
    fireEvent.click(deleteLayers[0]);
    expect(screen.queryAllByRole("button", { name: "Delete cloud layer" })).toHaveLength(0);
  });

  it("keeps change sections excluded until explicitly included", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select TEMPO 12Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 14Z"));

    const includeWind = screen.getByRole("switch", { name: "Include Wind" });
    expect(includeWind).toHaveAttribute("aria-checked", "false");
    expect(includeWind.closest(".condition-card")).toHaveClass("is-inactive");
    expect(screen.getByText("Not included · follows base 00000KT")).toBeVisible();
    expect(screen.getByText(/no sections are included/)).toBeVisible();

    fireEvent.click(includeWind);
    expect(includeWind).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Not included · follows base 00000KT")).not.toBeInTheDocument();
  });

  it("makes each timeline lane a single tab stop navigable with arrow keys", () => {
    render(<TafBuilder />);
    const first = screen.getByLabelText("Select TEMPO 11Z");
    expect(first).toHaveAttribute("tabindex", "0");
    expect(screen.getByLabelText("Select TEMPO 12Z")).toHaveAttribute("tabindex", "-1");

    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByLabelText("Select TEMPO 12Z")).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(screen.getByLabelText("Select BECMG 12Z")).toHaveFocus();
  });

  it("prevents switching a change into a lane that is already occupied", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select BECMG 13Z"));
    fireEvent.click(screen.getByLabelText("Select BECMG 14Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 13Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 13Z"));

    expect(screen.getByRole("button", { name: "BECMG", pressed: false })).toBeDisabled();
    expect(screen.getByRole("button", { name: "FM", pressed: false })).toBeEnabled();
  });

  it("does not create a change that overlaps another one in the same lane", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select TEMPO 13Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 15Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 12Z"));
    fireEvent.click(screen.getByLabelText("Select TEMPO 17Z"));
    expect(document.querySelectorAll(".timeline-bar--tempo")).toHaveLength(1);
  });

  it("warns when low visibility has no weather phenomenon", () => {
    render(<TafBuilder />);
    fireEvent.change(screen.getByRole("slider", { name: "Visibility" }), { target: { value: "3000" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Visibility 5000m Or Below");
    expect(screen.getByText(/visibility 5000 m or below needs a weather phenomenon/)).toBeVisible();
  });

  it("copies the generated TAF", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<TafBuilder />);
    fireEvent.change(screen.getByLabelText("ICAO station code"), { target: { value: "rcss" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy TAF to clipboard" }));
    await waitFor(() => expect(screen.getByText("Copied")).toBeVisible());
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^TAF RCSS 031100Z/));
  });

  it("opens guided tours only after an explicit user action", () => {
    render(<TafBuilder />);
    expect(screen.queryByRole("menu", { name: "Guided tours" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open guided tours" }));
    expect(screen.getByRole("menu", { name: "Guided tours" })).toBeVisible();
  });

  it("restores the pre-tour forecast after quick start", async () => {
    render(<TafBuilder />);
    fireEvent.change(screen.getByLabelText("ICAO station code"), { target: { value: "RCSS" } });
    fireEvent.click(screen.getByRole("button", { name: "Open guided tours" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Quick Start/ }));
    expect(screen.getByLabelText("ICAO station code")).toHaveValue("RCTP");

    fireEvent.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Keep the demonstration forecast?" })).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Restore my forecast" }));
    expect(screen.getByLabelText("ICAO station code")).toHaveValue("RCSS");
  });

  it("advances through quick start without editor interaction", async () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Open guided tours" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Quick Start/ }));

    for (const title of [
      "Base forecast",
      "Wind",
      "Visibility & weather",
      "Cloud layers",
      "Create a change period",
      "Selected change",
      "Change type",
      "Generated TAF",
    ]) {
      const next = await waitFor(() => {
        const button = document.querySelector<HTMLButtonElement>(".tour-flight-next");
        expect(button).not.toBeNull();
        return button!;
      });
      expect(next).toBeEnabled();
      fireEvent.click(next);
      await waitFor(() => expect(document.querySelector(".tour-flight-strip h2")).toHaveTextContent(title));
    }
    expect(document.querySelector(".tour-task-actionable")).not.toBeInTheDocument();
  });
});
