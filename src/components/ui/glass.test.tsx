// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeProvider";
import {
  bayerTile,
  blockFacePath,
  blockWallTile,
  ditherTable,
  edgeMapAxis,
  Glass,
  GlassBackdrop,
  GLASS_GUIDE,
  glassNeedsFilter,
  GLASS_PRESET_NAMES,
  glassToneColor,
  glassToneForeground,
  glassVars,
  refractionScale,
  resolveGlass,
} from "./glass";
import { glassTintLabel, GlassTintControl } from "./glass-tint-control";
import { adjustForTarget, InterfaceSizeControl, interfaceScaleFraction } from "./interface-size-control";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-glass-chrome");
});

describe("glass materials", () => {
  it("every preset resolves with every number in range", () => {
    for (const p of GLASS_PRESET_NAMES) {
      const m = resolveGlass(p);
      for (const k of ["tint", "fringe", "sheen", "rim", "refraction", "dispersion"] as const) {
        expect(m[k], `${p}.${k}`).toBeGreaterThanOrEqual(0);
        expect(m[k], `${p}.${k}`).toBeLessThanOrEqual(1);
      }
      expect(m.blur).toBeGreaterThanOrEqual(0);
    }
  });

  it("runs from clear to fully tinted", () => {
    expect(resolveGlass("clear").tint).toBeLessThan(0.1);
    expect(resolveGlass("solid").tint).toBe(1);
  });

  it("overrides win, undefined ones don't, and out-of-range ones clamp", () => {
    expect(resolveGlass("clear", { tint: 0.5 }).tint).toBe(0.5);
    expect(resolveGlass("clear", { tint: undefined }).tint).toBe(resolveGlass("clear").tint);
    expect(resolveGlass("regular", { tint: 4, blur: -3, fringe: Number.NaN }).tint).toBe(1);
    expect(resolveGlass("regular", { blur: -3 }).blur).toBe(0);
    expect(resolveGlass("regular", { fringe: Number.NaN }).fringe).toBe(0);
  });

  it("tints with theme tokens, the theme's hues, or any colour", () => {
    expect(glassToneColor("neutral")).toBe("var(--background)");
    expect(glassToneColor("primary")).toBe("var(--primary)");
    expect(glassToneColor("magenta")).toBe("var(--terminal-ansi-magenta)");
    expect(glassToneColor("oklch(0.7 0.1 200)")).toBe("oklch(0.7 0.1 200)");
  });

  it("hands text to the tone's foreground once the tint carries it", () => {
    expect(glassToneForeground("primary", 0.3)).toBeUndefined();
    expect(glassToneForeground("primary", 0.8)).toBe("var(--primary-foreground)");
    expect(glassToneForeground("neutral", 1)).toBeUndefined();
  });

  it("writes the custom properties glass.css reads", () => {
    const v = glassVars(resolveGlass("frosted", { tone: "accent" }));
    expect(v["--glass-color"]).toBe("var(--accent)");
    expect(v["--glass-blur"]).toMatch(/px$/);
    expect(v["--glass-edge-width"]).toMatch(/rem$/);
  });

  it("bends only the edge: the map is neutral in the middle", () => {
    const uri = decodeURIComponent(edgeMapAxis("r", 400, 200, 20));
    expect(uri).toContain('stop-color="rgb(255,0,0)"');
    expect(uri).toContain('stop-color="rgb(0,0,0)"');
    // The flat middle starts 20px in (0.05 of 400) at 0.5.
    expect(uri).toContain('offset="0.0500" stop-color="rgb(128,0,0)"');
    expect(refractionScale(0, 300, 200)).toBe(0);
    expect(refractionScale(1, 300, 200)).toBeGreaterThan(refractionScale(0.5, 300, 200));
    expect(refractionScale(1, 4000, 4000)).toBeLessThanOrEqual(64);
  });
});

describe("glass.css", () => {
  it("never blends a layer: that switches off every backdrop filter on the surface in Chromium", () => {
    const css = readFileSync(join(__dirname, "../../styles/glass.css"), "utf8");
    const rules = css.split("\n").filter((l) => !/^\s*(\/\*|\*)/.test(l));
    expect(rules.filter((l) => /mix-blend-mode/.test(l))).toEqual([]);
  });
});

