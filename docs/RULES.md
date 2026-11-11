# Rules

The rules every Nexis-family app follows, written so that an agent building
an app has as few decisions left as possible. DESIGN_LANGUAGE.md says what
the family looks like and why; this file says exactly what to do. When the
two disagree, this file wins and the other has a bug.

How to read it:

- Each rule has a number (`R3.2`) so a review, a commit or a test can cite
  it.
- **Must** is a rule. There is no "should": if something is optional it
  isn't here.
- A rule marked **Tripwired** fails `test/design-rules.test.ts` when broken.
  A rule marked **Look** can only be checked on screen, and §12 says how.
- A rule names the one component or token that does the job. If the job has
  no component yet, the rule says what to build, and you build it here, in
  @nexis/design, not in the app.

Status: this ruleset was written in October 2026 after the Press audit
(Press `docs/UX_PLAN.md`, `docs/NEXIS_DESIGN_ISSUES.md`). The code meets
it except where a rule is marked **(planned)**; §13 lists what's left.

---

## How the rules are organised

Four layers, from why to what. The shape follows Apple's Human Interface
Guidelines (principles, then foundations, then patterns, then components),
because it answers the question an agent actually has in the order it has
it: what matters here, what is it made of, what kind of screen is this, and
which component does the job. The content is the family's own.

| Layer | Answers | Sections |
|---|---|---|
| **Principles** (P1 to P7) | What matters, and how to decide when no rule fits | below |
| **Foundations** | What every screen is made of | §1 Type, §2 Interface scale, §3 Space, §6 Colour, §8 Motion, §10 Words, §15 Accessibility, §17 Brand |
| **Patterns** | What kind of screen or moment this is | §4 Layout patterns, §5 Overlays, §16 Feedback and progress, §14 State, §18 Charts |
| **Components** | Which one thing does the job | §7 Controls, §9 Previews, §11 Templates, docs/COMPONENTS.md |
| **Process** | How we know it is true | §12 Checking it, §13 Work to make the rules true |

Rule numbers (`R4.2`) are stable: sections were added, never renumbered, so
an old commit or test that cites a rule still points at it.

## Principles

Each principle is a test a screen must pass, the question to ask when no
rule covers the case, and the rules that carry it out. When two principles
pull apart, the one higher in this list wins.

**P1 Predictable.** What is on screen is one state, and the same action in
the same state does the same thing. A screen never shows two things that
cannot both be true (saving and saved, a selection in a list that no longer
has it). *Ask: can this screen be in a state its code did not name?*
Carried by §14 State, R5.4, R8.2.

**P2 Clear.** Every element says what it is and what it does without
explanation: legible type, verbs on buttons, icons with names, one
expression per idea. *Ask: would someone new know what this does before
clicking it?* Carried by §1, §7, §10, R7.2.

**P3 Hierarchy.** The most important thing reads first, by size, weight and
position, not by colour. One primary action per region. *Ask: squint at the
screen; is the first thing you see the thing that matters?* Carried by R1.4,
R1.5, R6.2, §7 (primary action).

**P4 Deference.** The chrome steps back so the content leads: neutral
surfaces, one accent, hairlines over boxes, no decoration that carries no
meaning. *Ask: if this element were removed, would anyone miss what it
said?* Carried by §6, R3.4, R4.1, R4.2 (rows not cards).

**P5 Consistency.** The same idea looks and behaves the same everywhere in
the family: one overlay per job, one control per idea, the same heights and
spaces. An app learned once is learned for all of them. *Ask: is there
already a component or a rule for this?* Carried by §3, §5, §7, §11.

**P6 Responsive feedback.** Every action answers at once, and work in
progress says how far along it is. Motion marks events, never live data.
*Ask: after a click, how does the person know it worked?* Carried by §8,
§16, R7 (busy, long work).

**P7 Adaptable.** It works at every window size and interface scale, by
keyboard alone, in every theme and high contrast, with reduced motion.
*Ask: does it still work at 1024 px, at 150%, without a mouse, in light
mode?* Carried by §2, R4.7, §12, §15.

---

## 1. Type

