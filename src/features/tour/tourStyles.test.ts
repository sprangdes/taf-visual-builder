import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync("src/index.css", "utf8");

describe("guided tour responsive styles", () => {
  it("keeps the tour menu inside the mobile viewport", () => {
    const mobileStart = styles.indexOf("@media (max-width: 639px)");
    const mobileEnd = styles.indexOf("@media (prefers-reduced-motion: reduce)", mobileStart);
    const mobileStyles = styles.slice(mobileStart, mobileEnd);

    expect(mobileStyles).toContain(".tour-menu {");
    expect(mobileStyles).toContain("position: fixed;");
    expect(mobileStyles).toContain("top: 72px;");
    expect(mobileStyles).toContain("left: 12px;");
    expect(mobileStyles).toContain("right: 12px;");
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
});
