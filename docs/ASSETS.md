# Asset Manifest

Everything in `assets/` and how it gets into a running app.

## Cursors — the "Tailless Smooth" set

`assets/cursors/` is the only asset this package ships *to apps*. 32×32 PNGs,
wired up purely in `globals.css` ([DESIGN_LANGUAGE.md §6.1](DESIGN_LANGUAGE.md#61-cursors)). No JS.

**Getting them into the app.** A CSS `cursor: url()` is resolved against the
document, so it cannot reach into `node_modules`; the PNGs must land in the
served static directory. The package's bin does that:

```jsonc
"scripts": { "postinstall": "nexis-design-assets" }   // -> public/cursors/
```

`nexis-design-assets <dir>` targets another directory. It is idempotent.

- 29 cursor PNGs: `arrow, pointer, text, text_h, wait, progress, help,
  crosshair, all_scroll, not_allowed, no_drop, grab, grabbing, col_resize,
  row_resize, ns_resize, ew_resize, nesw_resize, nwse_resize, zoom_in, zoom_out,
  copy, alias, cell, account, location, handwriting, drag_alias, drag_copy`.
- `hotspots.json` — the click-point `[x,y]` within each 32×32 image (read from
  the original `.cur` headers). The values baked into the `globals.css`
  `url(...) x y` rules are the authoritative ones the browser uses; this JSON is
  the catalog/reference.

**Coverage in CSS**: base `html` cursor = arrow; interactive roles
(`a,button,[role=…],select,summary,label[for],…`) = pointer; text inputs = text;
and **every Tailwind `.cursor-*` utility is overridden** to the matching PNG so
`className="cursor-col-resize"` just works. The override rules sit after the
Tailwind `@import` so cascade order wins.

To add a cursor: drop `foo.png` (32×32) in the folder, add its hotspot to
`hotspots.json`, and add a `.cursor-foo { cursor: url('/cursors/foo.png') x y, foo }`
rule (plus any role selector) in `globals.css`.

## `assets/brand/` — the gallery's, not yours

`assets/brand/nexis-logo.png` is Nexis's own icon. The gallery and the README
screenshots use it, and `scripts/new-app.sh` copies it to
`src-tauri/icons/icon.png` as a **placeholder** for `pnpm tauri icon`. It is
not synced into apps, and shipping an app with it is shipping Nexis's mark.

## Logos and app icons — per app, not here

Each app owns its own mark. The old blueprint shipped a shared `logo.png`,
`AppLogo.tsx` and installer header; they were Nexis's own and are not part of
this package. For a new app:

- **`src/AppLogo.tsx`** (`new-app.sh` writes a starter) — an inline SVG in the family grammar:
  48×48 viewBox, `rx=12` tile filled with `currentColor`, flat geometric marks
  drawn in `var(--background)` so they punch through in both modes (see
  PITFALLS.md §5).
- **`public/logo.png`** (512×512) where a raster is needed.
- **App icons** — generate the platform set from one 1024² source with
  `pnpm tauri icon <source>.png`.
- **Windows installer header** — supply your own image for
  `bundle.windows.nsis.headerImage`, or drop the key.
