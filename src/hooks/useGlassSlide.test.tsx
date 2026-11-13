import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGlassSlide } from "./useGlassSlide";

const OPTIONS = ["FEW", "SCT", "OVC"];
const SLOT = 50;

function Segment() {
  const [selected, setSelected] = useState("FEW");
  const ref = useGlassSlide<HTMLDivElement>(selected);
  return (
    <div ref={ref} className="lg-seg" data-testid="segment">
      <span className="lg-thumb" data-testid="thumb"><span className="lg-thumb-glass" data-testid="glass" /></span>
      {OPTIONS.map((option, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={selected === option}
          ref={(node) => {
            if (node) Object.defineProperties(node, { offsetLeft: { value: index * SLOT, configurable: true }, offsetTop: { value: 2, configurable: true }, offsetWidth: { value: 40 + index * 10, configurable: true }, offsetHeight: { value: 30, configurable: true } });
          }}
          onClick={() => setSelected(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

describe("useGlassSlide", () => {
  let animate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    animate = vi.fn(() => ({ cancel: vi.fn() }));
    HTMLElement.prototype.animate = animate as unknown as HTMLElement["animate"];
    HTMLElement.prototype.getAnimations = () => [];
    // jsdom has no layout: report the lens box from the inline position the hook writes.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const left = Number.parseFloat(this.style.left) || 0;
      const width = Number.parseFloat(this.style.width) || 0;
      return { left, top: 2, width, height: 30, right: left + width, bottom: 32, x: left, y: 2, toJSON: () => ({}) } as DOMRect;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("places the lens on the selected option without animating on first render", () => {
    render(<Segment />);
    const thumb = screen.getByTestId("thumb");
    expect(thumb.style.left).toBe("0px");
    expect(thumb.style.width).toBe("40px");
    expect(thumb.style.height).toBe("30px");
    expect(thumb.style.opacity).toBe("1");
    expect(animate).not.toHaveBeenCalled();
  });

  it("slides from the old option with a transform-only animation and swells the glass", () => {
    render(<Segment />);
    fireEvent.click(screen.getByRole("button", { name: "OVC" }));
    const thumb = screen.getByTestId("thumb");
    expect(thumb.style.left).toBe("100px");
    expect(thumb.style.width).toBe("60px");

    const [slide, swell] = animate.mock.calls;
    expect(slide[0]).toEqual([{ transform: "translate(-100px, 0px) scale(0.6666666666666666, 1)" }, { transform: "none" }]);
    expect(swell[0][1]).toEqual({ transform: "none" });
    for (const [keyframes] of animate.mock.calls) {
      for (const frame of keyframes as Keyframe[]) expect(Object.keys(frame)).toEqual(["transform"]);
    }
  });
});