**R1.1 One face.** Every app uses **Inter** (variable, `font-sans`) for
everything a person reads: chrome, rows, numbers, headings, prose. There is
no display face and no second sans: Geist and Space Grotesk are gone and
there is no `font-heading`. Tripwired.

**R1.2 Mono is for text you'd copy, not for numbers.** `font-mono` (Geist
Mono until a replacement is chosen) is for code, file paths, hashes, ids,
keyboard input fields and terminal output. Never for numbers in readouts,
tables, sliders, sizes or the status bar. Tripwired: `font-mono` next to
`tabular-nums` fails.

**R1.3 Numbers.** Numbers that change, align or compare use Inter with
`tabular-nums` and are right-aligned in a fixed-width slot (R4.4), so a
changing value never moves the things around it. Units follow the number
with no space for `%`, `°` and `×`, and with a thin space (` `) for
`px`, `ms`, `MB`.

**R1.4 Sizes.** Text sizes come from this list and nowhere else:

| Token | Size | Weight | Use |
|---|---|---|---|
| `text-micro` | 10px | 500 | key chips, counters, badges |
| `text-caption` | 11px | 400 | metadata under a row, hints, the status bar |
| `text-ui` | 12px | 400 | rows, labels, menus, buttons in panels, inputs in panels |
| `text-body` | 13px | 400 | prose, dialog text, settings descriptions |
| `text-sm` | 14px | 500 | panel and section headings, dialog buttons, settings field labels |
| `text-lg` | 18px | 600 | page titles (Settings section, empty state title) |
| `text-2xl` | 24px | 600 | a single big figure (a stat), the start screen's app name |

Never `text-[Npx]`, never `text-xs` or `text-base`. These are sizes at 100%
interface scale; R2 scales all of them together. Tripwired.

**R1.5 Weights.** 400 for text, 500 for labels and headings in panels, 600
for titles. Nothing else (no 300, no 700+). Tripwired.

**R1.6 Case.** Sentence case everywhere. The one exception is the overline
(`SectionLabel`): uppercase, `text-micro`, tracked `0.06em`, muted. Nothing
else is uppercased.

**R1.7 Line length.** Prose wraps at 68ch (`max-w-prose`). Hints and
descriptions under a control wrap at the control column's width.

---

## 2. Interface scale

The family is used from a 1366×768 laptop to a maximized 4K monitor. A
fixed 12px row is fine on the first and unreadable on the second, so the
whole interface scales together.

**R2.1 One scale for everything.** `ThemeProvider` sets `--ui-scale` on the
root, and `globals.css` makes it the root font size. Every size in rem
(Tailwind's spacing and sizes, the type steps, `Icon`) grows with it, so
type, spacing, icons, radii and hit targets keep their proportions, and
portals (menus, dialogs, popovers) scale with the rest. Not CSS `zoom`:
portals render outside any zoomed container. Not webview zoom: it changes
the window's CSS width, which Auto follows. Sizes that must not scale (1px
hairlines, a canvas) are in px. Nothing reads the window size to pick font
sizes by itself. Read the scale with `useTheme().interfaceScale`.

**R2.2 Auto steps.** In Auto (the default), the scale follows the window's
width in CSS pixels, in fixed steps so it never drifts:

| Window width (CSS px) | Scale |
|---|---|
| below 1600 | 100% |
| 1600 to 2199 | 112.5% |
| 2200 to 2999 | 125% |
| 3000 and up | 150% |

The step is chosen when the window opens and when it's resized past a
boundary, with 64px of hysteresis so dragging the edge near a boundary
doesn't flicker between steps. The OS's own scale factor is already in CSS
pixels, so a 4K screen at 150% OS scale (2560 CSS px) gets 125%.

**R2.3 The setting.** Every app's Settings has **Interface size** under
Appearance: `Auto`, `100%`, `112%`, `125%`, `150%` as a `Segmented` bound to
`useTheme().interfaceSize` / `setInterfaceSize` (the settings template has
it). `Ctrl+=` / `Ctrl+-` / `Ctrl+0` step it and reset to Auto; the provider
binds them unless `interfaceShortcuts={false}`. It's stored under
`<storageKey>:ui-size` and reported through `onChange`.

