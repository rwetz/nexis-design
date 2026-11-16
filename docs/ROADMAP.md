# Roadmap

## Phase 2 · Components

- Typeahead selection via `Combobox`, controlled multi-selection in
  `DataTable` and `Tree`, and a bounded `DateRangePicker`.
- Virtualized `DataTable` rows, plus timestamp axes and legends in
  `LineChart`. Try these in the gallery's Forms, Data and Charts pages.
- The optional [surface and IDE exports](COMPONENTS.md#optional-surface-and-ide-entry-points)
  provide Nexis's WebGL backgrounds and adapters for xterm and CodeMirror.

## Phase 3 · Quality and releases

- `new-app.sh` includes a [desktop release workflow](SCAFFOLDING.md#desktop-releases)
  and offers `settings-deep` for chapter and group navigation driven by
  the settings registry.
- CI builds a fresh scaffold and checks Rust on Linux, macOS and Windows.
  It also compares gallery screenshots against committed images and runs
  axe across gallery pages and app templates in light, dark and high contrast.
  The browser job uses the pinned Playwright Linux image for consistent renders.
  [The axe baseline](../scripts/a11y-baseline.json) tracks existing findings.
- `pnpm bundle:check <app>` measures tree-shaking against a generated app.
  Charts and virtual lists are available as direct component entry points.

## Phase 4 · Theme tooling

- `nexis-design theme new <id> --hue <degrees>` generates a light and dark
  palette with the Nexis OKLCH ramp and checks its contrast floors.
- The Lumen v1 palette round-trip test checks the ordered palette export,
  the background and primary roles on import, and invalid input handling.

See [CHANGES.md](CHANGES.md) for package adoption and scaffold instructions.
