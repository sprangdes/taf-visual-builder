import { describe, expect, it } from "vitest";
import { cloneTourSnapshot, createTourDemoTaf } from "./tourDemo";

describe("tour demo state", () => {
  it("creates an RCTP demo with one selected change", () => {
    const demo = createTourDemoTaf("031100");
    expect(demo.station).toBe("RCTP");
    expect(demo.issueTime).toBe("031100");
    expect(demo.changes).toHaveLength(1);
  });

  it("deep-clones snapshots", () => {
    const source = { taf: createTourDemoTaf("031100"), selectedChangeIndex: 0 };
    const clone = cloneTourSnapshot(source);
    clone.taf.station = "RCSS";
    clone.taf.base.clouds[0].height = 99;

    expect(source.taf.station).toBe("RCTP");
    expect(source.taf.base.clouds[0].height).toBe(20);
  });
});
