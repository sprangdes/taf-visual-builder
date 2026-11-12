import { act, fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TourEditorAdapter } from "./types";
import { useTour } from "./TourContext";
import { TourProvider } from "./TourProvider";
import { LanguageProvider } from "../i18n/LanguageProvider";

const TARGETS = ["context", "base-editor", "wind", "visibility", "clouds", "timeline", "selected-change", "change-type", "output"];

function render(node: React.ReactNode) {
  return rtlRender(<LanguageProvider>{node}</LanguageProvider>);
}

function Harness({ targets = TARGETS }: { targets?: string[] }) {
  const tour = useTour();
  return (
    <div>
      <button onClick={() => tour.startTour("quick-start")}>Start quick</button>
      <button onClick={() => tour.startTour("topic-output")}>Start topic</button>
      <button onClick={() => tour.startTour("topic-timeline")}>Start timeline</button>
      <span>{tour.isRunning ? "running" : "idle"}</span>
      {targets.map((id) => <div key={id} data-tour-id={id} />)}
    </div>
  );
}

function adapter(): TourEditorAdapter {
  return {
    capture: vi.fn(() => ({
      taf: { station: "RCSS", issueTime: "031100", base: { wind: { dir: 0, speed: 0, gust: null }, visibility: 10000, weather: [], clouds: [] }, changes: [] },
      selectedChangeIndex: null,
    })),
    loadDemo: vi.fn(),
    restore: vi.fn(),
    selectPeriod: vi.fn(),
  };
}

const stepTitle = () => document.querySelector("#tour-step-title")?.textContent;

describe("TourProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the first step of the chosen tour", async () => {
    render(<TourProvider editor={adapter()}><Harness /></TourProvider>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start topic" }));
    expect(await screen.findByRole("dialog", { name: "Generated TAF" })).toBeVisible();
    expect(screen.getByText("01 / 01")).toBeVisible();
    expect(screen.getByRole("button", { name: "Done" })).toHaveFocus();
  });

  it("loads demo data and selects the period each step explains", async () => {
    const editor = adapter();
    render(<TourProvider editor={editor}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start quick" }));
    expect(editor.capture).toHaveBeenCalledOnce();
    expect(editor.loadDemo).toHaveBeenCalledOnce();
    await waitFor(() => expect(stepTitle()).toBe("Forecast context"));
    expect(editor.selectPeriod).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(stepTitle()).toBe("Base forecast"));
    expect(editor.selectPeriod).toHaveBeenLastCalledWith("base");

    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(stepTitle()).toBe("Create a change period"));
    expect(editor.selectPeriod).toHaveBeenLastCalledWith("change");
  });

  it("loads the demo for change-period tours only when there is no change to show", async () => {
    const editor = adapter();
    render(<TourProvider editor={editor}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start topic" }));
    await screen.findByRole("dialog");
    expect(editor.loadDemo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Start timeline" }));
    expect(editor.loadDemo).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(await screen.findByRole("dialog", { name: "Keep the demonstration forecast?" })).toBeVisible();
  });

  it("moves with the arrow keys and closes with Escape", async () => {
    render(<TourProvider editor={adapter()}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start timeline" }));
    await waitFor(() => expect(stepTitle()).toBe("Create a change period"));
    fireEvent.keyDown(document, { key: "ArrowRight" });
    await waitFor(() => expect(stepTitle()).toBe("Selected change"));
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    await waitFor(() => expect(stepTitle()).toBe("Create a change period"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector("#tour-step-title")).toBeNull();
    expect(screen.getByText("idle")).toBeVisible();
  });

  it("asks whether to restore the snapshot after quick start", async () => {
    const editor = adapter();
    render(<TourProvider editor={editor}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start quick" }));
    fireEvent.click(await screen.findByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Restore my forecast" }));

    expect(editor.restore).toHaveBeenCalledOnce();
    expect(screen.getByText("idle")).toBeVisible();
  });

  it("finishes after the last step", async () => {
    render(<TourProvider editor={adapter()}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start topic" }));
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    expect(screen.getByText("idle")).toBeVisible();
  });

  it("skips steps whose target never appears", async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<TourProvider editor={adapter()}><Harness targets={["timeline", "change-type"]} /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start timeline" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(stepTitle()).toBe("Create a change period");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("selected-change"));
    expect(stepTitle()).toBe("Change type");
    vi.useRealTimers();
  });

  it("keeps the tour running while the mobile card is collapsed", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    render(<TourProvider editor={adapter()}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start topic" }));
    fireEvent.click(await screen.findByRole("button", { name: "Collapse guided tour" }));
    expect(screen.getByRole("dialog")).toHaveClass("is-collapsed");
    expect(screen.getByText("running")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Expand guided tour" }));
    expect(screen.getByRole("dialog")).not.toHaveClass("is-collapsed");
  });
});
