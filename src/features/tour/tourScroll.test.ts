import { describe, expect, it, vi } from "vitest";
import { centerTourTarget } from "./tourScroll";

describe("centerTourTarget", () => {
  it("smoothly centers the requested target", async () => {
    const target = document.createElement("div");
    const scrollIntoView = vi.fn();
    target.setAttribute("data-tour-id", "wind");
    target.scrollIntoView = scrollIntoView;
    document.body.append(target);

    await centerTourTarget('[data-tour-id="wind"]');

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    target.remove();
  });

  it("does not reject when the environment cannot scroll elements", async () => {
    const target = document.createElement("div");
    target.setAttribute("data-tour-id", "clouds");
    document.body.append(target);

    await expect(centerTourTarget('[data-tour-id="clouds"]')).resolves.toBeUndefined();
    target.remove();
  });
});
