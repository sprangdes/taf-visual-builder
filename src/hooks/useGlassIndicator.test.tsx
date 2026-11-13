import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGlassIndicator } from "./useGlassIndicator";

const OPTIONS = ["A", "B", "C"];

function Segment() {
  const [selected, setSelected] = useState("A");
  const ref = useGlassIndicator<HTMLDivElement>(selected);
  return (
    <div ref={ref} data-testid="segment" className="lg-seg">
      {OPTIONS.map((option, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={selected === option}
          // jsdom has no layout: give each option a fake 50px slot.
          ref={(node) => {
            if (node) Object.defineProperties(node, { offsetLeft: { value: index * 50, configurable: true }, offsetWidth: { value: 48, configurable: true }, offsetHeight: { value: 30, configurable: true }, offsetTop: { value: 2, configurable: true } });
          }}
          onClick={() => setSelected(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

describe("useGlassIndicator", () => {
  afterEach(() => vi.useRealTimers());

  it("places the thumb on the selected option without animating the first time", async () => {
    render(<Segment />);
    const segment = screen.getByTestId("segment");
    expect(segment.style.getPropertyValue("--ind-x")).toBe("0px");
    expect(segment.style.getPropertyValue("--ind-w")).toBe("48px");
    expect(segment.style.getPropertyValue("--ind-h")).toBe("30px");
    expect(segment).not.toHaveClass("is-moving");
    await act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
    expect(segment).toHaveClass("is-ready");
  });

  it("slides to a new option and marks the move so the lens can stretch", () => {
    vi.useFakeTimers();
    render(<Segment />);
    const segment = screen.getByTestId("segment");
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(segment.style.getPropertyValue("--ind-x")).toBe("100px");
    expect(segment).toHaveClass("is-moving");
    act(() => vi.advanceTimersByTime(500));
    expect(segment).not.toHaveClass("is-moving");
  });
});
