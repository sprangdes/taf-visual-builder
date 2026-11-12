import { jsx as _jsx } from "react/jsx-runtime";
import { fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FlightStripTooltip from "./FlightStripTooltip";
import { TourContext } from "./TourContext";
import { LanguageProvider } from "../i18n/LanguageProvider";
function render(node, context = {}) {
    const value = {
        startTour: vi.fn(),
        isRunning: true,
        isMobile: true,
        isCollapsed: false,
        toggleCollapsed: vi.fn(),
        ...context,
    };
    return rtlRender(_jsx(LanguageProvider, { children: _jsx(TourContext.Provider, { value: value, children: node }) }));
}
function props() {
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
    };
}
describe("FlightStripTooltip", () => {
    it("renders accessible progress and navigation", () => {
        render(_jsx(FlightStripTooltip, { ...props() }));
        expect(screen.getByRole("alertdialog")).toHaveClass("tour-flight-strip");
        expect(screen.getByText("03 / 09")).toBeVisible();
        expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
        expect(screen.getByRole("button", { name: "Back" })).toBeVisible();
        expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    });
    it("keeps next available without an editor action", () => {
        render(_jsx(FlightStripTooltip, { ...props() }));
        expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
        expect(screen.queryByText("Complete the highlighted action to continue.")).not.toBeInTheDocument();
    });
    it("collapses from the mobile button or a downward swipe", () => {
        const toggleCollapsed = vi.fn();
        render(_jsx(FlightStripTooltip, { ...props() }), { toggleCollapsed });
        const toggle = screen.getByRole("button", { name: "Collapse guided tour" });
        expect(toggle).toHaveAttribute("aria-expanded", "true");
        fireEvent.click(toggle);
        expect(toggleCollapsed).toHaveBeenCalledTimes(1);
        const card = screen.getByRole("alertdialog");
        fireEvent.pointerDown(card, { clientX: 100, clientY: 20, pointerId: 1 });
        fireEvent.pointerUp(card, { clientX: 105, clientY: 75, pointerId: 1 });
        expect(toggleCollapsed).toHaveBeenCalledTimes(2);
    });
    it("expands a collapsed card from the button or an upward swipe", () => {
        const toggleCollapsed = vi.fn();
        render(_jsx(FlightStripTooltip, { ...props() }), { isCollapsed: true, toggleCollapsed });
        const card = screen.getByRole("alertdialog");
        expect(card).toHaveClass("is-collapsed");
        const toggle = screen.getByRole("button", { name: "Expand guided tour" });
        expect(toggle).toHaveAttribute("aria-expanded", "false");
        fireEvent.click(toggle);
        fireEvent.pointerDown(card, { clientX: 100, clientY: 80, pointerId: 1 });
        fireEvent.pointerUp(card, { clientX: 104, clientY: 25, pointerId: 1 });
        expect(toggleCollapsed).toHaveBeenCalledTimes(2);
    });
});
