import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TafBuilder from "./TafBuilder";

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
    expect(document.querySelector(".cloud-layers-controls")).toContainElement(screen.getByRole("button", { name: "Add Layer" }));
  });

  it("uses the approved text delete action for a selected change", () => {
    render(<TafBuilder />);
    fireEvent.click(screen.getByLabelText("Select 12Z"));
    fireEvent.click(screen.getByLabelText("Select 14Z"));
    expect(screen.getByRole("button", { name: "Delete change" })).toBeVisible();
  });
});
