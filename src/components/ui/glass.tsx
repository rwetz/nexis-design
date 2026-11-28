// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import * as React from "react";

import { cn } from "../../lib/utils";
import { useTheme } from "../../theme/ThemeProvider";

/*
 * Liquid glass (docs/GLASS.md). <Glass> is a surface: it lays out its
 * children like the element it renders, and draws the glass in layers beside
 * them (src/styles/glass.css). Pick a preset, then override any knob.
 */

/** The theme tokens a pane can be tinted with, or any CSS colour. */
export type GlassTone =
  | "neutral"
  | "light"
  | "dark"
  | "primary"
  | "brand"
  | "accent"
  | "secondary"
  | "muted"
  | "card"
  | "popover"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "red"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "magenta"
  | (string & {});

/**
 * The glass's texture. Bent through on Chromium (the backdrop really moves),
 * drawn as light on WebKit. `dither` orders what's behind into a few
 * colours through a Bayer matrix (Chromium; a dot screen elsewhere).
 */
export type GlassTexture = "none" | "reeded" | "ripple" | "frost" | "hammered" | "seeded" | "block" | "dither";
/** The film's colours: the rainbow, the theme's six hues, or the tint's own. */
export type GlassFilm = "rainbow" | "theme" | "tone";
/** The edge: lit white, the rainbow film, or the theme's six hues. */
export type GlassRimStyle = "light" | "film" | "theme";

export type GlassMaterial = {
  /** 0 clear … 1 fully tinted. The user's Glass opacity pulls it toward 1. */
  tint: number;
  tone: GlassTone;
  /** Backdrop blur, CSS px. */
  blur: number;
  saturate: number;
  brightness: number;
  /** Extra blur round the edge, CSS px (0 = none). */
  edge: number;
  /** How far in the edge blur reaches, rem. */
  edgeWidth: number;
  /** 0 … 1: the band at the edge where what's behind shifts hue. */
  fringe: number;
  /** 0 … 1: the thin-film wash over the pane. */
  sheen: number;
  /**
   * 0 … 1: oil-slick iridescence. Rings across the pane where what's behind
   * shifts hue, as a thin film of oil or soap does to light. Every engine.
   */
  iris: number;
  film: GlassFilm;
  /** The film over the whole pane rather than toward the edges. */
  sheenFill: boolean;
  /** 0 … 1: the lit edge. */
  rim: number;
  rimStyle: GlassRimStyle;
  /** 0 … 1: the edge bends what's behind (Chromium only; elsewhere none). */
  refraction: number;
  /** 0 … 1: the bend splits colour into a rainbow (with refraction). */
  dispersion: number;
  texture: GlassTexture;
  /** Size of one glass block (`texture="block"`), CSS px. */
  blockSize: number;
  /** Colours per channel for `texture="dither"`: 2 is eight colours, 4 is 64. */
  ditherLevels: number;
  /** A highlight that follows the pointer. */
  specular: boolean;
  /** The film and fringe drift through their colours (off under reduced motion). */
  animate: boolean;
  /** A soft halo round text, for clear glass over busy backgrounds. */
  legible: boolean;
  shadow: boolean;
};

const BASE: GlassMaterial = {
  tint: 0.22,
  tone: "neutral",
  blur: 14,
  saturate: 1.7,
  brightness: 1.04,
  edge: 0,
  edgeWidth: 2,
  fringe: 0,
  sheen: 0,
  iris: 0,
  film: "rainbow",
  sheenFill: false,
  rim: 0.75,
  rimStyle: "light",
  refraction: 0,
  dispersion: 0,
  texture: "none",
  blockSize: 56,
  ditherLevels: 2,
  specular: false,
  animate: false,
  legible: false,
  shadow: true,
};

/**
 * The materials, from nearly nothing to fully tinted, then the effects.
 * Every one takes any tone, so "tinted" in `primary` and "frosted" in
 * `chart-3` are both one prop away.
 */
