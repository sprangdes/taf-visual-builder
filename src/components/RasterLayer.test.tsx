import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RasterLayer from "./RasterLayer";

describe("RasterLayer", () => {
  it("renders a fixed-size canvas inside a scene layer", () => {
    const { container } = render(
      <RasterLayer svg="<svg xmlns='http://www.w3.org/2000/svg'/>" width={800} height={505} className="weather-scene-drift" style={{ opacity: 0.5 }} />,
    );
    const layer = container.firstElementChild as HTMLElement;
    expect(layer).toHaveClass("weather-scene-layer", "weather-scene-drift");
    expect(layer).toHaveStyle({ opacity: "0.5" });
    const canvas = layer.querySelector("canvas")!;
    expect(canvas).toHaveAttribute("width", "800");
    expect(canvas).toHaveAttribute("height", "505");
  });
});
