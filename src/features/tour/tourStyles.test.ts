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
});