export const GLASS_PRESETS = {
  /** Apple's clear: no tint, almost no blur; only the lit, bent edge says it's there. */
  clear: { tint: 0, blur: 0.6, saturate: 1.15, rim: 0.95, refraction: 0.55, dispersion: 0.35, legible: true, specular: true },
  /** The everyday pane: toolbars, sidebars, popovers. */
  regular: { tint: 0.22, blur: 14, rim: 0.75, refraction: 0.3, dispersion: 0.15 },
  /** More blur, more body; the edge blurs harder still. */
  frosted: { tint: 0.4, blur: 30, saturate: 1.5, rim: 0.6, edge: 14 },
  /** Heavy blur that deepens toward the edge, like breath on a window. */
  fog: { tint: 0.28, blur: 44, saturate: 1.25, brightness: 1.08, rim: 0.45, edge: 40, edgeWidth: 3 },
  /** Mostly colour: reads as a coloured surface with depth behind it. */
  tinted: { tint: 0.68, blur: 22, saturate: 1.5, rim: 0.6 },
  /** Fully tinted: no see-through, keeps the lit edge. */
  solid: { tint: 1, blur: 0, saturate: 1, brightness: 1, rim: 0.55 },
  /** Oil-slick rings over the pane, a rainbow edge, all drifting. */
  iridescent: { tint: 0.06, blur: 6, iris: 0.85, sheen: 0.25, fringe: 0.45, rim: 0.9, rimStyle: "film", refraction: 0.35, dispersion: 0.7, animate: true, specular: true },
  /** Oil on dark water: a dark pane, strong rings. */
  oil: { tint: 0.5, tone: "dark", blur: 10, iris: 1, sheen: 0.2, sheenFill: true, rim: 0.7, rimStyle: "film", animate: true },
  /** A soap bubble: no tint, no blur, all film. */
  bubble: { tint: 0, blur: 0, saturate: 1, brightness: 1, iris: 0.55, sheen: 0.5, fringe: 0.35, rim: 1, rimStyle: "film", refraction: 0.25, dispersion: 0.5, animate: true, legible: true, shadow: false },
  /** A prism: strong bend, strong rainbow split, a hue-shifting edge. */
  prism: { tint: 0.02, blur: 1.2, saturate: 1.6, rim: 0.9, rimStyle: "film", fringe: 0.8, refraction: 1, dispersion: 1, animate: true },
  /** Reeded (fluted) glass: vertical ribs. */
  reeded: { tint: 0.12, blur: 2.5, rim: 0.7, texture: "reeded", refraction: 0.6, dispersion: 0.2 },
  /** Rippled glass, like old window panes. */
  ripple: { tint: 0.1, blur: 1.2, rim: 0.7, texture: "ripple", refraction: 0.75, dispersion: 0.25 },
  /** Fine grain: sandblasted glass. */
  frost: { tint: 0.25, blur: 8, rim: 0.6, texture: "frost", refraction: 0.5 },
  /** Hammered glass: round dimples that each bend what's behind. */
  hammered: { tint: 0.1, blur: 1.5, rim: 0.75, texture: "hammered", refraction: 0.8, dispersion: 0.2 },
  /** Seeded glass: little bubbles caught in the pane. */
  seeded: { tint: 0.08, blur: 1, rim: 0.8, texture: "seeded", refraction: 0.3 },
  /** Cathedral glass: rippled and coloured, like a church window. Give it a tone. */
  cathedral: { tint: 0.45, tone: "magenta", blur: 2, saturate: 1.6, rim: 0.7, texture: "ripple", refraction: 0.9, dispersion: 0.3, sheen: 0.25, film: "tone" },
  /** Architectural glass block: a grid of blocks, each its own wavy lens, with mortar between. */
  block: { tint: 0.14, blur: 1.5, saturate: 1.2, rim: 0.6, texture: "block", refraction: 1, dispersion: 0.15, blockSize: 56 },
  /** Ordered dither: what's behind in a few colours through a Bayer screen. */
  dither: { tint: 0.08, blur: 6, saturate: 1.3, rim: 0.6, texture: "dither", ditherLevels: 2 },
} satisfies Record<string, Partial<GlassMaterial>>;

/**
 * What each knob is good for: the range that suits an everyday surface,
 * and a line on the rest. The gallery's playground marks `good` on each
 * slider; docs/GLASS.md says the same in prose.
 */