describe("<Glass>", () => {
  it("lays out its children as the element would, with the glass beside them", () => {
    render(
      <Glass preset="frosted" fringe={0.5} sheen={0.4} className="flex gap-2" data-testid="g">
        <span>a</span>
        <span>b</span>
      </Glass>,
    );
    const g = screen.getByTestId("g");
    expect(g.className).toContain("flex");
    expect(g.className).toContain("nexis-glass");
    const layers = [...g.querySelectorAll(":scope > .nexis-glass-layer")].map((l) => l.className.replace("nexis-glass-layer ", ""));
    expect(layers).toEqual(["nexis-glass-pane", "nexis-glass-edge", "nexis-glass-fringe", "nexis-glass-sheen", "nexis-glass-rim"]);
    expect(screen.getByText("a").parentElement).toBe(g);
    // No blend modes: one would switch off every backdrop filter on the surface.
    expect(g.querySelector("[style*='mix-blend']")).toBeNull();
  });

  it("renders as another element, and passes props through", () => {
    render(
      <Glass as="button" preset="tinted" tone="primary" aria-label="Play" onClick={() => {}}>
        x
      </Glass>,
    );
    const b = screen.getByRole("button", { name: "Play" });
    expect(b.style.getPropertyValue("--glass-color")).toBe("var(--primary)");
    expect(b.style.color).toBe("var(--primary-foreground)");
    expect(b.getAttribute("tone")).toBeNull();
  });

  it("follows the pointer when specular, and forgets it on leave", () => {
    render(<Glass preset="clear" data-testid="g">x</Glass>);
    const g = screen.getByTestId("g");
    expect(g.querySelector(".nexis-glass-specular")).not.toBeNull();
    fireEvent.pointerMove(g, { clientX: 5, clientY: 5 });
    expect(g.style.getPropertyValue("--glass-x")).not.toBe("");
    fireEvent.pointerLeave(g);
    expect(g.style.getPropertyValue("--glass-x")).toBe("");
  });

  it("doesn't refract where the engine can't (jsdom, WebKit)", () => {
    render(<Glass preset="prism" data-testid="g">x</Glass>);
    expect(screen.getByTestId("g").hasAttribute("data-refract")).toBe(false);
    expect(screen.getByTestId("g").querySelector("filter")).toBeNull();
  });
});