**R2.4 Content with its own zoom.** A canvas, an image stage, a code editor
or a terminal sizes its content in px (or from its own zoom setting), so the
interface scale leaves it alone; the chrome around it scales. `.zoom-content`
/ `--app-zoom` remain for an app's own Ctrl± content zoom where it has one,
and are separate from this.

**R2.5 Design at 100%, check at all four.** Lay out at 100% and 1280×800.
Then look at every screen at the sizes in §12. A layout that only works at
one scale is a bug.

---

## 3. Space

**R3.1 The grid is 4px.** Every padding, gap, margin and fixed size is a
multiple of 4. Half steps (`p-1.5`, `gap-2.5`: 6px, 10px) are allowed only
inside a control's own markup (a menu item's padding, an icon's nudge), so
components may use them and layout may not. Tripwired in templates.

**R3.2 Named spaces.** Layout uses these, not ad hoc numbers:

| Name | Value at 100% | Use | e.g. |
|---|---|---|---|
| `inline` | 8px | between a control and its icon or label; between buttons in a group | `gap-inline` |
| `row` | 4px | between rows in a list or a control stack | `gap-row` |
| `group` | 16px | between groups inside a panel or section | `gap-group` |
| `section` | 32px | between sections of a page | `mt-section` |
| `gutter` | 16px | a panel's inner side padding | `px-gutter` |
| `page` | 32px | a page's padding (Settings, start screen) | `p-page` |

They are `--spacing-*` theme variables, so every spacing utility takes them
(`p-`, `px-`, `gap-`, `mt-`, `w-`), and they scale with R2.

**R3.3 Heights.** Fixed heights are one of these:

| What | Height |
|---|---|
| Title bar | 48px |
| Toolbar, panel header | 48px |
| Status bar | 28px |
| Control in a panel (input, select, button) | 32px |
| Control in a dialog or settings page | 36px |
| Row (list, tree, menu item) | 32px |
| Dense row (tables of data, logs) | 28px |

`TitleBar`, `Toolbar` and `Panel`'s header are 48px; `StatusBar` is 28px.

**R3.4 Panel gutters.** Every side panel has `gutter` on both sides,
and its header row is 48px with the title on the gutter. Content never
touches the panel edge except full-bleed thumbnails strips, which bleed by
exactly the gutter (`-mx-4 px-4`).

---

## 4. Layout patterns

Pick the pattern by what the screen is. Each names its component; if you're
hand-building one of these, stop and use (or build) the component.

**R4.1 App shell.** `TitleBar` (48px, brand, then nav, then centred command
search, then actions) → body → `StatusBar`. The status bar shows only when
the current view has facts to show; otherwise it's absent, not empty.

**R4.2 Settings page.** `SettingsLayout` + `SettingsPage` + `SettingsGroup`:

- Left: section nav, 224px, `SidebarNav`, full height, with Back at the
  bottom only when Settings replaced another view.
- Right: the section, **left-aligned**, starting at `--space-page`. Never
  centred in the window: centring makes a wide window look empty and puts
  the content far from the nav it belongs to.
- The section is a column up to 760px wide at 100% (it grows with R2).
  Title (`text-lg`), then an optional one-line description, then groups.
- Each setting is a `SettingRow`: label (`text-sm`, 500) and
  description (`text-body`, muted) on the left, 1fr; the control on the
  right, a fixed 280px column, right-aligned for switches and segmented
  controls, full column width for inputs and selects. Rows are separated by
  a hairline, not boxed in cards.
- Groups have an overline (`SectionLabel`) and `--space-section` above.
- Destructive settings go last, in a group of their own, with a
  `destructive` outline button that opens an `AlertDialog`.
- **The deep case** (more than about eight sections): the flat nav stops
  working, and so does one long page. Use `SettingsTree` as the nav:
  chapters with a mark, their groups on a spine under each, a search box
  above it that narrows the tree to matching settings (the group as `meta`,
  Enter opens the first). Drive the tree, the search and the palette's
  "Settings: ..." commands from one registry (`findSettings`,
  `locateSetting`, `settingsTreeNodes`), so they never disagree; a palette
  command opens the chapter and flashes the row (`SettingRow` takes `id`
  and `data-*`).