export const GLASS_GUIDE = {
  tint: { good: [0.15, 0.35], note: "0 to 5% clear, 15 to 35% everyday panes, 60 to 80% tinted, 100% solid" },
  blur: { good: [8, 24], note: "under 1px for clear (2px already smears type), 8 to 24 for panes, 30+ frosted" },
  saturate: { good: [1.3, 1.8], note: "1.3 to 1.8 keeps colour alive behind; past 2 it goes neon" },
  edge: { good: [8, 32], note: "0 for a crisp pane, 8 to 32 for a soft edge, 40+ for fog" },
  fringe: { good: [0.2, 0.5], note: "a little goes far; for showpieces, not every panel" },
  sheen: { good: [0.3, 0.6], note: "film colour; under 30% barely reads, over 70% hides what's behind" },
  rim: { good: [0.5, 0.9], note: "the lit edge is what says glass at low tint: keep it up on clear" },
  refraction: { good: [0.3, 0.7], note: "past 80% text behind the edge gets hard to read" },
  dispersion: { good: [0.2, 0.6], note: "the rainbow split; 100% is a prism, for effect only" },
} as const satisfies Partial<Record<keyof GlassMaterial, { good: readonly [number, number]; note: string }>>;

export type GlassPreset = keyof typeof GLASS_PRESETS;
export const GLASS_PRESET_NAMES = Object.keys(GLASS_PRESETS) as GlassPreset[];

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const nonNeg = (v: number) => Math.max(0, Number.isFinite(v) ? v : 0);

/** A preset with overrides, every number in range. */
export function resolveGlass(preset: GlassPreset = "regular", overrides: Partial<GlassMaterial> = {}): GlassMaterial {
  const defined = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined)) as Partial<GlassMaterial>;
  const m: GlassMaterial = { ...BASE, ...GLASS_PRESETS[preset], ...defined };
  return {
    ...m,
    tint: clamp01(m.tint),
    blur: nonNeg(m.blur),
    saturate: nonNeg(m.saturate),
    brightness: nonNeg(m.brightness),
    edge: nonNeg(m.edge),
    edgeWidth: nonNeg(m.edgeWidth),
    fringe: clamp01(m.fringe),
    sheen: clamp01(m.sheen),
    iris: clamp01(m.iris),
    blockSize: Math.max(16, Number.isFinite(m.blockSize) ? m.blockSize : 56),
    ditherLevels: Math.max(2, Math.min(8, Math.round(Number.isFinite(m.ditherLevels) ? m.ditherLevels : 2))),
    rim: clamp01(m.rim),
    refraction: clamp01(m.refraction),
    dispersion: clamp01(m.dispersion),
  };
}

const TOKEN_TONES = new Set([
  "primary", "brand", "accent", "secondary", "muted", "card", "popover",
  "success", "warning", "info", "destructive", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
]);
/** Tones with a foreground token, used once the tint carries the text. */
const WITH_FOREGROUND = new Set(["primary", "brand", "accent", "secondary", "muted", "card", "popover"]);

/** The six hues every theme tunes, as its terminal's ANSI colours. */
const HUES = new Set(["red", "yellow", "green", "cyan", "blue", "magenta"]);

/** The CSS colour a tone tints with. */
export function glassToneColor(tone: GlassTone): string {
  if (HUES.has(tone)) return `var(--terminal-ansi-${tone})`;
  if (tone === "neutral") return "var(--background)";
  if (tone === "light") return "var(--glass-light)";
  if (tone === "dark") return "var(--glass-dark)";
  if (TOKEN_TONES.has(tone)) return `var(--${tone})`;
  return tone;
}

/** The text colour for a tone at `tint`: its foreground once the tint is most of what you see. */
export function glassToneForeground(tone: GlassTone, tint: number): string | undefined {
  if (tint < 0.55) return undefined;
  if (tone === "destructive") return "var(--primary-foreground)";
  if (WITH_FOREGROUND.has(tone)) return `var(--${tone}-foreground)`;
  if (tone === "dark") return "var(--glass-light)";
  if (tone === "light") return "var(--glass-dark)";
  return undefined;
}

