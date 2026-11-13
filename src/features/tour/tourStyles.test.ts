import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync("src/index.css", "utf8");

describe("guided tour responsive styles", () => {
  it("keeps the tour menu inside the mobile viewport", () => {
    const mobileStart = styles.indexOf("@media (max-width: 639px)");
    const mobileEnd = styles.indexOf("@media (prefers-reduced-motion: reduce)", mobileStart);
    const mobileStyles = styles.slice(mobileStart, mobileEnd);

    expect(mobileStyles).toContain(".tour-menu {");
    expect(mobileStyles).toContain(".tour-menu-root { position: static; }");
    expect(mobileStyles).toContain("position: absolute;");
    expect(mobileStyles).toContain("top: calc(100% + 8px);");
    expect(mobileStyles).toContain("left: 0;");
    expect(mobileStyles).toContain("right: 0;");
    expect(mobileStyles).toContain("width: auto;");
    expect(mobileStyles).toContain("max-height: calc(100dvh - 84px);");
    expect(mobileStyles).toContain("overflow-y: auto;");
  });

  it("dims everything except the spotlighted target without blocking the page", () => {
    const spotlight = styles.slice(styles.indexOf(".tour-spotlight {"), styles.indexOf("}", styles.indexOf(".tour-spotlight {")));
    expect(spotlight).toContain("position: fixed;");
    expect(spotlight).toContain("pointer-events: none;");
    expect(spotlight).toContain("200vmax");
    expect(styles).toContain(".tour-spotlight.is-undimmed { box-shadow: 0 0 0 2px rgb(255 255 255 / 85%); }");
  });

  it("provides a compact touch-enabled mobile tour card", () => {
    expect(styles).toContain("border-radius: 22px; touch-action: none; }");
    expect(styles).toContain(".tour-flight-strip.is-collapsed .tour-flight-strip-inner { display: none; }");
    expect(styles).toContain(".tour-flight-strip.is-collapsed .tour-flight-toggle { height: 44px; }");
  });
});
