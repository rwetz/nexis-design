// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { expect, it } from "vitest";
import { applyTheme, clearTheme } from "./applyTheme";
import { exportLumenPalette, importLumenPalette } from "./lumenExchange";
import { getBuiltinTheme } from "./themes";

it("round-trips the portable Lumen v1 palette roles", () => {
  const theme = getBuiltinTheme("halcyon")!;
  applyTheme(theme, "dark");
  try {
    const payload = JSON.stringify(exportLumenPalette(theme.name));
    const colors = theme.variants.dark!.colors!;
    expect(JSON.parse(payload)).toEqual({
      format: "nexis-lumen-palette",
      version: 1,
      palette: {
        name: "Halcyon",
        colors: [colors.background, colors.primary, colors.secondary, colors.muted, colors.foreground],
      },
    });
    const imported = importLumenPalette(JSON.parse(payload));
    expect(imported.variants.dark?.colors).toMatchObject({
      background: colors.background,
      primary: colors.primary,
      foreground: "#ffffff",
      primaryForeground: "#000000",
    });
    applyTheme(imported, "dark");
    // A partial imported theme inherits these roles from globals.css in an app.
    for (const key of ["secondary", "muted"] as const) {
      document.body.style.setProperty(`--${key}`, colors[key]!);
    }
    expect(exportLumenPalette(theme.name).palette.colors.slice(0, 2)).toEqual([colors.background, colors.primary]);
  } finally {
    document.body.style.removeProperty("--secondary");
    document.body.style.removeProperty("--muted");
    clearTheme();
  }
});

it("reads Lumen scene palettes and rejects an unsupported exchange", () => {
  const palette = { name: "Test", colors: ["#ffffff", "#102030"] };
  expect(importLumenPalette({ format: "nexis-lumen-scene", version: 1, palette }).variants.light?.colors)
    .toMatchObject({ background: "#ffffff", foreground: "#000000", primaryForeground: "#ffffff" });
  expect(() => importLumenPalette({ format: "nexis-lumen-scene", version: 2, palette })).toThrow(/version/);
  expect(() => importLumenPalette({ format: "nexis-lumen-palette", version: 1, palette: { ...palette, colors: ["#fff", "blue"] } }))
    .toThrow(/colors/);
});