describe("new materials", () => {
  it("dithers to n evenly spaced levels through a 4x4 Bayer tile", () => {
    expect(ditherTable(2)).toBe("0 1");
    expect(ditherTable(3)).toBe("0 0.5 1");
    expect(ditherTable(99).split(" ")).toHaveLength(8);
    const tile = decodeURIComponent(bayerTile(2));
    expect(tile.match(/<rect /g)).toHaveLength(16);
    expect(tile).toContain('width="8" height="8"');
  });

  it("asks for the SVG filter only for bends and filter-only textures", () => {
    expect(glassNeedsFilter(resolveGlass("solid"))).toBe(false);
    expect(glassNeedsFilter(resolveGlass("dither"))).toBe(true);
    expect(glassNeedsFilter(resolveGlass("block"))).toBe(true);
    expect(glassNeedsFilter(resolveGlass("fog", { refraction: 1 }))).toBe(false);
  });

  it("draws three iris layers, and its texture as a data attribute", () => {
    render(<Glass preset="iridescent" data-testid="i">x</Glass>);
    expect(screen.getByTestId("i").querySelectorAll(".nexis-glass-iris")).toHaveLength(3);
    cleanup();
    render(<Glass preset="block" data-testid="b">x</Glass>);
    expect(screen.getByTestId("b").getAttribute("data-texture")).toBe("block");
    expect(screen.getByTestId("b").style.getPropertyValue("--glass-block")).toBe("72px");
  });

  it("builds a 2x2 glass-block tile: four framed blocks, each its own relief", () => {
    for (const p of ["cloud", "wave", "clear", "diamond"] as const) {
      const svg = decodeURIComponent(blockWallTile(p));
      expect(svg, p).toContain('preserveAspectRatio="none"');
      expect(svg.match(/<g transform="translate\(/g), p).toHaveLength(4);
    }
    expect(decodeURIComponent(blockWallTile("cloud")).match(/<feSpecularLighting/g)).toHaveLength(4);
    // A face's edge wobbles but stays inside the frame.
    const nums = blockFacePath(3).match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(Math.min(...nums)).toBeGreaterThan(10);
    expect(Math.max(...nums)).toBeLessThan(90);
  });

  it("draws the block layer with its pattern and mortar width", () => {
    render(<Glass preset="block" blockPattern="wave" grout={9} data-testid="w">x</Glass>);
    const w = screen.getByTestId("w");
    expect(w.querySelector(".nexis-glass-block")?.getAttribute("data-block")).toBe("wave");
    expect(w.style.getPropertyValue("--glass-grout")).toBe("9px");
  });

  it("clear glass has no tint, and every guide range sits inside its knob", () => {
    expect(resolveGlass("clear").tint).toBe(0);
    for (const [k, g] of Object.entries(GLASS_GUIDE)) expect(g.good[0], k).toBeLessThan(g.good[1]);
  });
});

describe("window glass", () => {
  it("marks the root and draws the backdrop only while it's on", () => {
    function Shell() {
      return (
        <div data-app-shell>
          <GlassBackdrop />
          <GlassTintControl />
        </div>
      );
    }
    const { container } = render(
      <ThemeProvider storageKey="w">
        <Shell />
      </ThemeProvider>,
    );
    expect(document.documentElement.hasAttribute("data-glass-chrome")).toBe(false);
    expect(container.querySelector("[data-slot=glass-backdrop]")).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Frosted" }));
    expect(document.documentElement.getAttribute("data-glass-chrome")).toBe("frosted");
    expect(container.querySelector("[data-slot=glass-backdrop]")).not.toBeNull();
    expect(localStorage.getItem("w:glass-chrome")).toBe("frosted");
  });

  it("starts from defaultGlassChrome when nothing is stored", () => {
    render(
      <ThemeProvider storageKey="d" defaultGlassChrome="clear">
        <GlassBackdrop kind="bloom" />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-glass-chrome")).toBe("clear");
    expect(document.querySelectorAll("[data-slot=glass-backdrop] > span")).toHaveLength(4);
  });
});

describe("settings controls", () => {
  it("labels the glass tint", () => {
    expect(glassTintLabel(0)).toBe("Clear");
    expect(glassTintLabel(1)).toBe("Fully tinted");
    expect(glassTintLabel(0.4)).toBe("40% tinted");
  });

  it("maps scales onto the slider and back to an adjustment", () => {
    expect(interfaceScaleFraction(0.75)).toBe(0);
    expect(interfaceScaleFraction(2.5)).toBe(1);
    expect(adjustForTarget(1.32, 1.2)).toBeCloseTo(1.1);
    expect(adjustForTarget(9, 1)).toBe(1.5);
  });

  it("sets the glass tint on the root and remembers it", () => {
    render(
      <ThemeProvider storageKey="t">
        <GlassTintControl />
      </ThemeProvider>,
    );
    const thumb = screen.getByRole("slider", { name: "Glass" });
    act(() => {
      fireEvent.keyDown(thumb, { key: "End" });
    });
    expect(document.documentElement.style.getPropertyValue("--glass-user-tint")).toBe("1");
    expect(localStorage.getItem("t:glass-tint")).toBe("1");
  });

  it("switches between Auto and Fixed without changing what's on screen", () => {
    render(
      <ThemeProvider storageKey="t">
        <InterfaceSizeControl />
      </ThemeProvider>,
    );
    const before = document.documentElement.style.getPropertyValue("--ui-scale");
    fireEvent.click(screen.getByRole("radio", { name: "Fixed" }));
    expect(localStorage.getItem("t:ui-size")).toBe(before);
    expect(document.documentElement.style.getPropertyValue("--ui-scale")).toBe(before);
    fireEvent.click(screen.getByRole("radio", { name: "Auto" }));
    expect(localStorage.getItem("t:ui-size")).toBe("auto");
    expect(document.documentElement.style.getPropertyValue("--ui-scale")).toBe(before);
    expect(screen.getByRole("slider", { name: "Interface size" })).toBeTruthy();
  });
});
