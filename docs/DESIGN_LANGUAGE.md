# Nexis — Design Language

> The design language of the **Nexis** family of Tauri desktop apps, as it
> stands in Nexis 1.31 and in this package. Every value here is lifted from
> the real code — `src/styles/globals.css`, `src/theme/`, `src/icon/icon.tsx`
> — not invented. When this file and the code disagree, the code wins and this
> file has a bug.
>
> **Scope:** Tauri v2 webview apps on React 19 + Tailwind v4. Native GPUI
> apps are the [Ferrite](https://github.com/rwetz/ferrite-design) family:
> same rules, different look (§1).

---

## 0. One line

**Clean glass over neutral OKLCH greys, one accent, a terminal's sense of
time, self-drawn chrome, and a theme engine that swaps the whole palette at
runtime.**

---

## 1. Nexis and Ferrite: the same rules, two looks

Ferrite was cut from this language and deliberately kept its *rules* while
replacing its *look*. The table is the clearest statement of what is a rule
(shared) and what is Nexis's own expression of it.

| Rule (shared) | Nexis expression | Ferrite expression |
|---|---|---|
| One accent carries identity | coral `oklch(0.72 0.15 35)` on the default theme; the theme's `ring` otherwise | phosphor amber |
| Neutral base palette | cool OKLCH greys, translucent glass | near-pure iron greys, opaque |
| Tokens have one source of truth | `globals.css` + the theme engine → CSS variables | `tokens.rs` → `palette(cx)` |
| Theme on screen before first paint | `index.html` bootstrap + hidden-until-painted window | theme installed before `open_window` |
| A shared motion vocabulary | CSS tokens: `--dur-*`, `--ease-enter/exit`, caret blink, stepped spin | stepped clips at the refresh rate |
| Respect reduced motion | one `prefers-reduced-motion` rule + `useReducedMotion` on the rail | render the final state |
| Self-drawn chrome on Win/Linux, native on macOS | 12px rounded transparent frame | square frame, text-mode controls |
| Self-hosted fonts | Geist + Geist Mono + Space Grotesk | PxPlus VGA + JetBrains Mono |
| One idea, one glyph | `<Icon name>` over Phosphor | 32 pixel icons |
| Every action in a palette | `CommandPalette`, Mod+Shift+P | `CommandPalette`, Ctrl+Shift+P |
| Tripwire tests on invariants | contrast floors, icon/emoji/colour guards | contrast, glyph coverage |
| Corners | one `--radius`, pills for controls | 0px |
| Depth | surface steps + hairlines; glass blur where floating | lines and surface steps only |
| Texture | `.aurora-border`, `.brand-glow`, area gradients | ordered dither |

---

## 2. Color

### 2.1 Everything is OKLCH, everything is a token

Tokens are declared in `oklch(L C H)` in `globals.css` (`:root` light, `.dark`
dark) and every component reads them through Tailwind (`bg-card`,
`text-muted-foreground`). **A component never contains a colour literal** —
it is the one thing that cannot follow a theme change. `test/design-rules`
fails on raw hex and on Tailwind's stock palette (`emerald-500` and friends)
anywhere in `src/` or `templates/`.

| Role | Tokens |
|---|---|
| Page | `background` / `foreground` |
| Raised | `card`, `popover` (+ `-foreground`) |
| Chrome | `sidebar` (+ 7 `sidebar-*`) — title bar, nav, status bar |
| Emphasis | `primary` (neutral, high contrast), `secondary` |
| Quiet | `muted` / `muted-foreground`, `accent` (hover/selected fill) |
| Lines | `border`, `input`, `ring` (focus) |
| **The accent** | `brand` / `brand-foreground` |
| State | `destructive`, `success`, `warning`, `info` |
| Terminal | `terminal-*`: 16 ANSI + background, foreground, cursor, selection |

Dark-mode hairlines are alpha white (`oklch(1 0 0 / 10%)`), so a border reads
the same over any surface.

### 2.2 One accent

`--brand` is the only colour with an opinion. **It marks the one action a
surface exists to perform, the selected item, focus and live progress —
never decoration, never a link.** On the default theme it is coral; on every
other theme `applyTheme` points it at the theme's `ring` (falling back to
`primary`), so the whole accent system — the gliding rail, the aurora, the
chart's main series, the selected row's bar — re-tints with the theme.

`primary` is *not* the accent in Nexis: on the default theme it is a
near-black/near-white neutral, the high-contrast button for ordinary
emphasis. `variant="brand"` is the accent button.

### 2.3 State is the theme's ANSI, not a palette

