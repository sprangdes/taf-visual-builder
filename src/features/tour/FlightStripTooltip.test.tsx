import { render as rtlRender, screen } from "@testing-library/react";
import type { TooltipRenderProps } from "react-joyride";
import { describe, expect, it, vi } from "vitest";
import FlightStripTooltip from "./FlightStripTooltip";
import { LanguageProvider } from "../i18n/LanguageProvider";

function render(node: React.ReactNode) {
  return rtlRender(<LanguageProvider>{node}</LanguageProvider>);
}

function props(): TooltipRenderProps {
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
      target: '[data-tour-id="timeline"]',
      title: "Create a change period",
    },
    tooltipProps: { "aria-modal": true, ref: vi.fn(), role: "alertdialog" },
  } as unknown as TooltipRenderProps;
}

describe("FlightStripTooltip", () => {
  it("renders accessible progress and navigation", () => {
    render(<FlightStripTooltip {...props()} />);
    expect(screen.getByRole("alertdialog")).toHaveClass("tour-flight-strip");
    expect(screen.getByText("03 / 09")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Back" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("keeps next available without an editor action", () => {
    render(<FlightStripTooltip {...props()} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(screen.queryByText("Complete the highlighted action to continue.")).not.toBeInTheDocument();
  });
});
