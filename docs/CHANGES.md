# Changes, and what they ask of apps

Every change that an app would notice gets an entry here, newest first. The
**Apps must** line is the checklist for bringing an existing app up to it
(AGENTS.md §6, "A fix lands everywhere"). Future apps get every entry for
free: `new-app.sh` depends on the release range of the checkout it runs from.

**Versions.** New entries go at the top under `## Unreleased` (a note in
brackets is fine). `pnpm release patch|minor` folds them into one
`## X.Y.Z · date` section, tags `vX.Y.Z` and publishes a GitHub release.
Apps depend on a range, `github:rwetz/nexis-design#semver:^0.3.0`: a patch
(asks nothing of apps) reaches them on `pnpm install`; a minor (has an
**Apps must**) reaches them through `pnpm family-sync`, which opens one PR
per app with the entries it missed and their **Apps must** lines as a
checklist.

`pnpm consumers` lists every app, its pin or range, how far behind it is,
and which package components it still shadows with its own copy.

Every **Apps must** starts the same way: bump the pin, `pnpm install`, then
delete `node_modules/.vite` (or run `pnpm dev --force` once) so Vite does not
keep serving the old package (PITFALLS §17).

## Unreleased (detail pass)

- **Concentric corners (RULES R3.6).** Menu, context-menu and menubar
  items were 18px inside a 22px menu with 6px padding; they are now
  `rounded-menu-item` (16px). Palette items are `rounded-palette-item`,
  vertical tabs `rounded-tab-item`, the menubar trigger a pill. All are
  derived from `--radius`. `ProductCard` and `ThumbnailCard` pictures are
  `rounded-2xl`, so a badge pill at their 8px inset sits concentric.
- **Alpha hairlines (R6.7).** The default light theme's `--border`,
  `--input` and `--sidebar-border` were solid; they are the foreground at
  10%, which looks the same on the page and reads the same on a card. The
  generated themes were alpha already. The IDE stylesheet's breakpoint and
  current-line marks use `--destructive` and `--warning` instead of hex.
- **OKLCH gradients (R6.8).** The skeleton sheen, the tilt light, the foil
  and the collection tint interpolate `in oklch`; a tone fading into the
  card gives the card end hue `none`, so it never sweeps through a third
  colour.
- **Icon weight follows text weight (R7.5).** New `IconWeightProvider`.
  `Button`, `Badge`, `Toggle`, `TabsTrigger`, `Segmented` and menu and
  palette contents make their icons Phosphor bold, which matches Inter
  Medium's stem; text at 400 keeps regular icons.
- **Icon swaps blur through (R8.4).** `<Icon swap>` brings a changed glyph
  in out of a short blur. On the sort chevron, the window's maximise and
  restore, and the gallery's add-to-cart.
- **Clipped edges fade (R4.9).** New `useEdgeFade` hook (and
  `edgeFadeStyle`); `Strip` uses it, and the workbench template's tab strip
  fades the edge it clips.
- **Depth in the dark (R6.6).** The dark popover is a step above the card
  (it was equal to it on every theme), and in dark mode panels, cards and
  floating surfaces get a top-edge highlight, the hairline and a deeper
  shadow.

**Apps must:** bump the pin. Replace any hand-set radius on items inside a
rounded menu or list with the matching token, or derive one (outer minus
padding). A hand-built control with `font-medium` text wraps its icons in
`<IconWeightProvider weight="bold">`. Add `swap` to icons that change on a
user action. Move hand-rolled sideways scrollers onto `useEdgeFade`. Any
app CSS gradient gets `in oklch`. Look at a dark theme: a custom
`box-shadow` on a `[data-slot]` panel or menu is now overridden there.

## Unreleased (neutral `primary`)

- **`primary` is a neutral on every theme.** Every theme but the default
  ships its accent as `primary`, and `--brand` is that same colour, so the
  default button, checked checkboxes, radios and switches, the slider's
  range and the selected `GlidingTabs` tab were all a second accent (RULES
  R6.2). `applyTheme` now sets `--primary` to the theme's foreground and
  `--primary-foreground` to its background; the theme's accent reaches
  `--brand` only. The default theme looks the same.
