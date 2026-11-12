import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { act, fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTour } from "./TourContext";
import { TourProvider } from "./TourProvider";
import { LanguageProvider } from "../i18n/LanguageProvider";
function render(node) {
    return rtlRender(_jsx(LanguageProvider, { children: node }));
}
const joyride = vi.hoisted(() => ({ props: null }));
vi.mock("react-joyride", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Joyride: (props) => {
            joyride.props = props;
            return _jsx("div", { "data-testid": "joyride-mock", "data-running": String(props.run) });
        },
    };
});
function Harness() {
    const tour = useTour();
    return (_jsxs("div", { children: [_jsx("button", { onClick: () => tour.startTour("quick-start"), children: "Start quick" }), _jsx("button", { onClick: () => tour.startTour("topic-output"), children: "Start topic" }), _jsx("button", { onClick: tour.toggleCollapsed, children: "Toggle card" }), _jsx("span", { children: tour.isRunning ? "running" : "idle" })] }));
}
function adapter() {
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
    it("loads the tour engine only after a tour starts", async () => {
        render(_jsx(TourProvider, { editor: adapter(), children: _jsx(Harness, {}) }));
        expect(screen.queryByTestId("joyride-mock")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Start topic" }));
        expect(await screen.findByTestId("joyride-mock")).toHaveAttribute("data-running", "true");
    });
    it("loads demo data with passive steps", async () => {
        const editor = adapter();
        render(_jsx(TourProvider, { editor: editor, children: _jsx(Harness, {}) }));
        fireEvent.click(screen.getByRole("button", { name: "Start quick" }));
        await screen.findByTestId("joyride-mock");
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
    it("asks whether to restore the snapshot after quick start", async () => {
        const editor = adapter();
        render(_jsx(TourProvider, { editor: editor, children: _jsx(Harness, {}) }));
        fireEvent.click(screen.getByRole("button", { name: "Start quick" }));
        await screen.findByTestId("joyride-mock");
        act(() => joyride.props?.onEvent?.({ type: "tour:end", status: "finished" }, {}));
        fireEvent.click(screen.getByRole("button", { name: "Restore my forecast" }));
        expect(editor.restore).toHaveBeenCalledOnce();
        expect(screen.getByText("idle")).toBeVisible();
    });
    it("skips missing targets without ending a focused tour", async () => {
        const editor = adapter();
        const next = vi.fn();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        render(_jsx(TourProvider, { editor: editor, children: _jsx(Harness, {}) }));
        fireEvent.click(screen.getByRole("button", { name: "Start topic" }));
        await screen.findByTestId("joyride-mock");
        act(() => joyride.props?.onEvent?.({ type: "error:target_not_found", step: { id: "generated-output" } }, { next }));
        expect(next).toHaveBeenCalledOnce();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("generated-output"));
        expect(editor.loadDemo).not.toHaveBeenCalled();
        warn.mockRestore();
    });
    it("temporarily hides the mobile overlay without ending the tour", async () => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = vi.fn().mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        render(_jsx(TourProvider, { editor: adapter(), children: _jsx(Harness, {}) }));
        fireEvent.click(screen.getByRole("button", { name: "Start topic" }));
        await screen.findByTestId("joyride-mock");
        expect(joyride.props?.options?.hideOverlay).toBe(false);
        fireEvent.click(screen.getByRole("button", { name: "Toggle card" }));
        expect(joyride.props?.options?.hideOverlay).toBe(true);
        expect(screen.getByText("running")).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: "Toggle card" }));
        expect(joyride.props?.options?.hideOverlay).toBe(false);
        window.matchMedia = originalMatchMedia;
    });
});