/** The custom properties glass.css reads, for a material. */
export function glassVars(m: GlassMaterial): Record<string, string> {
  return {
    "--glass-tint": String(m.tint),
    "--glass-color": glassToneColor(m.tone),
    "--glass-blur": `${m.blur}px`,
    "--glass-saturate": String(m.saturate),
    "--glass-brightness": String(m.brightness),
    "--glass-edge": `${m.edge}px`,
    "--glass-edge-width": `${m.edgeWidth}rem`,
    "--glass-fringe": String(m.fringe),
    "--glass-sheen": String(m.sheen),
    "--glass-iris": String(m.iris),
    "--glass-block": `${Math.max(16, Math.round(m.blockSize))}px`,
    "--glass-rim": String(m.rim),
  };
}

/**
 * Whether this engine bends the backdrop through an SVG filter: Chromium
 * (WebView2 on Windows, Chrome, Edge). WebKit (macOS, iOS) and WebKitGTK
 * (Linux) don't take url() in backdrop-filter, so there glass keeps every
 * other effect and the edge stays straight.
 */
export function glassRefractionSupported(): boolean {
  if (typeof navigator === "undefined" || typeof document === "undefined") return false;
  if (document.documentElement.dataset.os === "linux") return false;
  const ua = navigator.userAgent;
  return /(?:Chrome|Chromium|Edg)\//.test(ua) && !/\bFirefox\//.test(ua);
}

const byte = (v: number) => Math.round(clamp01(v) * 255);
const svgUri = (body: string, w: number, h: number) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;

/**
 * The lens profile across a bezel: displacement is strongest at the very
 * edge and gone `bezel` px in, so the middle of the pane is undistorted and
 * the edge bends what's behind toward the centre, like a convex rim.
 */
const LENS = [
  [0, 1],
  [0.18, 0.84],
  [0.45, 0.66],
  [1, 0.5],
] as const;

/** One axis of the edge map: `channel` ramps over `bezel` px at each end of `length`. */
export function edgeMapAxis(channel: "r" | "g", length: number, other: number, bezel: number): string {
  const b = Math.min(bezel, length / 2);
  const stops: string[] = [];
  const color = (v: number) => (channel === "r" ? `rgb(${byte(v)},0,0)` : `rgb(0,${byte(v)},0)`);
  for (const [t, v] of LENS) stops.push(`<stop offset="${((t * b) / length).toFixed(4)}" stop-color="${color(v)}"/>`);
  for (const [t, v] of [...LENS].reverse()) stops.push(`<stop offset="${(1 - (t * b) / length).toFixed(4)}" stop-color="${color(1 - v)}"/>`);
  const [x2, y2] = channel === "r" ? [length, 0] : [0, length];
  const [w, h] = channel === "r" ? [length, other] : [other, length];
  return svgUri(
    `<defs><linearGradient id="m" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.join("")}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#m)"/>`,
    w,
    h,
  );
}

/** Reeded glass: ribs `period` px wide, each a small cylinder lens. */
export function reededMap(w: number, h: number, period = 14): string {
  const rib = [
    [0, 0.5],
    [0.25, 0.86],
    [0.5, 0.5],
    [0.75, 0.14],
    [1, 0.5],
  ] as const;
  const stops = rib.map(([t, v]) => `<stop offset="${t}" stop-color="rgb(${byte(v)},128,0)"/>`).join("");
  return svgUri(
    `<defs><linearGradient id="r" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${period}" y2="0" spreadMethod="repeat">${stops}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#r)"/>`,
    w,
    h,
  );
}

/** What displaces the backdrop, as the filter's displacement scale in px. */
export function refractionScale(refraction: number, w: number, h: number): number {
  const reach = Math.min(64, Math.max(14, Math.min(w, h) * 0.3));
  return Math.round(clamp01(refraction) * reach * 10) / 10;
}

/**
 * One glass block's lens, one axis: a pillow that bends what's behind
 * toward the block's middle, strongest at its edges, so each block shows
 * its own little picture. Tiled across the pane by the filter.
 */
export function blockTileAxis(channel: "r" | "g", size: number): string {
  return edgeMapAxis(channel, size, size, size * 0.48);
}