- **Live progress is the accent.** `Progress` and `ThoughtLine` fill with
  `brand` (they were `primary`, so neutral on the default theme).
- **Text on the accent follows the theme.** `--brand-foreground` was white
  on every theme, which is hard to read on a dark theme's light accent.
  `applyTheme` now sets it from the theme (`primaryForeground`, or the
  background when the accent is a separate `ring`), keeping white where
  white reads better. A test holds it to 4.5:1 on every Nexis theme and
  mode, and 3:1 on the community ones: the light variants of Nord, Gruvbox
  and Rose Pine have a mid-tone accent that no text reaches 4.5 on.

**Apps must:** bump the pin. Anything that used `bg-primary` or
`text-primary` to mean "the theme's colour" becomes `bg-brand` or
`text-brand`, if it is one of the three things R6.2 allows; otherwise leave
it neutral. Look at every screen on one non-default theme: default buttons
and checked controls are now neutral there. Nexis takes the same change in
its own `applyTheme`.

## Unreleased · Layout, modal feedback, and identity

- Shared controls align nested corners, rails, peer segment widths and
  avatar stacks. Dialogs keep their titles and actions reachable.
- Gallery and scaffold examples give modal buttons specific names and
  connect feedback to the result.
- The [branding guide](BRANDING.md) documents the canonical icon workflow
  and the BibleLM and Vitrine references. New app READMEs start with a 500×300
  banner generated from the title, heptagram, and the icon background.
  The scaffold also includes
  backend commands, plugin wiring, and the app verification tools.

**Apps must** use the new icon workflow when creating or revising Nexis
launcher artwork. Keep the canonical SVG mark and pick a background plus
mark color with the user.

## Unreleased

- **Components.** `Combobox`, `DateRangePicker`, multi-select tables and
  trees, virtualized table rows, and time axes and legends for line charts.
- **Optional exports.** `@nexis/design/surface` provides WebGL backgrounds.
  `@nexis/design/ide` provides editor and terminal adapters, and
  `@nexis/design/ide/terminal` supports terminal-only consumers.
- **Tooling.** `settings-deep` uses the shared settings registry. The
  scaffold includes a desktop release workflow. The theme CLI checks both
  variants before writing a file, and Lumen palette exchange has a round-trip test.

**Apps must** bump the pin and reinstall to use the new exports. Install
`ogl` for the surface entry point or `@codemirror/view` for the editor.
Existing apps can copy `scripts/release.yml` into `.github/workflows` and
adapt the platform matrix to their supported targets.

## Unreleased (`vitrine-findings`)

- **From moving Vitrine onto the package** (APP-FINDINGS, Vitrine 1 to 8):
  `ProductCard media` (your own picture element) and a numeric `aspect`;
  `Shelf`'s header sits above the strip's hover room, so its arrows click;
  `Shelf enter` staggers by position in CSS, no longer through a `style`
  prop; `CollectionCard tone`; flat `[data-tilt]` cards with no leaning face
  catch the light; `CardTilt` marks the root while mounted and takes `foil`
  and `enter`, and the lift, foil and hop are gated on it; `tiltFor` is
  tested; PITFALLS §17 (stale Vite prebundle).

**Apps must:** Vitrine can drop its workarounds: the `Shelf` header
override, the `style` forwarding added for the stagger, the
`.vitrine-collection` tint rule (use `tone`), its own `[data-tilt="light"]`
rules, and the `:root[data-fun]` overrides (map Calm, Lively and Over the
top onto mounting `CardTilt` and its `foil` and `enter`). Its `ProductCard`
can move onto the package's with `media={<Cover … />}` and a numeric
`aspect`. An app that used `Shelf enter` without `CardTilt` mounted now
needs it mounted.

## 2026-11-10 (`fluid-loader-ci`, merged as `23e14a7`)

- **Loader.** `Spinner` is now the heptagram loader: a comet running along
  the {7/2} star, continuous at the display's refresh rate, vector,
  `currentColor`. `--tick-cadence` and `--tick-steps` are gone; the token is
  `--loader-cadence`. `.nexis-spin` is now a smooth turn.