`--success`, `--warning` and `--info` are the theme's own ANSI green, yellow
and blue (`var(--terminal-ansi-*)`). Every Nexis theme generates those against
its own backgrounds with contrast floors, so a status pill is legible on
Aurelian's umber and Glacier's ice without anyone checking. Error is
`--destructive`. Use `Badge variant="success"`, `StatusDot tone="warning"`,
`text-success` — never `text-emerald-500`, which is the same green on every
theme and was the commonest raw colour in Nexis before this rule.

### 2.4 Themes

22 themes, each a light and a dark variant (`src/theme/themes/`):

- **Nexis (17)** — Nexis Default, Halcyon, Meridian, Cinder, Aurelian,
  Thicket, Vermillion, then the loud half: Hotwire, Tangerine, Sulfur, Acid,
  Absinthe, Cyanotype, Glacier, Ultramarine, Ultraviolet, Synthwave. All but
  the default are **generated** from one shared OKLCH lightness ramp by
  Nexis's `scripts/generate-theme-palettes.py`, so the set holds one contrast
  profile across sixteen hues. The loud half turns *surface* chroma up, not
  just the accent — a saturated background reads as a colour, not as grey.
- **Community (5)** — Tokyo Night, Catppuccin, Nord, Gruvbox, Rosé Pine,
  credited and kept as their authors made them (held to WCAG AA only).

`themes.contrast.test.ts` re-asserts the generator's floors against the
committed files — foreground ≥ 11:1, muted text ≥ 4.5:1, the accent ≥ 4.5:1
both ways, ANSI ≥ 4:1 — so a hand edit cannot quietly break a theme. **Fix the
colour, not the floor.** Do not hand-edit a generated theme; regenerate it.

### 2.5 High contrast

`ThemeProvider` sets `html[data-contrast="high"]` from the user's preference
or the OS (`prefers-contrast: more`, `forced-colors: active`). The overrides
are declared on **`body`**, not `:root` — themes write their palette as inline
properties on `<html>`, which no stylesheet rule on `:root` can beat; custom
properties inherit, so `body` wins for everything including portals. It works
on top of every theme: muted text, borders and focus close toward the
foreground; the rainbow and the background layer switch off.

### 2.6 The default theme's rainbow

The default theme is the one neutral palette, so its hover lights the glyph
(or a text-only label) with one of four rotating gradients
(`theme/rainbowAccent.ts` decides; `globals.css` paints). Only on the default
theme, only on neutral-hover buttons (not primary, destructive, rows, menu
items or trees), off under high contrast, and on the aurora it becomes the
full spectrum. Every other theme's accent *is* its identity and must not be
overpainted.

### 2.7 Reading colours from JS

Canvas, WebGL and xterm cannot read `var(--x)`. `styles/tokens.ts`
(`readAppTokens`, `readTerminalTokens`, `resolveCssColor`) resolves tokens to
`rgb()` through a probe element — and through a 1×1 canvas, because
Chromium/WebKit now keep `oklch()` in computed styles. Re-read on
`useTheme().paletteEpoch`, not on the theme id: the id changes during the
render that requests a theme, the variables land in an effect after it.

---

## 3. Typography

| Role | Face | Token | Where |
|---|---|---|---|
| Interface | **Geist** (variable) | `font-sans` | everything by default |
| Code & figures | **Geist Mono** | `font-mono` | code, ids, paths, numbers in tables, key chips |
| Display | **Space Grotesk** | `font-heading` | dialog and sheet titles, panel titles, empty states, page headings, the big number in a stat |

Geist and Geist Mono are one designer's sans and mono, so chrome and code
share a skeleton. Space Grotesk is the family's voice and is **illegible
below ~13px** — never use it for body text, labels or menus.

Sizes are dense: 13px for trees, tables and navs; 14px for body and inputs;
12px for meta; 11px for the status bar and section labels (uppercase,
tracked). Numbers that change or align use `tabular-nums`.

The terminal resolves its own chain (`lib/fonts.ts`): an installed Nerd Font
patch first, then Geist Mono, then JetBrains Mono for Cyrillic.

### 3.1 Icons

One choke point: `<Icon name="…" />` (`src/icon/icon.tsx`). Call sites name an
*idea* — `"refresh"`, `"git-branch"` — never a vendor export, so one idea is
one glyph everywhere and swapping the vendor (Phosphor today) is a one-file
change. It is the only module allowed to import `@phosphor-icons/react`
(tripwired).

- **Five sizes:** `xs` 12 · `sm` 14 (default) · `md` 16 · `lg` 20 · `xl` 24.
  Nexis once had 13 sizes and 12 stroke weights across 160 imports expressing
  136 ideas; this is the fix.
- **Weight is state:** regular rests, `active` swaps to fill.
  `FILL_CHANGES_SHAPE` lists glyphs whose fill is a different drawing (the
  globe) and keeps them regular.
- **No emoji, anywhere** — UI, source, logs, commits. An emoji is drawn by
  the OS font: wrong colour, wrong weight, different on every platform, tofu
  on a bare Linux. Typographic marks (`→ ↵ ⇧ · ✓`) are fine. Tripwired.