**R4.3 Side panel (inspector).** A column of `PanelSection`s:
header row (overline title + icon-sm actions), body with `--space-gutter`.
Collapsible sections use `Accordion` with no content indent (the column is
too narrow to spend 24px on hierarchy).

**R4.4 Control row.** A labelled control in a panel is a `ControlRow`:

- grid `[label 7rem to 10rem] [control 1fr] [value 3.5rem]`: the label
  column is `clamp(7rem, 38%, 10rem)`, so a narrow panel doesn't crush the
  control and a wide one doesn't strand the label far from it;
- the value readout is right-aligned, tabular (R1.3), and the same width on
  every row, so slider tracks line up down the panel;
- the label wraps to two lines before it truncates; the row keeps its
  height with `min-h-8`.

**R4.5 Galleries.** Thumbnail grids use `ThumbnailGrid` (and `ThumbnailCard`):
`grid-template-columns: repeat(auto-fill, minmax(min, 1fr))` with a min of
9rem for cards and 6rem for swatches, and a max column count so a wide
window gets bigger cards, not twenty columns. Titles get two lines before
truncating. `aspect` fits the picture: `square` (icons, swatches),
`portrait` (covers, posters), `landscape` (screenshots, video). Things with
a price use `ProductCard`; its badges are solid chips (`CardBadge`) because
they sit on artwork.

**R4.6 Horizontal strips.** A sideways-scrolling row of cards uses `Strip`:
no scrollbar, vertical wheel scrolls it, edges fade where
there's more. A titled row among others on a scrolling page is a `Shelf`:
arrows beside the title, and the vertical wheel keeps scrolling the page
(a page of stacked strips must never trap the reader).

**R4.7 Narrow windows.** Below 1024 CSS px (after scale), side panels
become a bottom dock (editors) or a sheet (everything else). A toolbar folds
by its own width with container queries (`Toolbar` is the `toolbar`
container: `@max-3xl/toolbar:hidden`): labels go first, then secondary
actions step aside into a More menu or the command palette. The search field
shrinks (`min-w-0 shrink`) rather than pushing actions off. Nothing ever
overlaps or wraps to a second row.

---

## 5. Overlays: which one

There is one right overlay for each job. Use this table.

| Job | Use | Never |
|---|---|---|
| Name an icon-only control | `Tooltip`, one line, with its shortcut | a tooltip on a control that has a visible label |
| Pick one of a fixed list (≤ 12) | `Select` | a dropdown menu |
| Pick one of a long or searchable list | `Combobox` (Popover + Command) | a select with 40 items |
| Run an action from a list | `DropdownMenu` | a select |
| Adjust something without leaving (a colour, a filter, a gallery) | `Popover`, anchored to its trigger, fits on screen without scrolling the page | a dialog |
| Confirm something destructive | `AlertDialog` | a popover, or no confirmation |
| A short task that blocks (save as, rename, export settings) | `Dialog`, one form, ≤ 6 fields | a new window |
| A side panel in a narrow window | `Sheet` | a dialog |
| A tool used alongside the main view for a long time (a detached preview, a second document) | a separate window (Tauri `WebviewWindow`) | a sheet or a dialog |
| Something finished in the background | `toast`, with an action if it can be undone | a dialog |

**R5.1 Menus open away from their trigger, never over it.** `Select`,
`DropdownMenu` and `Popover` use popper positioning: below the trigger,
left edges aligned, the trigger's width at least; above it only when there's
no room below. `Select` defaults to `popper`; tripwired:
`position="item-aligned"` fails.

**R5.2 Every menu has a visible hover.** The highlighted item gets
`bg-muted` (not `bg-accent`, which some themes set equal to the popover).
The current option in a `Select` carries a check at the right and weight
500.

**R5.3 Overlay type matches its trigger.** A select's items are `text-ui`
when its trigger is in a panel, `text-sm` when it's in a dialog or settings
page: the menu uses its trigger's size.

**R5.4 Focus doesn't jump on open.** A sheet or popover that opens from a
pointer click focuses its container, not its first control, so a tooltip
doesn't pop. `SheetContent` and `PopoverContent` do it by default
(`focusSurfaceOnOpen`); `PopoverContent matchAnchorWidth` makes a popover at
least as wide as its trigger.

