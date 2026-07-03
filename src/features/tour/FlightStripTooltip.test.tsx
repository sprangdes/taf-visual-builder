import { render, screen } from "@testing-library/react";
import type { TooltipRenderProps } from "react-joyride";
import { describe, expect, it, vi } from "vitest";
import FlightStripTooltip from "./FlightStripTooltip";
import { TourContext } from "./TourContext";

function props(locked: boolean): TooltipRenderProps {
  return {
    backProps: { "aria-label": "Back", onClick: vi.fn(), role: "button", title: "Back" },
    closeProps: { "aria-label": "Close", onClick: vi.fn(), role: "button", title: "Close" },
    continuous: true,
    index: 2,
    isLastStep: false,
    primaryProps: { "aria-label": "Next", onClick: vi.fn(), role: "button", title: "Next" },
    skipProps: { "aria-label": "Skip", onClick: vi.fn(), role: "button", title: "Skip" },
    size: 9,
    step: {
      content: "Select a start and end hour.",
      data: { taskEvent: locked ? "timeline-range-created" : undefined, isMobile: false },
      target: '[data-tour-id="timeline"]',
      title: "Create a change period",
    },
    tooltipProps: { "aria-modal": true, ref: vi.fn(), role: "alertdialog" },
  } as unknown as TooltipRenderProps;
}

describe("FlightStripTooltip", () => {
  const renderTooltip = (locked: boolean) => render(
    <TourContext.Provider value={{
      isRunning: true,
      isTaskComplete: () => !locked,
      notifyTask: vi.fn(),
      startTour: vi.fn(),
    }}>
      <FlightStripTooltip {...props(locked)} />
    </TourContext.Provider>,
  );

  it("renders accessible progress and navigation", () => {
    renderTooltip(false);
    expect(screen.getByRole("alertdialog")).toHaveClass("tour-flight-strip");
    expect(screen.getByText("03 / 09")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Back" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("locks the next action for incomplete desktop tasks", () => {
    renderTooltip(true);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByText("Complete the highlighted action to continue.")).toBeVisible();
  });
});