---

## 4. Space and geometry

- **Radius:** one knob, `--radius: 0.625rem`, scaled sm → 4xl. Controls are
  pills (`rounded-4xl` buttons, `rounded-3xl` inputs/selects), floating
  surfaces are `rounded-3xl` (menus, popovers, command palette `rounded-4xl`),
  panels and cards `rounded-2xl`, the window itself 12px.
- **Depth:** surface steps (`background → card → popover`) plus a hairline
  ring (`ring-1 ring-foreground/6`, `/10` in dark). Shadows only on things
  that float; `backdrop-blur` only on things that float over content
  (dropped entirely on Linux — WebKitGTK re-composites it every frame).
- **Rhythm:** title bar 40px, toolbar 48px, status bar 28px, panel header
  40px, rows 28–36px, the 4px Tailwind grid between.

---

## 5. Motion

Nexis's motion is derived from what it is: a terminal. Transitions are short
and decisive; pending states *blink* at a caret's cadence instead of
breathing; indeterminate progress *ticks* because a character cell cannot
sweep. Nothing overshoots — nothing in a tool should bounce.

### 5.1 The tokens (`:root` in `globals.css`)

| Token | Value | For |
|---|---|---|
| `--ease-enter` | `cubic-bezier(0.2, 0, 0, 1)` | arriving: decelerate hard into place |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | leaving: accelerate away |
| `--dur-tap` | 90ms | toggles, chevrons, hovers |
| `--dur-panel` | 140ms | popovers, tooltips, collapsibles |
| `--dur-window` | 200ms | dialogs, sheets |
| `--dur-scene` | 420ms | a data canvas or companion window arriving |
| `--blink-cadence` | 1060ms | a VT100 caret — live indicators |
| `--tick-cadence` × `--tick-steps` | 640ms × 4 | indeterminate progress |
| `--live-cadence` | 1600ms | a long run's slow scan |

`--default-transition-duration` / `-timing-function` point at `--dur-tap` /
`--ease-enter` inside `@theme`, so **every bare `transition-*` utility
inherits the house curve** — the hundreds of call sites that never named a
duration included. Leaving is faster than arriving: `tw-animate-css`
entrances run at `--dur-panel` on the enter curve, exits at `--dur-tap` on the
exit curve.

### 5.2 The vocabulary

- `.nexis-spin` (`<Spinner>`) — four quarter-turns, stepped. Never
  `animate-spin` (tripwired).
- `.nexis-blink` (`<StatusDot live>`, `<Blink>`) — near-square wave at caret
  cadence. Never `animate-pulse` for status (skeletons keep it — a
  placeholder is a different idiom).
- `<ThoughtLine>` — a stream still arriving. **Live only**; never from stored
  state.
- Moments (`components/motion.tsx`): `<SceneEnter>` (a scene arrives once),
  `<Stagger>` (setup cards, 70ms apart), `<ResultArrival>` (one accent flash
  when a result lands), `<RunLive>` (a long run's slow scan), `<AuroraBorder>`
  (the accent traced round an element while the agent streams).
- The theme switch crossfades the whole window through the View Transitions
  API — except on Linux, where WebKitGTK's snapshot kills the web process on
  NVIDIA (PITFALLS §3).

### 5.3 JS motion is the exception

`motion` is for what CSS cannot do: a selection that **travels** and must
retarget mid-flight. `useGlidingRail` + `RailIndicator` is the rule for every
nav, tab strip and mode switch whose selection moves (`SidebarNav`,
`Segmented`, `GlidingTabs`). The mark moves by `clip-path: inset(… round r)`
— paint only, corners stay true — never by animating width. One spring
(`railSpring`: 520/40), collapsed to instant under reduced motion. Import
`m`, never `motion.*`, under `<LazyMotion features={domAnimation} strict>`.

### 5.4 Rules

1. **Motion marks events.** Entrances animate; exits are faster; live data
   never animates (a tweening chart shows values that never existed). Use
   `StatusItem live` for counters — tabular figures, no tween.
2. **Moments are moments.** The scene budget (420ms) is for a canvas or a
   window arriving, not a button or a menu.
3. **Reduced motion turns it all off** — one shared rule for CSS, `useReducedMotion` for the rail.

---

## 6. Window chrome

The family draws its own frame on Windows and Linux and keeps the native one
on macOS.

- **macOS:** `titleBarStyle: "Overlay"`, hidden title; `TitleBar` leaves the
  left 80px for the traffic lights and draws no controls.
- **Windows/Linux:** `decorations: false, transparent: true, shadow: false`.
  `main.tsx` sets `html[data-chrome="borderless"]`; `globals.css` paints 12px
  corners onto `#root` and onto Radix's portalled overlays (siblings of
  `#root`, which the mask would otherwise miss). `WindowControls` draws
  min/max/close (close hovers destructive).