---

## 6. Colour

**R6.1 Tokens only.** Colours come from tokens (`bg-card`,
`text-muted-foreground`, `bg-brand`). No hex, no Tailwind palette colours.
Tripwired (exists).

**R6.2 The accent marks three things.** `brand` is for: the one primary
action on a screen (`Button variant="brand"`), the keyboard focus ring, and
live progress (a running export, a meter filling), plus a chart's main data
series. Nothing else. Not selected tabs, nav items, cards or rows; not
links; not decoration; not "edited" or "unsaved" markers. Tripwired: no
`ring-brand`, `border-brand`, `bg-brand/N` tints or brand bars outside
`Badge`'s brand variant and the brand button.

**R6.3 Selection is neutral.** A selected tab, nav item, row or card gets
`bg-muted` (or `ring-2 ring-foreground/60` for a thumbnail) and full
`text-foreground`; unselected items are `text-muted-foreground`. There's no
coloured bar.

**R6.4 No rainbow, no gradients on UI.** Text and icons are one flat token
colour. No per-category colours, no hover gradients, no aurora borders in
chrome. `rainbowAccent`, `RainbowDefs` and `AuroraBorder` are gone from the
package (Nexis keeps its own copy). Tripwired.

**R6.5 Status is a tone.** `success` / `warning` / `destructive` / `info`
mean status and nothing else. An "edited" marker is a neutral dot
(`bg-foreground/60`), not a status.

---

## 7. Controls: one expression per idea

| Idea | The one expression |
|---|---|
| Primary action | `Button variant="brand"`, one per screen region |
| Secondary action | `Button variant="secondary"` |
| Quiet action in a toolbar or panel | `Button variant="ghost"` |
| Destructive action | `Button variant="destructive"` behind an `AlertDialog` |
| Icon-only action | `Button variant="ghost" size="icon-sm"` (32px) with a `Tooltip`; `icon-xs` (24px) only inside a dense row |
| Hover on anything clickable | `bg-muted/60` fill; text goes to `foreground` |
| Pressed / toggled on | `bg-muted` + `foreground` (`aria-pressed`) |
| Selected in a list, tree, tab or nav | R6.3 |
| Keyboard focus | `ring-2 ring-ring` (the accent), `focus-visible` only |
| Disabled | 50% opacity, no hover, not in the tab order |
| On/off | `Switch` |
| One of 2 to 5, all visible | `Segmented` |
| One of 6 or more | `Select` |
| A number in a range | `Slider` + typed value (R4.4) |
| A number without a range | `NumberInput` |
| A colour | `ColorPicker` |
| Edited from default | neutral dot after the label (R6.5); double-click the label to reset |
| Busy | `Spinner` in place of the icon; the control keeps its width |
| Long work the user started | `CallChip` in the toolbar |
| Empty | `Empty` with one action |
| Loading content | `Skeleton` in the content's shape |

**R7.1 Hit targets.** Anything clickable is at least 32×32 at 100% scale
(24×24 inside a dense row, with 4px between neighbours).

**R7.2 Icons size with their text.** `xs` (12) beside `text-caption`, `sm`
(14) beside `text-ui` and `text-body`, `md` (16) beside `text-sm` and in
icon buttons, `lg` (20) in empty states. Never mix two icon sizes in one
row.

---

## 8. Motion

R7 of AGENTS.md stands (motion marks events; live data never animates). In
addition:

**R8.1 Every content swap animates.** When a panel's content changes
because the selection changed, it uses `SceneEnter replayKey`. New list
items enter with `nexis-scene-enter`; removed ones leave with `ListPresence` +
`PresenceItem`. Cards lift 2px on hover. Nothing pops.

**R8.2 Highlights travel.** Menu and list highlights move between items
(the glide rail), never jump.

**R8.3 Showmanship, on content cards only, opt-in.** An app whose content is
things to browse (a shop, a library, a collection) may mount `<CardTilt />`
once: cards marked `data-tilt` (`ProductCard tilt`, `CollectionCard`) lean
toward the pointer, lift on `--ease-spring` and catch a light (the sheen);
`foil` adds a faint foil to the one special card on a shelf (a deal, a
rarity), never to a whole grid; `Shelf enter` hops the pictures in the first
time the shelf scrolls into view. Never on chrome, rows, controls, data or
anything live. Prices and titles never move, only pictures. A scrolling row
leaves room for a lifted card (`Shelf` does). All of it is off under reduced
motion and on touch. From Vitrine.