/** The 4×4 Bayer matrix, each cell `cell` px, as a grey ramp (0 … 15)/16. */
export const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;
export function bayerTile(cell: number): string {
  const n = 4 * cell;
  const rects = BAYER_4.map((v, i) => {
    const g = Math.round(((v + 0.5) / 16) * 255);
    return `<rect x="${(i % 4) * cell}" y="${Math.floor(i / 4) * cell}" width="${cell}" height="${cell}" fill="rgb(${g},${g},${g})"/>`;
  }).join("");
  return svgUri(rects, n, n);
}

/** The `discrete` table for `levels` colours per channel: "0 0.5 1" for 3. */
export function ditherTable(levels: number): string {
  const n = Math.max(2, Math.min(8, Math.round(levels)));
  return Array.from({ length: n }, (_, i) => +(i / (n - 1)).toFixed(4)).join(" ");
}

/** Whether a material needs the SVG filter at all (refraction, or a filter-only texture). */
export function glassNeedsFilter(m: GlassMaterial): boolean {
  return (m.refraction > 0 && m.blur < 40) || m.texture === "dither" || m.texture === "block";
}

function RefractionFilter({ id, w, h, m }: { id: string; w: number; h: number; m: GlassMaterial }) {
  const bezel = Math.min(28, Math.max(10, Math.min(w, h) * 0.22));
  const scale = refractionScale(m.refraction, w, h);
  const d = m.dispersion;
  const full = { x: "0", y: "0", width: w, height: h, preserveAspectRatio: "none" } as const;
  // Keep only channel i (R, G or B) of a displaced copy, alpha whole.
  const channel = (i: number) =>
    `${["1 0 0 0 0", "0 1 0 0 0", "0 0 1 0 0"].map((row, k) => (k === i ? row : "0 0 0 0 0")).join(" ")} 0 0 0 1 0`;
  const noise = (type: "turbulence" | "fractalNoise", freq: string, octaves: number) => (
    <>
      <feTurbulence type={type} baseFrequency={freq} numOctaves={octaves} seed="7" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1" result="tex" />
    </>
  );
  const bs = Math.max(16, Math.round(m.blockSize));
  const bend = m.refraction > 0;
  const cell = 2;
  const levels = ditherTable(m.ditherLevels);
  const amp = 1 / (Math.max(2, Math.round(m.ditherLevels)) - 1);
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute" style={{ position: "absolute", width: 0, height: 0 }}>
      <filter id={id} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        {bend && (
          <>
            {/* The pane's own edge: a convex rim. */}
            <feImage href={edgeMapAxis("r", w, h, bezel)} {...full} result="mx" />
            <feImage href={edgeMapAxis("g", h, w, bezel)} {...full} result="my" />
            <feComposite in="mx" in2="my" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="edge" />
            {m.texture === "reeded" && <feImage href={reededMap(w, h)} {...full} result="tex" />}
            {m.texture === "ripple" && noise("turbulence", "0.012 0.03", 2)}
            {m.texture === "frost" && noise("fractalNoise", "0.9", 1)}
            {m.texture === "hammered" && noise("fractalNoise", "0.06", 1)}
            {m.texture === "seeded" && noise("fractalNoise", "0.02", 1)}
            {m.texture === "block" && (
              <>
                {/* One block's pillow lens, tiled; a slow wave through it. */}
                <feImage href={blockTileAxis("r", bs)} x="0" y="0" width={bs} height={bs} preserveAspectRatio="none" result="bx1" />
                <feTile in="bx1" result="bx" />
                <feImage href={blockTileAxis("g", bs)} x="0" y="0" width={bs} height={bs} preserveAspectRatio="none" result="by1" />
                <feTile in="by1" result="by" />
                <feComposite in="bx" in2="by" operator="arithmetic" k2="1" k3="1" result="blocks" />
                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="wn" />
                <feColorMatrix in="wn" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1" result="wave" />
                <feComposite in="blocks" in2="wave" operator="arithmetic" k2="1" k3="0.6" k4="-0.3" result="tex" />
              </>
            )}
            {m.texture !== "none" && m.texture !== "dither" && (
              <feComposite in="edge" in2="tex" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result="edge" />
            )}
            {d > 0 ? (
              <>
                {[scale, scale * (1 + 0.1 * d), scale * (1 + 0.2 * d)].map((sc, i) => (
                  <React.Fragment key={i}>
                    <feDisplacementMap in="SourceGraphic" in2="edge" scale={sc} xChannelSelector="R" yChannelSelector="G" result={`d${i}`} />
                    <feColorMatrix in={`d${i}`} type="matrix" values={channel(i)} result={`c${i}`} />
                  </React.Fragment>
                ))}
                <feComposite in="c0" in2="c1" operator="arithmetic" k2="1" k3="1" result="rg" />
                <feComposite in="rg" in2="c2" operator="arithmetic" k2="1" k3="1" result="bent" />
              </>
            ) : (
              <feDisplacementMap in="SourceGraphic" in2="edge" scale={scale} xChannelSelector="R" yChannelSelector="G" result="bent" />
            )}
          </>
        )}
        {m.texture === "dither" && (
          <>
            {/* Ordered dither: a Bayer threshold added, then each channel snapped to a few levels. */}
            <feImage href={bayerTile(cell)} x="0" y="0" width={cell * 4} height={cell * 4} preserveAspectRatio="none" result="b1" />
            <feTile in="b1" result="bayer" />
            <feComposite in={bend ? "bent" : "SourceGraphic"} in2="bayer" operator="arithmetic" k2="1" k3={amp} k4={-amp / 2} result="lifted" />
            <feComponentTransfer in="lifted">
              <feFuncR type="discrete" tableValues={levels} />
              <feFuncG type="discrete" tableValues={levels} />
              <feFuncB type="discrete" tableValues={levels} />
              <feFuncA type="identity" />
            </feComponentTransfer>
          </>
        )}
      </filter>
    </svg>
  );
}

