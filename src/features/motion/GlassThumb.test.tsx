import { fireEvent, render, screen } from "@testing-library/react";
import { useId, useState } from "react";
import { describe, expect, it } from "vitest";
import { GlassThumb } from "./GlassThumb";
import { MotionProvider } from "./MotionProvider";

function Segment() {
  const [selected, setSelected] = useState("FEW");
  const id = useId();
  return (
    <div className="lg-seg" role="group" aria-label="Amount">
      {["FEW", "SCT", "BKN"].map((amount) => (
        <button key={amount} type="button" aria-pressed={selected === amount} onClick={() => setSelected(amount)}>
          <GlassThumb layoutId={id} show={selected === amount} tint={amount === "BKN" ? "tempo" : undefined} />
          {amount}
        </button>
      ))}
    </div>
  );
}

describe("GlassThumb", () => {
  it("renders a single lens inside the selected option and moves it with the selection", () => {
    const { container } = render(<MotionProvider><Segment /></MotionProvider>);
    const lenses = () => container.querySelectorAll(".lg-thumb");
    expect(lenses()).toHaveLength(1);
    expect(screen.getByRole("button", { name: "FEW" }).querySelector(".lg-thumb")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "BKN" }));
    expect(screen.getByRole("button", { name: "BKN" }).querySelector(".lg-thumb")).toHaveClass("lg-thumb--tempo");
    expect(screen.getByRole("button", { name: "FEW" }).querySelector(".lg-thumb")).toBeNull();
  });

  it("keeps the option's accessible name free of the decorative lens", () => {
    render(<MotionProvider><Segment /></MotionProvider>);
    expect(screen.getByRole("button", { name: "FEW" }).querySelector(".lg-thumb")).toHaveAttribute("aria-hidden", "true");
  });
});
