import { act, fireEvent, render as rtlRender, screen } from "@testing-library/react";
import type { EventData, Props as JoyrideProps } from "react-joyride";
import { describe, expect, it, vi } from "vitest";
import type { TourEditorAdapter } from "./types";
import { useTour } from "./TourContext";
import { TourProvider } from "./TourProvider";
import { LanguageProvider } from "../i18n/LanguageProvider";

function render(node: React.ReactNode) {
  return rtlRender(<LanguageProvider>{node}</LanguageProvider>);
}

const joyride = vi.hoisted(() => ({ props: null as JoyrideProps | null }));

vi.mock("react-joyride", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-joyride")>();
  return {
    ...actual,
    Joyride: (props: JoyrideProps) => {
      joyride.props = props;
      return <div data-testid="joyride-mock" data-running={String(props.run)} />;
    },
  };
});

function Harness() {
  const tour = useTour();
  return (
    <div>
      <button onClick={() => tour.startTour("quick-start")}>Start quick</button>
      <button onClick={() => tour.startTour("topic-output")}>Start topic</button>
      <button onClick={tour.toggleCollapsed}>Toggle card</button>
      <span>{tour.isRunning ? "running" : "idle"}</span>
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
  };
}

describe("TourProvider", () => {
  it("loads demo data with passive steps", () => {
    const editor = adapter();
    render(<TourProvider editor={editor}><Harness /></TourProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Start quick" }));
    expect(editor.capture).toHaveBeenCalledOnce();
    expect(editor.loadDemo).toHaveBeenCalledOnce();
    expect(screen.getByText("running")).toBeVisible();
    expect(joyride.props?.options?.overlayClickAction).toBe(false);
    expect(joyride.props?.steps.find((step) => step.id === "create-change")?.data).toEqual({
      id: "create-change",
      isMobile: false,
    });
    const contextStep = joyride.props?.steps.find((step) => step.id === "forecast-context");
    expect(contextStep?.skipScroll).toBe(true);
    expect(contextStep?.isFixed).toBeUndefined();
    expect(contextStep?.before).toEqual(expect.any(Function));
  });

  it("asks whether to restore the snapshot after quick start", () => {
    const editor = adapter();
    render(<TourProvider editor={editor}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start quick" }));

    act(() => joyride.props?.onEvent?.({ type: "tour:end", status: "finished" } as EventData, {} as never));
    fireEvent.click(screen.getByRole("button", { name: "Restore my forecast" }));

    expect(editor.restore).toHaveBeenCalledOnce();
    expect(screen.getByText("idle")).toBeVisible();
  });

  it("skips missing targets without ending a focused tour", () => {
    const editor = adapter();
    const next = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<TourProvider editor={editor}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start topic" }));

    act(() => joyride.props?.onEvent?.({ type: "error:target_not_found", step: { id: "generated-output" } } as EventData, { next } as never));

    expect(next).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("generated-output"));
    expect(editor.loadDemo).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("temporarily hides the mobile overlay without ending the tour", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    render(<TourProvider editor={adapter()}><Harness /></TourProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Start topic" }));

    expect(joyride.props?.options?.hideOverlay).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Toggle card" }));
    expect(joyride.props?.options?.hideOverlay).toBe(true);
    expect(screen.getByText("running")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Toggle card" }));
    expect(joyride.props?.options?.hideOverlay).toBe(false);

    window.matchMedia = originalMatchMedia;
  });
});