type GlassElement = "div" | "section" | "aside" | "nav" | "header" | "footer" | "span" | "button" | "article";

export type GlassProps = Omit<React.ComponentProps<"div">, "ref"> &
  Partial<GlassMaterial> & {
    preset?: GlassPreset;
    as?: GlassElement;
    ref?: React.Ref<HTMLElement>;
  };

const MATERIAL_KEYS = Object.keys(BASE) as (keyof GlassMaterial)[];

/**
 * A liquid-glass surface. It renders `as` (a div by default) with its
 * children laid out by `className` as usual; the glass is drawn behind them.
 *
 *   <Glass preset="regular" className="flex items-center gap-2 rounded-2xl p-2">…</Glass>
 *   <Glass preset="tinted" tone="primary">…</Glass>
 *   <Glass preset="clear" refraction={1} dispersion={1}>…</Glass>
 */
export function Glass({ preset = "regular", as = "div", className, style, children, ref, onPointerMove, onPointerLeave, ...rest }: GlassProps) {
  const overrides: Partial<GlassMaterial> = {};
  const props: Record<string, unknown> = { ...rest };
  for (const k of MATERIAL_KEYS) {
    if (k in props) {
      (overrides as Record<string, unknown>)[k] = props[k];
      delete props[k];
    }
  }
  const m = resolveGlass(preset, overrides);

  const node = React.useRef<HTMLElement | null>(null);
  const setRef = React.useCallback(
    (el: HTMLElement | null) => {
      node.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = el;
    },
    [ref],
  );

  const wantsRefraction = glassNeedsFilter(m);
  // The engine doesn't change while the app runs: read it once.
  const [refractOk] = React.useState(glassRefractionSupported);
  const refract = wantsRefraction && refractOk;

  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);
  React.useLayoutEffect(() => {
    const el = node.current;
    if (!refract || !el) return undefined;
    const measure = () => {
      const w = Math.max(1, Math.round(el.offsetWidth));
      const h = Math.max(1, Math.round(el.offsetHeight));
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [refract]);

  const rawId = React.useId();
  const filterId = `nexis-glass-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const vars: Record<string, string> = glassVars(m);
  if (refract && size) vars["--glass-refract"] = `url(#${filterId})`;
  const fg = glassToneForeground(m.tone, m.tint);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={setRef}
      data-slot="glass"
      data-preset={preset}
      data-refract={refract && size ? "" : undefined}
      data-texture={m.texture !== "none" ? m.texture : undefined}
      data-sheen={m.film !== "rainbow" ? m.film : undefined}
      data-sheen-fill={m.sheenFill ? "" : undefined}
      data-rim={m.rimStyle !== "light" ? m.rimStyle : undefined}
      data-animate={m.animate ? "" : undefined}
      data-legible={m.legible ? "" : undefined}
      data-shadow={m.shadow ? "" : undefined}
      className={cn("nexis-glass", className)}
      style={{ ...(fg ? { color: fg } : null), ...vars, ...style } as React.CSSProperties}
      onPointerMove={
        m.specular
          ? (e: React.PointerEvent<HTMLDivElement>) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--glass-x", `${((e.clientX - r.left) / r.width) * 100}%`);
              e.currentTarget.style.setProperty("--glass-y", `${((e.clientY - r.top) / r.height) * 100}%`);
              onPointerMove?.(e);
            }
          : onPointerMove
      }
      onPointerLeave={
        m.specular
          ? (e: React.PointerEvent<HTMLDivElement>) => {
              e.currentTarget.style.removeProperty("--glass-x");
              e.currentTarget.style.removeProperty("--glass-y");
              onPointerLeave?.(e);
            }
          : onPointerLeave
      }
      {...props}
    >
      <span aria-hidden className="nexis-glass-layer nexis-glass-pane" />
      {m.edge > 0 && <span aria-hidden className="nexis-glass-layer nexis-glass-edge" />}
      {m.fringe > 0 && <span aria-hidden className="nexis-glass-layer nexis-glass-fringe" />}
      {m.iris > 0 &&
        [0, 1, 2].map((k) => <span key={k} aria-hidden data-k={k} className="nexis-glass-layer nexis-glass-iris" />)}
      {m.sheen > 0 && <span aria-hidden className="nexis-glass-layer nexis-glass-sheen" />}
      {m.specular && <span aria-hidden className="nexis-glass-layer nexis-glass-specular" />}
      {m.rim > 0 && <span aria-hidden className="nexis-glass-layer nexis-glass-rim" />}
      {refract && size && <RefractionFilter id={filterId} w={size.w} h={size.h} m={m} />}
      {children}
    </Tag>
  );
}

