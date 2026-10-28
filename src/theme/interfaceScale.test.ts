import { describe, expect, it } from "vitest";
import { autoInterfaceScale, HYSTERESIS, interfaceScaleLabel, parseInterfaceSize, stepInterfaceScale } from "./interfaceScale";

describe("interface scale", () => {
  it("steps with the window's CSS width (RULES R2.2)", () => {
    expect(autoInterfaceScale(1024)).toBe(1);
    expect(autoInterfaceScale(1599)).toBe(1);
    expect(autoInterfaceScale(1600)).toBe(1.125);
    expect(autoInterfaceScale(1920)).toBe(1.125);
    expect(autoInterfaceScale(2560)).toBe(1.25); // 4K at 150% OS scale
    expect(autoInterfaceScale(3840)).toBe(1.5); // 4K at 100%
  });

  it("holds a step until the window is well back under its boundary", () => {
    expect(autoInterfaceScale(1600 - HYSTERESIS + 1, 1.125)).toBe(1.125);
    expect(autoInterfaceScale(1600 - HYSTERESIS - 1, 1.125)).toBe(1);
    expect(autoInterfaceScale(2200 - 10, 1.25)).toBe(1.25);
    // Growing ignores hysteresis: crossing the boundary steps up at once.
    expect(autoInterfaceScale(2200, 1.125)).toBe(1.25);
    // Hysteresis only spans one step: a big drop goes straight down.
    expect(autoInterfaceScale(1200, 1.5)).toBe(1);
  });

  it("steps and clamps the setting", () => {
    expect(stepInterfaceScale(1, 1)).toBe(1.125);
    expect(stepInterfaceScale(1.5, 1)).toBe(1.5);
    expect(stepInterfaceScale(1, -1)).toBe(1);
  });

  it("reads what it stored, and anything else as Auto", () => {
    expect(parseInterfaceSize("1.25")).toBe(1.25);
    expect(parseInterfaceSize("auto")).toBe("auto");
    expect(parseInterfaceSize("2")).toBe("auto");
    expect(parseInterfaceSize(null)).toBe("auto");
  });

  it("labels steps as whole percents", () => {
    expect(interfaceScaleLabel(1.125)).toBe("112%");
    expect(interfaceScaleLabel(1.5)).toBe("150%");
  });
});