---

## 9. Previews

**R9.1 A preview is the real output.** A thumbnail, card or preview of what
an operation will produce is a scaled-down or cropped copy of the real
render at the real settings. It's never a separate render with different
framing, scale or parameters, even if that would look better: a preview
that flatters the result is a bug.

---

## 10. Words

**R10.1** Sentence case, no em dashes (exists, tripwired), no exclamation
marks, no "please". Buttons say the verb ("Export", not "OK"). Hints say
what happens, in one sentence.

**R10.2 Say it plainly, once.** Text a person reads (UI copy, toasts, empty
states, and the AGENTS.md, README and comments a scaffold writes) states the
fact and stops. Three habits of machine-written text are banned:

| Habit | What it looks like | Write instead |
|---|---|---|
| **Synthetic profundity** | An ordinary fact dressed as a revelation: "Your files, finally free.", "Every pixel tells a story.", "This changes everything." | "Files sync in the background." |
| **Action-explaining** | A sentence whose only job is to explain the one before it: "Export your data. This lets you take your data with you." | "Export your data as CSV." |
| **AI-splaining** | Explaining what the reader already knows, or what the control already shows: "A toggle switch lets you turn a setting on or off.", "Click Save to save your changes." | Say what is not obvious, or nothing. |

Also out: filler intensifiers and hype words ("seamless", "effortless",
"powerful", "robust", "unlock", "elevate", "supercharge", "game-changer",
"delve", "dive in", "journey"), framings like "It's not just X, it's Y",
"In other words", "Simply put", "Let's", and a sentence that restates the
heading above it. Tripwired over templates, the scaffold and the package's
shipped strings (`test/design-rules.test.ts`); the habits a pattern cannot
catch are a review item (§12).

---

## 11. Templates

**R11.1** Start from the template that matches the app's shape (AGENTS.md
§1). The templates follow every rule in this file; if a template breaks
one, fix the template in the same commit as the rule.

---

## 12. Checking it

**R12.1 Tripwires.** `pnpm test` runs `test/design-rules.test.ts` over
every app source file. An app copies the test or depends on the package's
`nexis-design-check` **(planned)** script.

**R12.2 Look at it.** Before calling UI work done, look at every screen at:

| Size (CSS px) | Scale | Stands for |
|---|---|---|
| 1024 × 768 | 100% | the smallest supported window |
| 1440 × 900 | 100% | a laptop |
| 1920 × 1080 | 112.5% | a 1080p monitor, maximized |
| 2560 × 1440 | 125% | 1440p, or 4K at 150% OS scale |
| 3840 × 2160 | 150% | 4K at 100% OS scale |

in dark and light, plus one non-default theme. Look for: anything
overlapping, cut off or truncated where it could fit; empty bands in a wide
window; text under 11px apparent size; two things that should line up and
don't.

**R12.3 Screenshots in the PR.** A change to a component or a template
includes before and after screenshots at 100% and 150%.

---

## 14. State

Most interface bugs are a screen in a state nobody named: a spinner that
never stops because `loading` and `error` were both set, a tab bar whose
active tab was closed, a page 7 of a search that has two pages. They come
from **implicit state machines**: a flow spread over several `useState`s
and booleans that are meant to change together and sometimes don't. These
rules make the machine explicit, so the impossible states cannot be written
down. (P1)

**R14.1 One value per concern.** Each independent thing a screen tracks is
one state variable (the query, the sort, the selected row). Two values that
constrain each other are one concern.

**R14.2 A flow is a union, not flags.** Anything with phases (a request, a
job, a wizard, an install, a connection, a draft being saved) is one
discriminated union with a `kind` (or `phase`, `state`) field, and the data
that only exists in a phase lives inside that phase:

```ts
type Job = { state: "idle" } | { state: "running"; since: number; progress: number } | { state: "failed"; error: string } | { state: "done"; result: Result };
```