- **Linux only:** an undecorated GTK window has no resize borders, so
  `WindowResizeEdges` lays invisible strips on the edges with the custom
  resize cursors and hands the gesture to the compositor. Windows does not
  need it — tao gives undecorated windows native hit-testing.
- **No flash:** the window is created hidden and shown after React's first
  paint (`setTimeout`, not rAF — rAF does not fire in a hidden window);
  `index.html` sets the mode class before the bundle loads.
- The whole title bar is a `data-tauri-drag-region`.

### 6.1 Cursors

The "Tailless Smooth" set — 29 PNGs in `assets/cursors/`, wired entirely in
CSS: the arrow on `html`, the pointer on every interactive role, the caret on
text, and every Tailwind `.cursor-*` utility overridden so
`cursor-col-resize` just works. `nexis-design-assets` copies them into
`public/cursors/` (a CSS `url()` cannot reach into `node_modules`).

---

## 7. Surfaces

The app reads as layered glass: `bg-card` / `bg-popover` with hairlines, and
`backdrop-blur` where a surface floats over content (menus, the command
palette, sticky table headers). Scrollbars are killed everywhere —
Linux/Windows Chromium bars break the chrome and macOS flashes its overlay bar
during layout — and come back per-region via `ScrollArea` or the 3px
`.nexis-scrollbar`.

**Nexis-only:** the `SurfaceLayer` (animated WebGL backgrounds behind every
pane, image backgrounds with blur) lives in Nexis, not here — it pulls in
`ogl` and five shaders that most apps should not ship.

---

## 8. Components

- shadcn conventions (`radix-luma` style): Radix primitives underneath for
  focus, dismissal and keyboard; `cva` variants; `data-slot` /
  `data-variant` / `data-size` on every root; `asChild` via `Slot`; `cn()` to
  merge classes.
- Focus is always visible: `focus-visible:ring-3 ring-ring/30` +
  `border-ring`. Buttons nudge `translate-y-px` when pressed.
- Panels frame regions (`<Panel title meta actions>`); cards are things.
- A long-running operation the user started gets a `CallChip` (how long, and
  how to stop it), not another spinner.
- Every app exposes its actions in a `CommandPalette` (Mod+Shift+P).

The catalogue is [COMPONENTS.md](COMPONENTS.md).

---

## 9. Theme engine

- A **`Theme`** is data: `{ id, name, variants: { light?, dark? } }`, each
  variant `{ colors?, terminal? }`, plus an optional `editorTheme` per mode.
- `applyTheme(theme, mode)` — the only writer — sets the variant's colours as
  inline custom properties on `<html>`, derives `--brand`, and writes the 16
  ANSI variables. `clearTheme()` removes them; the default theme *is* the
  absence of overrides (globals.css shows through), which is why its palette
  lives in the stylesheet.
- `ThemeProvider` resolves `light | dark | system` (live), the theme id
  (builtin or `customThemes`), contrast and the rainbow; persists to
  `localStorage` under `storageKey`; exposes `paletteEpoch`. An app that
  stores preferences elsewhere passes `onChange`.
- Retired ids map to survivors in `migrateThemeId`, so removing a theme never
  silently resets a user.

---

## 10. App shell

```
<LazyMotion features={domAnimation} strict>
  <ThemeProvider storageKey="my-app">
    <TooltipProvider>
      <div class="flex h-full flex-col">
        <WindowResizeEdges/>          Linux only; outside any zoom
        <TitleBar brand title center actions/>
        <div class="flex min-h-0 flex-1">
          <SidebarNav/>               or a resizable split
          <main>…<Toolbar/>…</main>
        </div>
        <StatusBar left right/>
        <CommandPalette/>             Mod+Shift+P
      </div>
      <Toaster/>
```

`.zoom-content` / `.zoom-exempt` give an app-wide Ctrl± zoom that a region
can opt out of (editors must — PITFALLS §9).

---

## 11. The checklist

An app belongs to the family when it has:

1. Colours only from tokens; **one** accent; state from the theme's ANSI.
2. All 22 themes working, light and dark, plus high contrast on top.
3. Geist / Geist Mono / Space Grotesk, each in its job.
4. `<Icon name>` only; five sizes; no emoji.
5. The motion tokens; stepped spin; caret blink; gliding rails; reduced
   motion respected.
6. Self-drawn chrome on Windows/Linux, native on macOS; 12px corners; resize
   edges on Linux; no flash on launch.
7. The cursor set.
8. A `CommandPalette` with every action.
9. Panels for regions, `CallChip` for long work, `StatusBar` for facts.
10. The design-rules tests passing — or the same rules held in the app's own.
