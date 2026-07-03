import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
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

  it("renders the unchanged workflow in sequence", () => {
    render(<TafBuilder />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    expect(headings).toEqual([
      "Create Terminal Aerodrome Forecast",
      "Forecast context",
      "Base forecast",
      "Forecast timeline",
      "Generated TAF",
    ]);
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

  it("creates and selects a change through the existing timeline", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select 12Z"));
    fireEvent.click(screen.getByLabelText("Select 14Z"));
    expect(screen.getByRole("heading", { name: "Selected change" })).toBeVisible();
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

    expect(screen.getByRole("heading", { name: "建立機場終端預報" })).toBeVisible();
    expect(screen.getByLabelText("ICAO 機場代碼")).toHaveValue("RCTP");
    expect(screen.getByRole("heading", { name: "基本預報" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "風" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "能見度與天氣現象" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "雲層" })).toBeVisible();
    expect(screen.getByText("已設定")).toBeVisible();
    expect(screen.getByRole("button", { name: "切換至深色模式" })).toBeVisible();
    expect(screen.getByTestId("generated-taf")).toHaveTextContent("TAF RCTP");
  });

  it("matches the approved workbench hierarchy", () => {
    render(<TafBuilder />);
    expect(screen.getByRole("heading", { name: "Create Terminal Aerodrome Forecast" })).toBeVisible();
    expect(screen.getByTestId("workbench-grid")).toContainElement(screen.getByTestId("generated-taf"));
    expect(screen.getByRole("heading", { name: "Wind" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Visibility & weather" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cloud layers" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add Layer" })).toHaveClass("cloud-add-button");
    expect(screen.getByRole("button", { name: "Add RA" })).toHaveClass("weather-option");
    expect(Array.from(document.querySelectorAll(".taf-output-meta dt"), (node) => node.textContent)).toEqual([
      "STATION", "VALIDITY", "BASE", "CHANGES",
    ]);
    expect(screen.getByTestId("generated-taf").querySelector(".taf-code-keyword")).not.toBeNull();
    expect(screen.getByRole("slider", { name: "Visibility" }).getAttribute("style")).toContain("--visibility-progress: 100%");
    expect(screen.getByText("Maximum 10,000 m")).toBeVisible();
    expect(document.querySelector(".cloud-layers-controls")).not.toContainElement(screen.getByRole("button", { name: "Add Layer" }));
    expect(document.querySelectorAll(".wind-control-group")).toHaveLength(3);
    expect(document.querySelectorAll(".cloud-control-group")).toHaveLength(1);
    const cloudMetadata = document.querySelector(".cloud-metadata-group");
    expect(cloudMetadata).toHaveTextContent("hundreds ft");
    expect(cloudMetadata).toHaveTextContent("CB");
    expect(cloudMetadata).toHaveTextContent("TCU");

    const addLayer = screen.getByRole("button", { name: "Add Layer" });
    fireEvent.click(addLayer);
    fireEvent.click(addLayer);
    expect(document.querySelectorAll(".cloud-layers-controls > .cloud-layer-row")).toHaveLength(3);
    expect(document.querySelector(".cloud-layers-controls")).toHaveClass("cloud-layers-stack");
  });

  it("uses the approved text delete action for a selected change", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select 12Z"));
    fireEvent.click(screen.getByLabelText("Select 14Z"));
    expect(screen.getByRole("button", { name: "Delete change" })).toBeVisible();
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

  it("keeps change blocks masked until explicitly activated", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select 12Z"));
    fireEvent.click(screen.getByLabelText("Select 14Z"));

    const activateWind = screen.getByRole("button", { name: "Activate wind to edit" });
    expect(activateWind.closest(".condition-block")).toHaveClass("is-inactive");
    fireEvent.click(activateWind);
    expect(screen.getByRole("button", { name: "Deactivate wind" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Activate wind to edit" })).not.toBeInTheDocument();
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
      const next = document.querySelector<HTMLButtonElement>(".tour-flight-next");
      expect(next).toBeEnabled();
      fireEvent.click(next!);
      await waitFor(() => expect(document.querySelector(".tour-flight-strip h2")).toHaveTextContent(title));
    }
    expect(document.querySelector(".tour-task-actionable")).not.toBeInTheDocument();
  });
});
