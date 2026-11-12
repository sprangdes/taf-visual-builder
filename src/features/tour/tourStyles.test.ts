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

  it("keeps the flight strip and spotlight stable between tour steps", () => {
    const floaterRule = styles.slice(
      styles.indexOf(".react-joyride__floater:has(.tour-flight-strip)"),
      styles.indexOf(".react-joyride__spotlight", styles.indexOf(".react-joyride__floater:has(.tour-flight-strip)")),
    );

    expect(floaterRule).toContain("opacity: 1 !important;");
    expect(floaterRule).toContain("transition: none !important;");
    expect(styles).toContain(".react-joyride__spotlight path + path {");
    expect(styles).toContain("opacity: 0 !important;");
    expect(styles).toContain("transition: none !important;");
  });

  it("provides a compact touch-enabled mobile tour card", () => {
    expect(styles).toContain("border-radius: 22px; touch-action: none; }");
    expect(styles).toContain(".tour-flight-strip.is-collapsed .tour-flight-strip-inner { display: none; }");
    expect(styles).toContain(".tour-flight-strip.is-collapsed .tour-flight-toggle { height: 44px; }");
  });
});
