# nexis-design

```
@nexis/design   coral on glass, one accent, a terminal's sense of time
```

The design system for the **Nexis** family of Tauri desktop apps: OKLCH
tokens, 22 themes and the engine that swaps them at runtime, ~70 React
components, the motion vocabulary, borderless window chrome, the cursor set,
seven app templates — and the rules that hold them together. It is the same
layer [Nexis](https://github.com/rwetz/Nexis) itself is built on.

![Nexis Design — the gallery overview, Nexis Default, dark](docs/img/showcase-dark.png)

| Halcyon, light | High contrast, on top of any theme |
|---|---|
| ![Overview — Halcyon light](docs/img/showcase-light.png) | ![Controls under high contrast](docs/img/high-contrast.png) |

**The gallery** (`pnpm dev`) — every component, every theme, every template,
with the theme, mode and command palette in the title bar:

| Controls — Nexis Default | Controls — Meridian, light |
|---|---|
| ![Controls — dark](docs/img/components-controls.png) | ![Controls — Meridian light](docs/img/components-controls-light.png) |

| ![Menus with a cascading submenu](docs/img/components-menu.png) | ![Command palette — fuzzy ranked, grouped](docs/img/components-palette.png) |
| --- | --- |
| ![A destructive confirm dialog](docs/img/components-dialog.png) | ![Details sheet — Cinder, light](docs/img/components-sheet.png) |

![Forms — field, select, number input, date picker, calendar, accordion (Thicket)](docs/img/components-forms.png)

![Data — sortable table, property list, tree, a 10,000-row virtual list, timeline, avatars](docs/img/components-data.png)

| ![Charts — stats, line with comparison, bars, sparklines, heatmap](docs/img/components-charts.png) | ![Navigation — sidebar, tabs, gliding sub-tabs, toolbar, pagination, steps](docs/img/components-navigation.png) |
| --- | --- |
| ![Toasts on the house surfaces](docs/img/components-toasts.png) | ![Layout — resizable splits, scroll area, card (Tokyo Night)](docs/img/components-layout.png) |

![Motion, caught mid-frame: a stagger arriving, a result landing, the aurora around the composer](docs/img/motion-midframe.png)

**Twenty-two themes** — seventeen Nexis palettes generated from one OKLCH
ramp, five credited community ones, each light and dark, every one held to
the same contrast floors by the tests
([DESIGN_LANGUAGE §2.4](docs/DESIGN_LANGUAGE.md#24-themes)):

| Dark | Light (Aurelian applied) |
|---|---|
| ![Themes — dark](docs/img/themes-dark.png) | ![Themes — light](docs/img/themes-light.png) |

| ![Foundations — surfaces, signals, type, radius, motion tokens, cursors](docs/img/foundations.png) | ![Icons — one choke point, five sizes, weight as state](docs/img/icons.png) |
| --- | --- |

![Window chrome — title bar, sidebar, status bar; Windows/Linux and macOS](docs/img/chrome.png)

**App templates** — whole apps to start from (`scripts/new-app.sh`):

| ![Dashboard](docs/img/app-dashboard.png) | ![Workbench — Halcyon](docs/img/app-workbench.png) |
| --- | --- |
| ![Settings — Aurelian, light](docs/img/app-settings.png) | ![Explorer — light](docs/img/app-explorer.png) |
| ![Console — Cinder](docs/img/app-console.png) | ![Wizard — Ultramarine](docs/img/app-wizard.png) |

## Scope

**For:** Tauri v2 desktop apps on React 19 + TypeScript + Tailwind v4
(Vite). Themes are CSS variables, the chrome is React calling
`@tauri-apps/api`, the cursors are CSS — none of it transfers to a native
toolkit, and it does not try to.

**Not for:**

- **Native GPU-rendered apps** — that is the
  [Ferrite](https://github.com/rwetz/ferrite-design) family, which keeps
  this package's *rules* (one accent, tokens with one source of truth, a
  shared motion vocabulary, self-drawn chrome, no flash, tripwire tests) and
  replaces its *look* with amber on iron, 0px corners and dither. The
  side-by-side is
  [DESIGN_LANGUAGE.md §1](docs/DESIGN_LANGUAGE.md#1-nexis-and-ferrite-the-same-rules-two-looks).
- **Websites** — `nexis-website` and `nexis-wiki` share the brand, not this
  package.

## What's in it

| | |
|---|---|
| `theme/` | 22 themes (17 generated Nexis palettes + 5 community), `applyTheme`, and `ThemeProvider` / `useTheme`: light/dark/system, high contrast on top of any theme, the default theme's rainbow hover, the palette epoch, a View Transition crossfade (hard cut on Linux). |
| `styles/` | `globals.css` — OKLCH tokens, status tones that follow the theme, the motion tokens and classes, chrome, scrollbars, cursors, high contrast; `globals.ide.css` adds xterm/CodeMirror; `fonts.css` (Geist, Geist Mono, Space Grotesk); `tokens.ts` to read colours back for canvas/WebGL. |
| `components/ui/` | ~70 components: controls, forms, overlays, command palette, navigation, data (table, tree, virtual list), charts, feedback, layout ([COMPONENTS.md](docs/COMPONENTS.md)). |
| `components/` | Chrome — `TitleBar`, `StatusBar`, `WindowControls`, `WindowResizeEdges` — and the motion moments (`SceneEnter`, `ResultArrival`, `AuroraBorder`, …). |
| `icon/` | `<Icon name="…" />`: 172 semantic names over Phosphor, five sizes, weight as state. The only module allowed to import an icon vendor. |
| `lib/` | Platform facts and key labels, the motion constants, fuzzy matching, sorting, calendar dates, formatting. |
| `assets/cursors/` | The "Tailless Smooth" cursor set, 29 PNGs. |
| `templates/` | Dashboard, workbench, settings, explorer, console, wizard, minimal. |
| `gallery/` | The interactive gallery (`pnpm dev`). |

## Use

```bash
scripts/new-app.sh nexis-pulse dashboard     # a complete Tauri app from a template
```

Or add it to an existing app — from git, pinned (there is no npm publish):

```jsonc
"dependencies": { "@nexis/design": "github:rwetz/nexis-design#<rev>" /* + its peers */ },
"scripts": { "postinstall": "nexis-design-assets" }      // cursors -> public/cursors/
```

```css
@import "@nexis/design/styles/globals.css";     /* scans its own components; nothing else to configure */
```

```tsx
import { ThemeProvider, TooltipProvider, Toaster, TitleBar, StatusBar, Button, Icon } from "@nexis/design";

<LazyMotion features={domAnimation} strict>
  <ThemeProvider storageKey="my-app">
    <TooltipProvider>
      <TitleBar title="My App" />
      <Button variant="brand"><Icon name="play" /> Run</Button>
      <StatusBar left="Ready" />
    </TooltipProvider>
    <Toaster />
  </ThemeProvider>
</LazyMotion>
```

Full walkthrough: [docs/SCAFFOLDING.md](docs/SCAFFOLDING.md). For coding
agents: [AGENTS.md](AGENTS.md) — templates by app type, the rules, an exact
(compiled) API cheat sheet. Claude Code gets a `nexis-scaffold` skill.

```bash
pnpm install
pnpm dev                       # the gallery; ?theme=aurelian&mode=light&contrast=high pins the look
pnpm test                      # contrast floors × 22 themes, design-rule tripwires, logic, every template mounts
pnpm typecheck
pnpm screenshots               # regenerate every image in this README from the live gallery
```

## Docs

- [DESIGN_LANGUAGE.md](docs/DESIGN_LANGUAGE.md) — the language: colour, type,
  icons, space, motion, chrome, surfaces, the theme engine, the checklist.
- [COMPONENTS.md](docs/COMPONENTS.md) — every component by family, where it
  came from, and the rules for writing one.
- [SCAFFOLDING.md](docs/SCAFFOLDING.md) — a new app, step by step.
- [PITFALLS.md](docs/PITFALLS.md) — field notes; read before scaffolding.
- [ASSETS.md](docs/ASSETS.md) — cursors, and why logos are per app.
- [ROADMAP.md](docs/ROADMAP.md) — what "one design layer for the family"
  still needs.

## Upgrading from 0.1

0.2 brings the package back in step with Nexis 1.31 and adds the components,
so it is a breaking upgrade for 0.1 apps (`nexis-atlas` is one):

- **New peers.** Install `@phosphor-icons/react`, `cmdk`,
  `react-resizable-panels`, `@tanstack/react-virtual`,
  `@fontsource-variable/geist`, `@fontsource-variable/geist-mono` and
  `@fontsource-variable/space-grotesk`; `@hugeicons/*` and
  `@fontsource-variable/inter` are no longer used. `fonts.css` now loads
  Geist, so a missing font package is a build error, not a fallback.
- **Theme storage keys** are now `<storageKey>:mode` / `:theme`. 0.1's
  `atlas-ui-theme-*` keys are still *read*, so users keep their theme — but
  update `index.html`'s bootstrap to the new key.
- `ResizeHandles` is now `WindowResizeEdges` and Linux-only (the old name
  still works). `spring`, `tween` and `BUILTIN_THEMES` still export, marked
  deprecated.
- The `@source "…/node_modules/@nexis/design/src"` line is no longer needed
  (harmless if left).

## License

[Apache-2.0](LICENSE), matching the rest of the family. Fonts are loaded from
Fontsource under their own licenses (Geist and Geist Mono: OFL-1.1; Space
Grotesk: OFL-1.1). Icons: Phosphor (MIT).