export type GlassBackdropKind = "mesh" | "bloom" | "image";

export type GlassBackdropProps = {
  /** `mesh` (the theme's six hues, soft), `bloom` (soft blobs), or `image` (`src`, blurred). */
  kind?: GlassBackdropKind;
  src?: string;
  /** Draw it even while glass chrome is off (a page that is glass on its own). */
  always?: boolean;
  className?: string;
};

const BLOOMS = [
  { hue: "magenta", style: { top: "-15%", left: "-10%", width: "55%", height: "60%" } },
  { hue: "cyan", style: { top: "5%", right: "-10%", width: "45%", height: "55%" } },
  { hue: "yellow", style: { bottom: "-20%", right: "10%", width: "55%", height: "55%" } },
  { hue: "blue", style: { bottom: "-10%", left: "5%", width: "40%", height: "45%" } },
] as const;

/**
 * What a glass shell sits on (docs/GLASS.md): a fixed layer behind the
 * whole window, drawn in the theme's own hues, so glass chrome has
 * something to be glass over. Renders nothing while glass chrome is off,
 * so every template carries one and costs nothing until it's turned on.
 */
export function GlassBackdrop({ kind = "mesh", src, always = false, className }: GlassBackdropProps) {
  const { glassChrome } = useTheme();
  if (glassChrome === "off" && !always) return null;
  return (
    <div aria-hidden data-slot="glass-backdrop" data-kind={kind} className={cn("nexis-glass-backdrop", className)}>
      {kind === "bloom" &&
        BLOOMS.map((b) => <span key={b.hue} style={{ ...b.style, background: `var(--terminal-ansi-${b.hue})` }} />)}
      {kind === "image" && src && <img src={src} alt="" />}
    </div>
  );
}
