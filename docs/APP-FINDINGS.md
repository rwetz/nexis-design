# App findings

Things apps in the family ran into while building on `@nexis/design` that
belong back here: gaps in components, rules that did not stretch far enough,
and traps worth a pitfall. Newest app first. Each entry: what happened, the
fix to make in nexis-design, and what the app does meanwhile. Scaffolding
problems go in `SCAFFOLD-ISSUES.md` instead.

## Status (2026-11-10, `scaffold-sweep`)

| # | Status | Where |
|---|---|---|
| 1 | Fixed | RULES R4.2, "the deep case" |
| 2 | Fixed | `SettingsTree` in the package, on the gallery's Navigation page. Not yet wired into the `settings` template |
| 3 | Partly | `findSettings`, `locateSetting`, `settingsTreeNodes` and the `SettingsChapter` type in the package; the `settings` template does not use them yet |
| 4 | Fixed | `SettingsPage`, `SettingsGroup`, `SettingRow` spread `id`, `data-*` and the rest onto their roots |
| 5 | Fixed | `useGlidingRail` returns `setContainer`, a callback ref |
| 6 | Fixed | `use-gliding-rail.ts` comment and COMPONENTS.md |
| 7 | Fixed | `SettingsPage` `titleClassName` and `inset={false}` |
| 8 | Fixed | `fetchData` and `fetchJson`, with tests |
| 9 | Open | No family release template yet (ROADMAP Phase 3) |
| 10 | Fixed | `test/setup.ts` stubs `IntersectionObserver`; PITFALLS §15 |
| 11 | Fixed | Changes in one tick share one view transition; a skipped one is not an error |

BibleLM can drop its workarounds (the cast in `SettingsTree`, its own
`SettingsTree` and registry, the wrapping `div`s, `fetchData`) once it moves
its pin past this change.

## Vitrine (2026-11-10, brought up to `23e14a7`)

Vitrine's storefront and card showmanship were promoted into the package
(`ProductCard`, `Shelf`, `FilterPanel`, `CardTilt`, `CollectionCard`). Moving
Vitrine onto them (branch `nexis-design-sync` in `apps/vitrine`) found these.
The files named below are in `apps/vitrine`.