- **Accordion.** Opening and closing animate their height again. A style
  override made Radix's two height variables refer to each other, so the
  content snapped open. Open is `--dur-window`, close `--dur-panel`, for
  `Collapsible` too.
- **Items.** Media is centred on the row (it sat above centre when a row had
  a description), the description is `text-body` under a `text-sm` title,
  hover is `bg-muted/60` on the house tap duration. The gallery shows rows
  on hairlines, not each in its own outline card (P4, R4.2).
- **Avatars.** Sized in rem, so avatars, initials and presence dots follow
  the interface scale. `AvatarStack` overlaps by a fifth, so every initial
  stays readable, and its "+N" is no longer painted over; it is a named
  group for screen readers (`label`).
- **Brand.** The heptagram replaces the old knot logo: `NexisMark` (inline,
  `currentColor`) in every template's title bar and the gallery, the
  frosted-glass tile `assets/brand/nexis-logo.svg` and `.png`, regenerated
  `templates/icons`, and the scaffold's `AppLogo` and `assets/logo.svg`.
  RULES §17.
- **Skeletons.** A viewport-wide sheen replaces the pulse; `SkeletonText`,
  `SkeletonRow`, `SkeletonCard` and `SkeletonGroup` give the shapes.
- **Charts.** `DonutChart` and `ProportionBar` for part of one whole, and
  RULES §18 for which chart answers which question.
- **Showmanship from Vitrine.** `CardTilt`, `ProductCard tilt`/`foil`,
  `Shelf enter`, `CollectionCard`, `--ease-spring`. Opt-in, RULES R8.3.
- **Settings template.** One registry for nav, search and palette, deep
  links that flash the row, Undo on Save and Discard, labels in the unsaved
  bar.
- **Select.** After a pointer pick the trigger keeps focus without the
  accent ring; the ring itself is one quiet line.
- **Copy.** RULES R10.2 bans synthetic profundity, action-explaining and
  AI-splaining; the hype words are tripwired in shipped and scaffolded text.
- **Explorer grid.** Cards no longer clip at the top of the scroll area.
- **CI.** Typecheck, tests and build on pull requests and pushes to `main`.
- **Propagation.** `pnpm consumers` reports every app's pin and its local
  copies of package components; AGENTS.md §6 "A fix lands everywhere".

**Apps must:** bump the pin. Delete an app-local `spinner.tsx` and import
`Spinner` from `@nexis/design`. Replace any use of `--tick-cadence` or
`--tick-steps`. Delete any local fix that set
`--radix-collapsible-content-height` on an accordion. Rows of `Item`s in
outline cards with gaps become hairline rows (`divide-y`), unless they are
cards on purpose. Replace the app's logo `<img>` with `NexisMark` (or its
legacy app mark, where it was already used) and regenerate its icons from the new tile. Replace
`animate-pulse` placeholders with the `Skeleton` presets. Vitrine: replace
`useCardPhysics`, `.fun-face` and the fan CSS with `CardTilt`,
`ProductCard tilt` and `CollectionCard`, keeping its Showmanship levels as
whether `CardTilt` is mounted. Run the R10.2 tripwire over the app's copy.

- **Vitrine: done** in rwetz/vitrine#3 (on top of #2), 2026-11-10. Still
  behind: BibleLM, Nexis, nexis-press, nexis-lens, nexis-epoch.

## 2026-11-10 (`scaffold-sweep`, merged as `a786979`)

- Scaffold fixes (SCAFFOLD-ISSUES 1 to 26), new components (`ProductCard`,
  `Shelf`, `FilterPanel`, `RangeInput`, `SettingsTree`, settings registry,
  `fetchJson`), collapsed `SidebarNav` names and badges, `ThumbnailCard`
  `aspect`, theme view transitions batched, eight implicit state machines
  made explicit, RULES P1 to P7 and §14 to §16.

**Apps must:** bump the pin. BibleLM: delete its own `SettingsTree`, the
`MutableRefObject` cast, the `div` wrappers around settings rows and its
`fetchData`, and use the package's. Vitrine: replace its `ProductCard`,
`Shelf`, `FilterPanel` with the package's where they match. Every app: no
`useEffect(() => setX(...))` (RULES R14.3) in its own code.
