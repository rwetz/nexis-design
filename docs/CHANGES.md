# Changes, and what they ask of apps

Every change that an app would notice gets an entry here, newest first. The
**Apps must** line is the checklist for bringing an existing app up to it
(AGENTS.md §6, "A fix lands everywhere"). Future apps get every entry for
free: `new-app.sh` pins the commit it runs from.

`pnpm consumers` lists every app, its pin, how far behind it is, and which
package components it still shadows with its own copy.

## Unreleased (`fluid-loader-ci`)

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
own mark per R17.4) and regenerate its icons from the new tile. Replace
`animate-pulse` placeholders with the `Skeleton` presets. Vitrine: replace
`useCardPhysics`, `.fun-face` and the fan CSS with `CardTilt`,
`ProductCard tilt` and `CollectionCard`, keeping its Showmanship levels as
whether `CardTilt` is mounted. Run the R10.2 tripwire over the app's copy.

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