| # | Kind | Finding | Fix in nexis-design | Vitrine meanwhile |
|---|---|---|---|---|
| 1 | Component | **`ProductCard` takes only an image URL and three aspects.** Vitrine's covers need their own element: `referrerPolicy="no-referrer"` (stores refuse hotlinked pictures that send a referrer), a fallback once the picture fails, a wide box set fitted whole over a blurred copy of itself, and a face whose ratio follows the picture. | A `media` slot (any node) beside `image`, or `imgProps`, and an `aspect` that also takes a number. | Its own `ProductCard` in `src/shop.tsx`, built on `CardBadge`, `PriceTag`, `.nexis-face` and `data-tilt`/`data-foil`. |
| 2 | Component | **`Shelf`'s strip covers its own arrow buttons.** The strip's `-my-6 py-6` (room for a lifted card) reaches up over the bottom of the header row, which is not positioned, so the arrows cannot be clicked near their bottom edge (`elementFromPoint` returns the strip). | Make the header row `relative z-10`. | `className="[&>div:first-child]:relative [&>div:first-child]:z-10"` on `Shelf`. |
| 3 | Component | **`Shelf enter` staggers through a `style` prop.** It clones each child with `--i` in `style`, so an app component that does not pass `style` to its root gets every card hopping at once, with no error. | Say so in the `Shelf` comment and COMPONENTS.md, or stagger from CSS (`:nth-child`, or `sibling-index()` where supported) and drop the clone. | `ProductCard`, `CollectionCard` and the Main Street shopfront forward `style`. |
| 4 | Component | **`CollectionCard` has no colour of its own.** Vitrine tinted each hand with a colour from its name, so a row of collections is not one grey. | A `tone` prop (any CSS colour) for the tint, defaulting to today's neutral. | `className="vitrine-collection"` and a `.vitrine-collection .nexis-collection-tint` rule in `src/fun.css`, from `--awning`. |
| 5 | Component | **The light needs a leaning face.** A `data-tilt="flat"` card with no `.nexis-face` (Vitrine's glance cards, which show prices and must not move) gets no light under the pointer. | Draw the light on `[data-tilt]:not(:has(.nexis-face))::after` too, or a `data-tilt="light"` mode. | Its own `[data-tilt="light"]` rules in `src/fun.css`. |
| 6 | Pattern | **`CardTilt` is the only switch for an app with levels.** Unmounting it stops the lean and the light, but the hover lift, the foil and `Shelf enter` are CSS that runs wherever `data-tilt` or `data-seen` is set. Vitrine's Calm has no lift or hop, and only Over the top shines. | Have `CardTilt` mark the root while mounted (`data-card-tilt`) and gate the lift, foil and hop on it, or take `foil` and `enter` levels as props. | Overrides in `src/fun.css` keyed on `:root[data-fun]`. |
| 7 | Testing | **`tiltFor` has no test.** Vitrine tested its copy (rests level at the middle, a corner leans the most, outside the card counts as its edge, a zero-size card does not divide by zero, `most = 0` does not lean) and dropped that test with the copy. | Move those cases into the package's tests. | Nothing. |
| 8 | Pitfall | **A `file:` dependency's new exports are missing in `vite` dev until its prebundle is rebuilt.** After the pin moved, the dev page was blank: `does not provide an export named 'CardTilt'`. `pnpm build` was fine. | A line in PITFALLS and in the CHANGES.md "Apps must" boilerplate: after bumping, delete `node_modules/.vite` (or start Vite with `--force`). | Deleted `node_modules/.vite`. |

## BibleLM (2026-11-10, pinned at `cfb2b06`)

BibleLM has its own design language now (the Scriptorium: blackletter,
Garamond, dithered engravings, one rubric or gilt accent), branched off
Nexis. It still uses the components and the rules underneath, so what it
learns about them is reported here. Its code is in
`apps/biblelm`; the files named below are there.

| # | Kind | Finding | Fix in nexis-design | BibleLM meanwhile |
|---|---|---|---|---|
| 1 | Rule gap | **R4.2 has no answer for deep settings.** Its flat `SidebarNav` stops working past a handful of sections: BibleLM has seven chapters, nineteen groups and about forty settings, and one long page or one flat nav both lose people. | Add a tree nav to R4.2 for apps with more than about eight sections: chapters, and their groups on a spine under each, with search. See finding 2 for a working version. | `SettingsTree` (below). |
| 2 | Component | **`SettingsTree`**, a candidate for the package beside `SidebarNav`. A contents page: each chapter has a leading mark (a numeral or an icon) and its groups hang from a 1px spine. Two `useGlidingRail`s share one container: a soft highlight glides between chapters, and a 2px accent mark rides the spine to the group in view (the page runs a scroll spy). Opening a chapter folds the rest; chevrons open others to look. WAI-ARIA tree keys. A search box above it narrows the tree to matching settings, with each setting's group shown as `meta`, and Enter opens the first one. It knows nothing about the app: `nodes`, `chapter`, `section`, `onSelect`, `openAll`. | Move it into `src/components/ui/settings-tree.tsx`, add it to the `settings` template behind a switch for the deep case, and document it in R4.2 and COMPONENTS.md. The search and the registry (finding 3) belong in the template, not the component. | `src/features/settings/SettingsTree.tsx`. |
| 3 | Pattern | **One settings registry for the nav, the search and the palette.** BibleLM's palette had its own hand-kept list of "Settings: …" commands with keywords, and it drifted from the page. Now one tree of chapters, groups and settings (each with keywords) drives the nav, the search, and the palette commands, and a palette command opens the right chapter and flashes the row. | Put this shape in the `settings` template: a `SETTINGS` registry, `findSettings(query)` (label prefix, then label contains, then keywords) and `locateSetting(label)`, and a palette command per setting that deep-links and flashes. | `src/features/settings/sections.ts`, with `sections.test.ts`. |
| 4 | Component | **`SettingRow` and `SettingsGroup` take no `id` or `data-*` props.** A deep link (from search or the palette) needs to find a row and a group in the DOM to scroll to them and flash them, and the scroll spy needs to observe groups. | Spread the rest of the props onto the root element of `SettingRow`, `SettingsGroup` and `SettingsPage`, as the shadcn components do. | Wraps each in a `div` carrying `data-setting` or `id`. |
| 5 | Component | **Two `useGlidingRail`s cannot share a container without a cast.** `containerRef` is a `RefObject`, so attaching two rails to one element means writing `.current` by hand through a `MutableRefObject` cast. | Accept an optional external container ref in `useGlidingRail`, or return a callback ref (`setContainer`) beside `containerRef`. | One callback ref that writes both, with a cast. |
| 6 | Docs | **Rail items must have no positioned ancestor between them and the container.** The rail measures `offsetTop`, which is relative to the nearest positioned ancestor. In a tree, the collapsible group wrappers must stay `position: static` or the marks land in the wrong place. Each item can itself be `relative`. | Say so in `use-gliding-rail.ts`'s comment and in COMPONENTS.md wherever the rail is offered for reuse. | Group wrappers are left unpositioned. |
| 7 | Component | **`SettingsPage` fixes its title at `text-lg` inside an `h1` with `font-semibold`.** An app whose language uses a display face for page titles has to pass a span that undoes the weight (`font-normal`) and sets its own size. Its `p-page` also has to be overridden (`p-0`) when the page sits beside a tree inside an app's own page padding. | Either a `titleClassName`, or document that `title` takes a node and the app owns its face. Let `className` drop the padding without `tailwind-merge` doing the work quietly. | Passes a Garamond span and `p-0`. |
| 8 | Pitfall | **A missing data file comes back as the app's own page, `200 text/html`.** See PITFALLS §14. In BibleLM a loader caught fetch errors but not the `JSON.parse` that came after, so interlinear reading of a book with no data showed a spinner forever. | PITFALLS §14 and a gotcha line in AGENTS.md (this change). A small `fetchData` helper in the package that throws on a non-OK response or an HTML content type would save every app the same bug. | `fetchData` in `src/lib/bible.ts`. |
| 9 | Release | **A release job that builds git-ignored assets once and hands them to the installer builds by an explicit list will drift.** BibleLM 2.2.0 shipped without two art folders added after the list was written; the build passed. | If the family gets a release template, upload the whole parent folder, set `if-no-files-found: error`, and keep a test that checks every git-ignored folder under `public/` is covered by the upload. | `.github/workflows/release.yml` and `scripts/release.test.mjs`. |
| 10 | Testing | **jsdom has no `IntersectionObserver`.** A scroll spy crashes a page in the app's smoke test. The package's setup stubs `ResizeObserver` but nothing stubs this one. | Stub it in the test setup that the templates ship, or note it beside the `ResizeObserver` stub. | The scroll spy skips itself when it is missing. |
| 11 | Component | **A scheme change logs `AbortError: Transition was skipped`.** BibleLM's schemes set the theme and the mode together, and `ThemeProvider` started a view transition for each; the second aborted the first, whose promises were never caught. Seen during the November polish (BibleLM `docs/evals/polish-2026-11-01.md`). | Batch changes made in the same tick into one transition, and catch the transition's promises: the crossfade is cosmetic. | Nothing; the error is harmless but noisy. |
