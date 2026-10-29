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
truncating.

**R4.6 Horizontal strips.** A sideways-scrolling row of cards uses `Strip`:
no scrollbar, vertical wheel scrolls it, edges fade where
there's more.

**R4.7 Narrow windows.** Below 1024 CSS px (after scale), side panels
become a bottom dock (editors) or a sheet (everything else). A toolbar folds
by its own width with container queries: labels go first, then secondary
actions move into a More menu. Nothing ever overlaps.

**R4.8 Forms.** A form is a column of `Field`s.

- Label above the control in dialogs and wizards; `inline` (label left) in
  settings pages. A `Dialog` has at most six fields (R5): more is a page or a
  wizard.
- Validate on blur the first time, then on every change once a field has an
  error, so a message appears when the user leaves the field and disappears
  the moment it is fixed. Never validate an untouched field.
- The error goes in `Field error`, under the control, and says how to fix it
  ("Use lowercase letters, digits and dashes"), never "Invalid".
- The submit button is `brand`, names the verb ("Create project"), and is
  disabled only while busy (`Spinner` in place of its icon, same width), never
  because the form is invalid. Pressing it with errors focuses the first
  invalid field.
- Enter submits a `Dialog`; Escape cancels it, and asks first only when the
  user has unsaved edits.
- Controls by data: a number `NumberInput`, a date `DatePicker`, a colour
  `ColorPicker`, a choice from more than 12 or one people search `Combobox`,
  a choice from 6 to 12 `Select`, 2 to 5 `Segmented`, on/off `Switch`.

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

**R7.3 Four states, every time.** A view that shows data from anywhere
(a file, the backend, a network) is written with all four before it is called
done, and the app can show each one:

| State | Shows | Never |
|---|---|---|
| Loading | `Skeleton` in the shape of the content; the toolbar and nav stay put | a lone `Spinner` in an empty window, a layout that jumps when data lands |
| Empty | `Empty` with one action that fills it ("Open a folder"). When a filter caused it: "No matches" and a button that clears the filter | a blank panel, a table with only headers |
| Error | `Alert variant="destructive"` in place of the content, the message from the error, and a Retry button | a toast for a failed load, a console log, a blank panel |
| Ready | the data | |

A background failure the user did not start (autosave, a poll) is a `toast`;
a failure of something they are looking at is the Error state. Anything that
can throw while rendering external data sits under an `ErrorBoundary`.

**R7.4 Undo before confirm.** A reversible action just happens and offers
Undo in a `toast`. An irreversible one asks first with an `AlertDialog` that
names what is lost and how much ("Delete 3 projects and their files?"), with
a `destructive` button that repeats the verb ("Delete 3 projects"), and the
focus on Cancel.

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

**R10.2 Errors say what happened and what to do.** "Couldn't save notes.md.
The disk is full. Free some space and try again." Name the thing, give the
cause when it is known, give the next step. No "Error:", no codes without a
sentence, no stack traces (they go to the log), no blame.

**R10.3 Empty states and first runs** say what the view is for in one
sentence and offer the one action. No tutorials in the empty state.

---

## 11. Templates

**R11.1** Start from the template that matches the app's shape (AGENTS.md
§1). The templates follow every rule in this file; if a template breaks
one, fix the template in the same commit as the rule.

---

## 12. Checking it

**R12.1 Tripwires.** This package's `pnpm test` runs
`test/design-rules.test.ts`. An app runs the same rules, plus the Tauri
wiring checks (docs/BACKEND.md), with `pnpm check` (the package's
`nexis-design-check` bin); `pnpm verify` is check, typecheck and build, and
the scaffold sets both up. A line that must break a rule on purpose carries
`nexis-ok: <rule-id> <why>`. Use it rarely: an app full of them has stopped
following the rules.

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

## 13. Work to make the rules true

Done: Inter and the type tripwires (R1); the interface scale and its setting
(R2); named spaces and chrome heights (R3); neutral selection and no rainbow
(R6); popper selects with a visible hover and surfaces that focus themselves
(R5); `SettingsLayout`, `SettingRow`, `PanelSection`, `ControlRow`,
`ThumbnailGrid`, `Strip`, `ColorPicker` and `ListPresence` (R4, R7, R8); the
settings template rebuilt on them; `Combobox` and `ErrorBoundary` (R5, R7.3);
`nexis-design-check` and the backend rules (R12.1, §14).

Still to do:

1. The workbench and dashboard templates' side panels on `PanelSection`
   and `ControlRow`, and the start-screen pattern on `ThumbnailGrid`.
2. R7.3 is ahead of the templates: none draws a loading (`Skeleton`) or an
   error state, only `explorer` and `minimal` have an `Empty`, and
   `dashboard` has one `Alert`. Their data is fixtures, so they never wait or
   fail; an app replacing the fixtures adds the states itself with
   BACKEND.md's `useLoad`.
3. `docs/img` screenshots regenerated at 100% and 150% (`pnpm screenshots`).

Then each app moves its pin and deletes its local versions of these.

---

## 14. The backend

**R14.1 The Rust half has its own rules**, numbered `B` in
[BACKEND.md](BACKEND.md): commands go through `src/backend.ts`, nothing slow
runs on the main thread, plugins are wired in four places, permissions are
the narrowest that work, data lives in the right place, long jobs report with
events and can be cancelled. `pnpm check` fails on the ones it can see.

**R14.2 The UI works with no backend.** Every view renders in a browser with
`call`'s fallbacks, so it can be built, looked at headless and tested without
a Tauri build.