Never `loading` + `error` + `data` side by side; never a step index plus a
progress number that means "installing" when the index is 3. Booleans are
fine for one yes/no that constrains nothing else (`follow`, `wrap`).
Examples: the `wizard` template's `Phase`, the `console` template's worker,
`Select`'s highlight.

**R14.3 Never copy state into state.** A value computed from props or other
state is computed while rendering (`useMemo` if it is costly), not stored.
State that must reset when something changes is stored with the thing it
belongs to and compared while rendering (the `explorer` template's page is
kept with its filter key; `SettingsTree`'s open chapters with their
chapter), or reset in the handler that made the change. An effect whose
only job is to set state from other state renders a frame of the old state
and is a bug. Tripwired.

**R14.4 Precedence is written down.** When several props can each decide
what one region shows (`image`, `loading`, `placeholder`), derive a single
value naming the case, in one place, with the order in a comment
(`ThumbnailCard`'s `face`). A component's visual state is one prop with
named values, not several booleans that can contradict each other.

**R14.5 Transitions in one place.** When a state has more than two
transitions, they live in a reducer or a small set of named functions
(`next`, `back`, `close`) beside the type, never spread through `onClick`s.
An updater function (`setX(prev => ...)`) returns the next value and does
nothing else: no calls to other setters inside it (React may run it twice).

**R14.6 No sentinels.** "Nothing" is `null` (or a `{ kind: "none" }`), never
`""`, `-1` or `0`. The type checker then makes every reader handle it, and
the screen gets a designed empty state instead of a crash or a blank.

**R14.7 Test the machine, not the screen.** A reducer or transition
function is plain code: a regression in one gets one table test of the
transition that broke (`test/logic.test.ts`, workbench tabs), not a
rendered-component test.

---

## 15. Accessibility

The rules that make P7 true by default. Most are in the components already;
these say what an app must not undo.

**R15.1 Every control has a name.** A control with no visible text names
itself with `aria-label` (icon buttons, a collapsed `SidebarNav`, a swatch).
The name includes a count shown only as a badge ("Cart, 3").

**R15.2 Keyboard first.** Everything a pointer can do, the keyboard can:
Tab reaches every control in reading order, arrows move inside a composite
(tree, tabs, segmented, menu), Enter and Space act, Escape closes the top
overlay. Every action is also in the `CommandPalette`.

**R15.3 Focus is visible and never lost.** `focus-visible` rings only
(R7). Closing an overlay returns focus to its trigger; removing the focused
row moves focus to its neighbour, not to the page.

**R15.4 Contrast holds in every theme.** Text meets 4.5:1 and large text and
icons 3:1 against their surface, in all 22 themes and high contrast
(`themes.contrast.test.ts`). Never convey state by colour alone: a tone
comes with an icon, a word or a shape.

**R15.5 Reduced motion.** Under `prefers-reduced-motion`, travel becomes an
instant move or a crossfade (`railSpring`, `useReducedMotion`); nothing
that carries meaning depends on the movement.

---

## 16. Feedback and progress

How long something takes decides how it answers (P6).

| Takes | Shows |
|---|---|
| under 100 ms | the result, nothing in between |
| 100 ms to 1 s | the control's own busy state: `Spinner` in place of its icon, the width kept |
| 1 s to 10 s, in place | `Progress` if it can count, `Skeleton` in the content's shape if it is loading content |
| longer, or started and left running | `CallChip` in the toolbar, then a `toast` when it lands |

**R16.1 Answer the click.** A press shows its pressed state at once; a
result that will take time shows the busy state within 100 ms.

**R16.2 Undo beats confirm.** A reversible action happens at once and
offers Undo in its toast. Only an action that cannot be undone asks first,
with an `AlertDialog` naming what will be lost (R5 table).

**R16.3 Say what happened.** A toast says what happened in the past tense
("Exported 3 files"), not that something "was successful". An error says
what failed and what to do next, in the place it happened (under the field,
in the panel), not only in a toast.

**R16.4 Progress is honest.** A determinate bar only moves for real work
done; it never fakes the last 10%. Unknown duration is indeterminate.

---

## 17. Brand

**R17.1 One mark.** The family's mark is the heptagram (`Dev/brand/heptagram`).
In the UI it is `<NexisMark />`: inline SVG, `currentColor`, `text-foreground`
in chrome. Never a raster in the UI, never recoloured with a gradient or a
per-app tint in chrome. The title bar's brand slot is the mark at 18px.

**R17.2 Where it lives.** Every app's title bar shows its `AppLogo` (which
starts as the mark); its icons are generated from one 1024² tile
(`assets/brand/nexis-logo.png`, `pnpm icons`); its README starts with the
tile at 128px and ends with the heptagram footer (`docs/brand/`). The
gallery's favicon and overview use the tile.

