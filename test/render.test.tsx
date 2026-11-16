// Smoke: every template and every gallery page mounts inside the provider
// without throwing. Catches a missing export, a hook outside its provider, a
// bad prop — the failures that otherwise only show up when someone opens the
// screen.
import { render } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it } from "vitest";
import { Button, Icon, IconWeightProvider, SidebarNav, ThemeProvider, TooltipProvider } from "../src";
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
    // The theme's accent is --brand only; --primary stays a neutral (R6.2).
    const aurelian = getBuiltinTheme("aurelian")!.variants.dark!.colors!;
    expect(root.style.getPropertyValue("--primary")).toBe(aurelian.foreground);
    expect(root.style.getPropertyValue("--primary-foreground")).toBe(aurelian.background);
    expect(root.style.getPropertyValue("--primary")).not.toBe(root.style.getPropertyValue("--brand"));
    // In the dark the popover is a step above the card, not equal to it.
    expect(root.style.getPropertyValue("--popover")).toContain("var(--card)");
    applyTheme(getBuiltinTheme("aurelian")!, "light");
    expect(root.style.getPropertyValue("--popover")).toBe(getBuiltinTheme("aurelian")!.variants.light!.colors!.popover);
    clearTheme();
    expect(root.style.getPropertyValue("--background")).toBe("");
    expect(root.style.getPropertyValue("--primary")).toBe("");
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

describe("SidebarNav collapsed", () => {
  it("keeps an accessible name, count included, on each icon button (SCAFFOLD-ISSUES 16)", () => {
    function Nav() {
      return <SidebarNav collapsed value="home" onChange={() => {}} sections={[{ items: [{ id: "home", label: "Home", icon: "home" }, { id: "cart", label: "Cart", icon: "cart", meta: 3 }] }]} />;
    }
    const { getByRole } = mount(Nav);
    expect(getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Cart, 3" })).toBeInTheDocument();
  });
});

describe("icons follow their text (RULES R7.5, R8.4)", () => {
  // Phosphor marks its weight on the svg root as a path set; regular and bold
  // draw different paths, so compare against a known-weight render.
  const paths = (el: Element | null) => el?.querySelector("svg")?.innerHTML ?? "";

  it("takes bold inside a medium-weight control and regular outside", () => {
    const bold = render(<Icon name="add" weight="bold" />).container;
    const regular = render(<Icon name="add" />).container;
    const inButton = render(<Button><Icon name="add" /> New</Button>).container;
    const inProvider = render(<IconWeightProvider weight="bold"><Icon name="add" /></IconWeightProvider>).container;
    expect(paths(regular)).not.toBe(paths(bold));
    expect(paths(inButton)).toBe(paths(bold));
    expect(paths(inProvider)).toBe(paths(bold));
  });

  it("keeps its own weight and active over the provider", () => {
    const fill = render(<Icon name="star" weight="fill" />).container;
    const active = render(<IconWeightProvider weight="bold"><Icon name="star" active /></IconWeightProvider>).container;
    expect(paths(active)).toBe(paths(fill));
  });

  it("animates a swap only when the name changes, never on first render", () => {
    const { container, rerender } = render(<Icon name="copy" swap />);
    expect(container.querySelector("svg")?.classList.contains("nexis-icon-swap")).toBe(false);
    rerender(<Icon name="copy" swap />);
    expect(container.querySelector("svg")?.classList.contains("nexis-icon-swap")).toBe(false);
    rerender(<Icon name="check" swap />);
    expect(container.querySelector("svg")?.classList.contains("nexis-icon-swap")).toBe(true);
    const plain = render(<Icon name="copy" />);
    plain.rerender(<Icon name="check" />);
    expect(plain.container.querySelector("svg")?.classList.contains("nexis-icon-swap")).toBe(false);
  });
});
