# Asset Manifest

Everything in `assets/` and how it gets into a running app.

## Cursors: the "Tailless Smooth" set

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
- `hotspots.json`: the click-point `[x,y]` within each 32×32 image (read from
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

## `assets/brand/`: the heptagram

The family's one mark is the heptagram (`Dev/brand/heptagram`, RULES §17).

| File | What |
|---|---|
| `nexis-mark-white.svg`, `nexis-mark-black.svg` | The mark alone, for dark and light grounds |
| `nexis-logo.svg` | The app-icon tile: the mark in frost-to-glacier on an obsidian-to-slate glass tile (Nexis Frosted Glass palette) |
| `nexis-logo.png` | That tile at 1024², the source for `pnpm tauri icon` |

In the UI the mark is `<NexisMark />`, an inline SVG in `currentColor`, never
the PNG: it is sharp at 18px and follows light and dark. The PNG and the tile
SVG are for icons, favicons and READMEs. `templates/icons/` is the platform
set generated from the PNG, copied into every scaffolded app.

## Logos and app icons

- **`src/AppLogo.tsx`** (`new-app.sh` writes it): starts as `<NexisMark />`.
  An app with a mark of its own draws it here in `currentColor`, in the same
  flat, single-weight line language as the heptagram (PITFALLS.md §5).
- **`assets/logo.svg`**: the README's logo, starting as the tile.
- **App icons**: generate the platform set from one 1024² source with
  `pnpm tauri icon <source>.png`.
- **Windows installer header**: supply your own image for
  `bundle.windows.nsis.headerImage`, or drop the key.