**R17.3 The tile.** The app icon is the mark in frost-to-glacier on an
obsidian-to-slate glass tile, with a hairline rim: the Nexis Frosted Glass
palette (`Dev/brand/heptagram/palettes/nexis-frosted-glass`). Brand hex lives
in the brand files only, never in components (R6.1).

**R17.4 An app's own mark** is drawn in the heptagram's language: flat,
one stroke weight, geometric, `currentColor`, readable at 16px. It replaces
`AppLogo` and the icon tile's mark; the tile itself stays, so the family
reads as one on a dock or taskbar.

**R17.5 When the mark changes**, it changes in `Dev/brand` first, then here
(`assets/brand`, `NexisMark`, `templates/icons`), then in every app through
`docs/CHANGES.md` (AGENTS.md §6). Never hand-edit an app's copy.

---

## 18. Charts: which one

Pick the chart by the question the reader is asking, not by what looks
fullest. One accent per chart: the series or part that matters is `brand`,
everything else is muted (R6.2).

| The question | Use | Never |
|---|---|---|
| One number now, and is it better or worse | `Stat` (with `delta`, `lowerIsBetter`) | a gauge |
| How it moved over time | `LineChart`; `compare` for last week or a baseline | bars for a continuous series |
| A trend in a row or a cell | `Sparkline` | a full chart in a table cell |
| Which of these categories is biggest | `BarChart`, sorted, one `highlight` | a pie |
| How one whole splits into 2 to 5 parts | `DonutChart` | more than 5 slices (they fold into Other), a 3D or exploded pie |
| The same split in one line, or several wholes compared | `ProportionBar`, one per whole, stacked | side-by-side donuts |
| When it happens (hour by day) | `Heatmap` | a line per day |
| How full a fixed capacity is | `Meter` | a donut |
| Progress of work | `Progress` (R16) | a chart |

**R18.1 Pie means part of one whole.** A donut is right only when the parts
add up to something the reader cares about (disk by file type, time by
project), there are five or fewer, and the question is "which is the big
one" rather than "how do these compare exactly". To compare sizes closely,
or across wholes, use bars: angles are hard to compare and lengths are not.

**R18.2 Labels, not colour.** Every part and every bar carries its name and
value in text (the legend shows the share, rounded to add to 100), so a
chart reads in grey, in high contrast and to a screen reader (`label` is
required).

**R18.3 Start at zero, keep it flat.** Bars and areas start at zero; no 3D,
no shadows, no gradients in a series; gridlines are the hairline.

**R18.4 No motion on data.** Charts draw once and redraw in place (§8):
a tween shows values that never existed.

---

## 13. Work to make the rules true

Done on the `rules` branch, one commit each: Inter and the type tripwires
(R1); the interface scale and its setting (R2); named spaces and chrome
heights (R3); neutral selection and no rainbow (R6); popper selects with a
visible hover and surfaces that focus themselves (R5); `SettingsLayout`,
`SettingRow`, `PanelSection`, `ControlRow`, `ThumbnailGrid`, `Strip`,
`ColorPicker` and `ListPresence` (R4, R7, R8); and the settings template
rebuilt on them.

Still to do:

1. The workbench and dashboard templates' side panels on `PanelSection`
   and `ControlRow`, and the start-screen pattern on `ThumbnailGrid`.
2. `nexis-design-check`: the tripwires as a script an app runs on its own
   source (R12.1).
3. `docs/img` screenshots regenerated at 100% and 150% (`pnpm screenshots`).

Then each app moves its pin and deletes its local versions of these.
