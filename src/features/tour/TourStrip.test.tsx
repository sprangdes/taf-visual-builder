import { fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TourStrip from "./TourStrip";
import { LanguageProvider } from "../i18n/LanguageProvider";

function renderStrip(overrides: Partial<React.ComponentProps<typeof TourStrip>> = {}) {
  const props: React.ComponentProps<typeof TourStrip> = {
    index: 2,
    size: 9,
    title: "Create a change period",
    content: "Select a start and end hour.",
    isMobile: true,
    isCollapsed: false,
    onToggleCollapsed: vi.fn(),
    onBack: vi.fn(),
    onNext: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  rtlRender(<LanguageProvider><TourStrip {...props} /></LanguageProvider>);
  return props;
}

describe("TourStrip", () => {
  it("renders accessible progress and navigation", () => {
    const props = renderStrip();
    expect(screen.getByRole("dialog", { name: "Create a change period" })).toHaveClass("tour-flight-strip");
    expect(screen.getByText("03 / 09")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(props.onBack).toHaveBeenCalledOnce();
    expect(props.onNext).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("shows Done instead of Next and Skip on the last step", () => {
    renderStrip({ index: 8 });
    expect(screen.getByRole("button", { name: "Done" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
  });

  it("hides Back on the first step", () => {
    renderStrip({ index: 0 });
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("collapses from the mobile button or a downward swipe", () => {
    const props = renderStrip();
    const toggle = screen.getByRole("button", { name: "Collapse guided tour" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);

    const card = screen.getByRole("dialog");
    fireEvent.pointerDown(card, { clientX: 100, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 105, clientY: 75, pointerId: 1 });
    expect(props.onToggleCollapsed).toHaveBeenCalledTimes(2);
  });

  it("expands a collapsed card from the button or an upward swipe", () => {
    const props = renderStrip({ isCollapsed: true });
    const card = screen.getByRole("dialog");
    expect(card).toHaveClass("is-collapsed");
    fireEvent.click(screen.getByRole("button", { name: "Expand guided tour" }));
    fireEvent.pointerDown(card, { clientX: 100, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 104, clientY: 25, pointerId: 1 });
    expect(props.onToggleCollapsed).toHaveBeenCalledTimes(2);
  });

  it("has no mobile toggle on desktop", () => {
    renderStrip({ isMobile: false });
    expect(screen.queryByRole("button", { name: "Collapse guided tour" })).not.toBeInTheDocument();
  });
});
