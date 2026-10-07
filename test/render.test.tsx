// Smoke: every template and every gallery page mounts inside the provider
// without throwing. Catches a missing export, a hook outside its provider, a
// bad prop — the failures that otherwise only show up when someone opens the
// screen.
import { render } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it } from "vitest";
import { ThemeProvider, TooltipProvider } from "../src";
import Console from "../templates/console";
import Dashboard from "../templates/dashboard";
import Explorer from "../templates/explorer";
import Minimal from "../templates/minimal";
import Settings from "../templates/settings";
import Wizard from "../templates/wizard";
import Workbench from "../templates/workbench";
import { Cheatsheet } from "./cheatsheet";

function mount(C: React.ComponentType) {
  return render(
    <ThemeProvider storageKey="test">
      <TooltipProvider>
        <C />
      </TooltipProvider>
    </ThemeProvider>,
  );
}

describe("templates mount", () => {
  it.each([
    ["dashboard", Dashboard],
    ["workbench", Workbench],
    ["settings", Settings],
    ["explorer", Explorer],
    ["console", Console],
    ["wizard", Wizard],
    ["minimal", Minimal],
  ] as const)("%s", (_name, C) => {
    const { container, unmount } = mount(C);
    expect(container.querySelector('[data-slot="title-bar"]')).not.toBeNull();
    unmount();
  });
});

describe("AGENTS.md cheat sheet", () => {
  it("mounts", () => {
    const { unmount } = mount(Cheatsheet);
    unmount();
  });
});

describe("theme engine", () => {
  it("applies a theme as inline variables and clears it for the default", async () => {
    const { applyTheme, clearTheme, getBuiltinTheme } = await import("../src");
    applyTheme(getBuiltinTheme("aurelian")!, "dark");
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--background")).toBe("#15110c");
    expect(root.style.getPropertyValue("--brand")).toBe("#e5a323");
    clearTheme();
    expect(root.style.getPropertyValue("--background")).toBe("");
  });
});

describe("0.1.x compatibility", () => {
  it("keeps the names nexis-atlas imports", async () => {
    const pkg = await import("../src");
    for (const name of ["spring", "useTheme", "BUILTIN_THEMES", "IS_MAC", "ResizeHandles", "ThemeProvider", "WindowControls", "USE_CUSTOM_WINDOW_CONTROLS", "cn"]) {
      expect(pkg, name).toHaveProperty(name);
    }
    const tokens = await import("../src/styles/tokens");
    expect(tokens).toHaveProperty("resolveCssColor");
  });

  it("reads 0.1.x's stored theme when the new keys are absent", async () => {
    localStorage.setItem("atlas-ui-theme-id-shadow", "glacier");
    localStorage.setItem("atlas-ui-theme-shadow", "light");
    const { useTheme } = await import("../src");
    let seen: { themeId: string; mode: string } | null = null;
    function Probe() {
      const t = useTheme();
      seen = { themeId: t.themeId, mode: t.mode };
      return null;
    }
    render(
      <ThemeProvider storageKey="fresh-app">
        <Probe />
      </ThemeProvider>,
    );
    expect(seen).toEqual({ themeId: "glacier", mode: "light" });
    localStorage.clear();
  });
});
