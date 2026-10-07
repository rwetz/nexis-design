# Roadmap

What "the whole family on one design layer" still needs, in order. Honest
about what is not done.

## Where it stands (October 2026, 0.2.0)

- **In step with Nexis 1.31** for everything Nexis has: the 22 themes and the
  contrast tests, `applyTheme`, the stylesheet (motion tokens, high contrast,
  rainbow accent, chrome, cursors), the icon registry, and 46 of its
  `components/ui` files.
- **New here:** 21 components Nexis has no shared version of (data table,
  tree, charts, calendar, sidebar nav, title/status bars, palette…), status
  tones that follow the theme, seven app templates, a gallery, a scaffold
  script, and tripwire tests for the design rules.
- **Not yet consumed by Nexis.** Nexis still carries its own copies. Until it
  imports from here, "in step" is a promise kept by hand — the drift this
  package was extracted to end can start again in the other direction.

## Phase 1 — make it the one copy (next)

1. **Nexis consumes the package**, file by file: `applyTheme.ts` and the
   theme files first (byte-identical today), then `globals.css`, `icon.tsx`,
   the ui components. Each step is a delete in Nexis plus an import.
2. **Pin consumers.** `nexis-atlas` depends on `github:rwetz/nexis-design`
   unpinned, so it moves whenever `main` does. Pin it to a rev, and install
   0.2's new peers (`@phosphor-icons/react`, `cmdk`,
   `react-resizable-panels`, `@tanstack/react-virtual`, the three
   `@fontsource-variable` faces) before moving it to 0.2.
3. Upstream the two theme-agnostic fixes made here into Nexis: `CallChip`'s
   live dot and the success toast border used stock `emerald-500` (now
   `success`).

## Phase 2 — close the component gaps

- Combobox (typeahead select), multi-select in `DataTable` and `Tree`, date
  *range* picker, a virtualised table, chart legend and time axis.
- `SurfaceLayer` (animated backgrounds) as an optional entry point
  (`@nexis/design/surface`) so it does not cost `ogl` to apps that skip it.
- The terminal and editor theming (`terminalTheme.ts`, the CodeMirror theme
  bridge) as an optional `@nexis/design/ide` entry.

## Phase 3 — quality and trust

- Visual regression: diff `pnpm screenshots` against the committed images in
  CI, so a change that moves pixels says so.
- Accessibility pass with axe on every gallery page and template, both
  modes, high contrast.
- Run the scaffold in CI: `new-app.sh` → `pnpm build` → `cargo check` on
  Linux, macOS and Windows.
- Bundle size: the root barrel pulls every component; measure tree-shaking in
  a scaffolded app and split heavy entries (charts, virtual list) if needed.

## Phase 4 — tooling

- `nexis-design theme new` — wrap Nexis's palette generator so a new theme is
  one command and passes the floors by construction.
- A Lumen-style theme exchange round-trip test.

## Risks worth naming

- **Two sources of truth until Phase 1.1 lands.** Every week Nexis evolves
  without consuming this package is a week of drift to reconcile.
- **Unpinned consumers** break on every breaking release (0.2 is one).
- **The barrel export** means an app that imports one component still asks
  its bundler to resolve every peer — install all of them.
