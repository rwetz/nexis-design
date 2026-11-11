# Scaffold issues

Problems hit while scaffolding apps with `scripts/new-app.sh` and the
`nexis-scaffold` skill, logged so they can be fixed here. Newest app first.
Each entry: what happened, the cause, the fix to make in nexis-design, and
whether the app already carries a local workaround.

Environment: Windows 11, Git Bash for the script, PowerShell for the user,
pnpm 11.22, Node 26.

## Status (2026-11-10, `scaffold-sweep`)

Checked by scaffolding a fresh app with `NEXIS_PATH` from Git Bash, then
`pnpm install` and `pnpm build` (no warnings about the `pnpm` field, no
em dashes in the output). `pnpm tauri dev` was not run (no local Rust
builds), so the icon fix is checked by the files being there, not by a
compile.

| # | Status | Where |
|---|---|---|
| 1 | Fixed | `new-app.sh` writes `file:<relative path>`, checks that `NEXIS_PATH` is a checkout of the package; PITFALLS §16 |
| 2 | Fixed | Placeholder desktop icons ship in `templates/icons/` and are copied in |
| 3 | Fixed | `pnpm icons` runs `tauri icon` and deletes `android/` and `ios/`; both are in `.gitignore` too |
| 4 | Fixed | No `pnpm` block in the generated `package.json` |
| 5 | Fixed | Text rewritten; the em-dash tripwire now reads `new-app.sh` whole, and the templates' comments are clean |
| 6 | Fixed | Skill says one UI face, no `font-heading` |
| 7 | Fixed | `.gitignore` (already written; now also `*.log` and the mobile icon sets) |
| 8 | Fixed | `CLAUDE.md` with `@AGENTS.md` |
| 9 | Fixed | Workspace header on every generated source file (the template banner is replaced), README skeleton in the Ferrite style, brand marks in `docs/brand/` |
| 10 | Fixed | The script prints a `.claude/launch.json` entry; the skill says to add it |
| 11 | Fixed | Skill step 5: `PROJECTS.md` row, launch entry, audit script |
| 12 | Fixed | `Toolbar` is a `toolbar` size container; `explorer` hides Status and Mine as it narrows (both stay in the palette); search shrinks; RULES R4.7 |
| 13 | Fixed | `explorer` has a Table / Grid view switch (`ThumbnailGrid`) |
| 14 | Fixed | `ThumbnailCard` `aspect` (`square`, `portrait`, `landscape`) and an `overlay` slot |
| 15 | Fixed | PITFALLS §16, AGENTS.md §4 |
| 16 | Fixed | Collapsed `SidebarNav` buttons carry `aria-label` (with the count: "Cart, 3"); regression test in `test/render.test.tsx` |
| 17 | Fixed | Collapsed `SidebarNav` shows `meta` as a count badge, or a dot when it is not a short value |
| 18 | Fixed | `cart`, `bag`, `heart`, `store`, `package` |
| 19 | Fixed | `ProductCard`, `PriceTag`, `CardBadge`, `Shelf` (Vitrine's `StoreCard`, `CollectionCard` and `CategoryTile` stay in the app: too specific) |
| 20 | Fixed | "Hero / summary banner" recipe in AGENTS.md §1 |
| 21 | Fixed | Port derived from the name (1420 to 1819), `NEXIS_PORT` overrides; SCAFFOLDING Step 4 |
| 22 | Fixed | SCAFFOLDING Step 4: dev helpers must exit with their parent |
| 23 | Fixed | `FilterPanel`, `ActiveFilters` (Vitrine's version, made generic) |
| 24 | Fixed | `RangeInput` (two optional bounds as text, `rangeBounds` to read them). `NumberInput` is unchanged |
| 25 | Fixed | Cheat sheet shows `type="multiple"` and a numeric `meta` |
| 26 | Fixed | "Catalogue with varied item types" recipe in AGENTS.md §1 |

## nexis-wishlist, now Vitrine at `apps/vitrine` (2026-11-05, `explorer` template)

| # | Severity | Issue | Fix in nexis-design | App workaround |
|---|---|---|---|---|
| 1 | Blocker | `NEXIS_PATH=$(pwd) scripts/new-app.sh ...` in Git Bash writes `"@nexis/design": "file:/c/Users/..."` into `package.json`. Windows pnpm cannot read a `/c/...` path: `ERR_PNPM_LINKED_PKG_DIR_NOT_FOUND`. The install then appears to be a network problem (a stream of `UND_ERR_DESTROYED` registry warnings), which hides the real cause. | In `new-app.sh`, convert `NEXIS_PATH` with `cygpath -m` when available, or better, write a path relative to the new app (`file:../nexis-design`). Also fail early with a clear message if the resolved directory does not exist from the app's point of view. | Edited to `file:../nexis-design`. |
| 2 | Blocker | `pnpm tauri dev` fails in the build script: `src-tauri/icons/icon.ico not found; required for generating a Windows Resource file`. The scaffold ships only `icon.png`. The script's "Next" text lists `pnpm tauri icon` as step 2 but it is easy to skip and the failure comes after minutes of Rust compiling. | Have `new-app.sh` run `pnpm tauri icon` itself after install, or ship a placeholder `icon.ico` and `icon.icns` in the template. At minimum, make `tauri.windows.conf.json`/`build.rs` fail early with the instruction. | Ran `pnpm tauri icon src-tauri/icons/icon.png`. |
| 3 | Minor | `pnpm tauri icon` also writes `src-tauri/icons/android/` and `ios/` for a desktop-only app. | Document `--output`, or prune those folders in the scaffold step. Add them to the template `.gitignore` or delete after generation. | Left in place. |
| 4 | Warning | pnpm 11 prints `The "pnpm" field in package.json is no longer read ... pnpm.onlyBuiltDependencies ignored` on every command. The scaffold writes the field in `package.json` and also `allowBuilds` in `pnpm-workspace.yaml`, so it is duplicated. | Drop the `pnpm` block from the template `package.json`; keep `allowBuilds` in `pnpm-workspace.yaml`. | Removed the block. |
| 5 | Docs | The scaffolded `AGENTS.md` contains an em dash after "Read @nexis/design's AGENTS.md (...)", which breaks Nexis rule 13 (no em dashes in docs). | Fix the template text in `new-app.sh`. Run the em-dash tripwire over the generated `AGENTS.md` as well as `src/`. | Rewrote the app's `AGENTS.md`. |
| 6 | Docs | Contradiction on `font-heading`: AGENTS.md rule 6 says there is no `font-heading`; `.claude/skills/nexis-scaffold/SKILL.md` section 4 says "`font-heading` only for titles". | Remove the phrase from the skill. | None needed. |
| 7 | Gap | Scaffold writes no `.gitignore`, so `node_modules/`, `dist/` and `src-tauri/target/` are not ignored. | Add a template `.gitignore` (`node_modules/`, `dist/`, `src-tauri/target/`, `*.log`). | Wrote one. |
| 8 | Gap | Scaffold writes `AGENTS.md` but no paired `CLAUDE.md`. The workspace rule (`Dev/AGENTS.md` rule 9) requires `CLAUDE.md` containing `@AGENTS.md`. | Have `new-app.sh` write `CLAUDE.md` with `@AGENTS.md`. | Wrote it. |
| 9 | Gap | Generated `src/App.tsx` carries the template banner ("@nexis/design: app template / explorer") instead of the workspace file header (Ryan Wetzstein / project name / 2026), and no `README`. The workspace requires the header on every authored source file and a Ferrite-style README (logo, screenshot, badges, mark footer). | Add a `--header` step in `new-app.sh` that writes the workspace header with the project name, and a README skeleton with the brand footer. | Header added by hand on files I wrote; no README yet. |
| 10 | Gap | No dev-preview config. Preview tooling reads `Dev/.claude/launch.json`; a scaffolded app is invisible to it until an entry is added by hand. | Print the launch entry from `new-app.sh`, or add it when `NEXIS_PATH` points inside the Dev workspace. | Added an entry named `wishlist`. |
| 11 | Gap | New apps are not registered in `Dev/PROJECTS.md` (workspace rule 3) and the audit script is not run. | The `nexis-scaffold` skill should include "add a row to `PROJECTS.md` and run `_templates/audit-workspace.ps1`". | Done by hand. |
| 12 | Template | `explorer` toolbar does not adapt at narrow widths: at 800px the search field is truncated ("Search title, author, se") and long Segmented groups crowd out the actions. | Give `Toolbar` a wrapping or overflow-menu behaviour, or have the template hide secondary controls below a breakpoint. | Left as is. |
| 13 | Template | The `explorer` template is a table with pagination and a fixture of 124 rows. A card-grid inventory (the common case for shopping lists, libraries, media) needs `ThumbnailGrid` plus a view switch, and the "Media / gallery" recipe in AGENTS.md section 1 is only a sentence. | Add a `gallery` template, or extend `explorer` with a grid/table `Segmented` switch. This app's `src/App.tsx` is a working reference. | Built by hand. |
| 14 | Docs | `ThumbnailCard` crops every image to a square (`aspect-square object-cover`). Portrait covers (books, posters) lose their top and bottom. | Add an `aspect` prop (`square`, `portrait`, `landscape`) to `ThumbnailCard` and document it. | Left as square. |
| 15 | Docs | The "Gotchas" list has no entry for Windows path handling in `file:` dependencies or for local `NEXIS_PATH` use in Git Bash (issue 1). | Add to `docs/PITFALLS.md` once issue 1 is fixed. | None. |

### Second pass: storefront redesign (same app)

Found while rebuilding the UI as a shop (rail nav, search pill, shelves, cart).

| # | Severity | Issue | Fix in nexis-design |
|---|---|---|---|
| 16 | A11y | `SidebarNav` with `collapsed` renders icon buttons with no accessible name. The label is only in a tooltip, so the buttons read as empty to a screen reader and to `read_page` (`button [ref_4]` with no name). | Set `aria-label={item.label}` on each item button when collapsed. |
| 17 | Gap | `SidebarNav` collapsed hides `meta`, so a count such as Cart (3) cannot show on an icon rail. | Render `meta` as a small dot or count badge on the icon when collapsed. |
| 18 | Gap | The icon registry has no cart, bag, heart, store or package icon. A shopping UI had to use `bookmark-add`, `checklist`, `archive`, `trend-down` instead. | Add `cart`, `bag`, `heart`, `store` and `package` names to `REGISTRY` (one name per idea). |
| 19 | Gap | No portrait product card. `ThumbnailCard` is square (see 14), has no price or secondary line slots with the right type scale, and no overlay slot for a badge or an add button. The app built `ProductCard`, `Shelf`, `StoreCard` and `CategoryTile` in `src/shop.tsx`. | Promote these to the package as `ProductCard`, `Shelf` (a horizontal scroll row with snap), and a tile. Use `src/shop.tsx` as the starting point. |
| 20 | Gap | No hero or banner pattern. A summary banner with a headline number and an overlapping image collage was hand-built in `Home`. | Document a `Hero` recipe or component. |
| 21 | Dev | Every Nexis template pins Vite to port 1420 with `strictPort: true`. Two Nexis apps cannot run side by side, and a leftover Vite from an aborted `pnpm tauri dev` blocks the next start. | Derive the port from the app name, or document `--port` and how to change it in both `vite.config.ts` and `tauri.conf.json`. |
| 22 | Dev | When `pnpm tauri dev` exits (the icon error in 2), `tauri` kills `pnpm dev` but its grandchildren survive: here `server/index.mjs` and `vite` kept running on 8787 and 1420. Not a design-system bug, but the `beforeDevCommand` guidance should mention it. | Add a note to `docs/SCAFFOLDING.md`: long-running dev helpers must exit when their parent does. |

### Third pass: dynamic categories and filters

| # | Severity | Issue | Fix in nexis-design |
|---|---|---|---|
| 23 | Gap | No faceted filter panel. Shop-style browsing (sort radios, collapsible filter sections with counts, a price range, a clear-all) was hand-built from `Accordion`, `Checkbox`, `RadioGroup` and `Input` in `src/filters.tsx`, with the data logic in `src/facets.ts`. Every inventory, library or catalogue app will need it. | Add a `FilterPanel` component (sections, counts, range, clear) to the package. The derived-facets logic in `facets.ts` is app-specific, but the panel is not. |
| 24 | Gap | No numeric range input. A min and max price had to use two text `Input`s with `inputMode="decimal"`. `NumberInput` cannot be empty, so it cannot represent "no minimum". | Add an optional empty state to `NumberInput`, or a `RangeInput`. |
| 25 | Docs | `Accordion` with `type="multiple"` and `AccordionTrigger meta` worked well, but the cheat sheet shows only `type="single"`. | Add the multiple example and the `meta` count to the cheat sheet. |
| 26 | Template | The `explorer` template has no notion of per-type fields or dynamic columns, so an app with several product types must build its own attribute layer. `docs/PRODUCTS.md` in nexis-wishlist describes one approach (categories own fields, fields become filters). | Consider a short recipe in AGENTS.md section 1 for "catalogue with varied item types". |

### Not issues, for the record

- `pnpm dev` here starts both the Node API and Vite, so Tauri's
  `beforeDevCommand` (`pnpm dev`) brings up the API too. `pnpm tauri dev`
  therefore works against the local server once icons exist.
- All components and prop names used (`ThumbnailGrid`, `ThumbnailCard`,
  `Segmented`, `Select`, `Sheet`, `Dialog`, `AlertDialog`, `DataTable`,
  `Sparkline`, `PropertyList`) matched the cheat sheet. `tsc` and `vite build`
  passed on the first full build after adding the missing `AlertDialogTrigger`
  import (my mistake, not a design-system issue).
