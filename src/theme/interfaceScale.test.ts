import { describe, expect, it } from "vitest";
import {
  AUTO_QUANTUM,
  AUTO_RANGE,
  autoInterfaceScale,
  clampInterfaceAdjust,
  INTERFACE_SCALE_RANGE,
  interfaceScaleLabel,
  parseInterfaceAdjust,
  parseInterfaceSize,
  resolveInterfaceScale,
  stepInterfaceAdjust,
  stepInterfaceScale,
} from "./interfaceScale";

describe("interface scale", () => {
  it("is 100% at the reference window and grows continuously with it (RULES R2.2)", () => {
    expect(autoInterfaceScale(1440, 900)).toBe(1);
    const sizes = [
      [1280, 800],
      [1440, 900],
      [1920, 1080],
      [2560, 1440],
      [3840, 2160],
    ] as const;
    const scales = sizes.map(([w, h]) => autoInterfaceScale(w, h));
    for (let i = 1; i < scales.length; i++) expect(scales[i]).toBeGreaterThan(scales[i - 1]);
    // No hand-picked screens: a 4K window lands between 150% and 200%, a
    // 1080p one a little over 100%, a small laptop window a little under.
    expect(autoInterfaceScale(3840, 2160)).toBeGreaterThan(1.5);
    expect(autoInterfaceScale(3840, 2160)).toBeLessThanOrEqual(AUTO_RANGE.max);
    expect(autoInterfaceScale(1920, 1080)).toBeGreaterThan(1);
    expect(autoInterfaceScale(1920, 1080)).toBeLessThan(1.2);
    expect(autoInterfaceScale(1280, 800)).toBeLessThan(1);
  });

  it("follows the tighter of width and height", () => {
    // A very wide, short window is sized by its height.
    expect(autoInterfaceScale(3840, 900)).toBe(1);
    expect(autoInterfaceScale(1440, 2400)).toBe(1);
  });

  it("stays in range and moves in quanta", () => {
    expect(autoInterfaceScale(400, 300)).toBe(AUTO_RANGE.min);
    expect(autoInterfaceScale(20000, 12000)).toBe(AUTO_RANGE.max);
    const s = autoInterfaceScale(2100, 1300);
    expect(Math.abs(s / AUTO_QUANTUM - Math.round(s / AUTO_QUANTUM))).toBeLessThan(1e-6);
    expect(autoInterfaceScale(0, 0)).toBe(1);
  });

  it("holds the previous value while the raw value stays within a quantum", () => {
    const at = autoInterfaceScale(2000, 1250);
    expect(autoInterfaceScale(2006, 1254, at)).toBe(at);
    expect(autoInterfaceScale(3000, 1900, at)).not.toBe(at);
  });

  it("multiplies Auto by the adjustment, and leaves a fixed size alone", () => {
    expect(resolveInterfaceScale("auto", 1.2, 1)).toBe(1.2);
    expect(resolveInterfaceScale("auto", 1.2, 1.25)).toBe(1.5);
    expect(resolveInterfaceScale(1.3, 1.2, 1.25)).toBe(1.3);
    expect(resolveInterfaceScale("auto", 2, 1.5)).toBe(INTERFACE_SCALE_RANGE.max);
    expect(clampInterfaceAdjust(9)).toBe(1.5);
    expect(clampInterfaceAdjust(Number.NaN)).toBe(1);
  });

  it("steps by 5% on the grid and clamps", () => {
    expect(stepInterfaceScale(1, 1)).toBe(1.05);
    expect(stepInterfaceScale(1.125, 1)).toBe(1.2);
    expect(stepInterfaceScale(INTERFACE_SCALE_RANGE.max, 1)).toBe(INTERFACE_SCALE_RANGE.max);
    expect(stepInterfaceScale(INTERFACE_SCALE_RANGE.min, -1)).toBe(INTERFACE_SCALE_RANGE.min);
    expect(stepInterfaceAdjust(1, -1)).toBe(0.95);
  });

  it("reads what it stored, including the old steps, and anything else as Auto", () => {
    expect(parseInterfaceSize("1.25")).toBe(1.25);
    expect(parseInterfaceSize("1.125")).toBe(1.125);
    expect(parseInterfaceSize("1.37")).toBe(1.37);
    expect(parseInterfaceSize("auto")).toBe("auto");
    expect(parseInterfaceSize("9")).toBe("auto");
    expect(parseInterfaceSize("")).toBe("auto");
    expect(parseInterfaceSize(null)).toBe("auto");
    expect(parseInterfaceAdjust(null)).toBe(1);
    expect(parseInterfaceAdjust("1.1")).toBe(1.1);
    expect(parseInterfaceAdjust("x")).toBe(1);
  });

  it("labels scales as whole percents", () => {
    expect(interfaceScaleLabel(1.125)).toBe("113%");
    expect(interfaceScaleLabel(1.5)).toBe("150%");
  });
});
