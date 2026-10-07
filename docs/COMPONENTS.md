# Components

Everything is exported from the package root (`import { Button } from
"@nexis/design"`) and, shadcn-style, per file (`@nexis/design/ui/button`).
Every one is in the gallery (`pnpm dev`), one page per family, with the theme
and mode pickers in the title bar.

**Origin** says where a component came from: **Nexis** = Nexis's own
`components/ui`, kept in step with it (most are shadcn `radix-luma` with
Nexis's edits); **new** = written for this package because Nexis had no
shared version yet.

## Catalogue

### Controls

| Component | Origin | Notes |
|---|---|---|
| `Button` | Nexis | `default` (neutral, high contrast) · **`brand`** (the accent) · `secondary` · `outline` · `ghost` · `destructive` · `link` · `arrow` (fill wipes in on hover). Sizes `xs sm default lg` + `icon-xs icon-sm icon icon-lg`. |
| `ButtonGroup` | Nexis | joined buttons |
| `Toggle`, `ToggleGroup` | Nexis | pressed state, single/multiple |
| `Segmented` | new | a mode switch whose pill *travels* (gliding rail). For toolbars. |
| `Checkbox` (+ indeterminate), `RadioGroup`, `Switch` | Nexis | the switch thumb squishes while held |
| `Slider` | Nexis | single or range |
| `Badge` | Nexis + tones | adds `brand success warning info` tones that follow the theme |
| `StatusDot` | new | `tone`, `live` (caret blink) |
| `Kbd`, `KbdGroup`, `KbdHint` | Nexis | key chips; hint fades in where relevant |
| `Meter` | new | a reading with thresholds (warn 75%, danger 90%); never tweens |
| `Progress` | Nexis | work toward done |
| `Spinner` | Nexis | stepped, four quarter-turns |
| `ThoughtLine` | Nexis | a stream still arriving — live only |
| `CallChip` | Nexis | a long run the user started: elapsed + stop |

### Forms

| Component | Origin | Notes |
|---|---|---|
| `Field` | new | label + control + hint/error; wires `id`, `aria-describedby`, `aria-invalid`. `inline` for settings rows. |
| `Input`, `Textarea`, `InputGroup` | Nexis | |
| `Label` | Nexis | |
| `Select` | Nexis | Radix select, grouped |
| `NumberInput` | new | steppers, bounds, unit; commits on blur/Enter; arrows step, Shift×10 |
| `Calendar`, `DatePicker` | new | `CalendarDate` (no time, no zone); always six weeks; arrow/PageUp keys |
| `Accordion` | new | Radix accordion on the shared collapsible keyframes |
| `Collapsible` | Nexis | |

### Overlays

| Component | Origin | Notes |
|---|---|---|
| `DropdownMenu` | Nexis | groups, labels, submenus, checkbox/radio items, shortcuts, destructive items |
| `ContextMenu`, `Menubar` | Nexis | same item vocabulary |
| `Popover`, `HoverCard`, `Tooltip` | Nexis | `TooltipProvider` once at the root |
| `Dialog`, `AlertDialog` | Nexis | `AlertDialogAction variant="destructive"` for the destructive confirm |
| `Sheet` | Nexis | side drawer: details, inspectors |
| `CommandPalette` | new | data-driven over `Command`; fuzzy ranking (`lib/fuzzy`), groups, shortcuts, match highlight; `useCommandPaletteShortcut` binds Mod+Shift+P |
| `Command*` | Nexis | the cmdk primitives, for bespoke pickers |
| `Toaster`, `toast` | Nexis | sonner on the house surfaces; `toast` re-exported |

### Navigation

| Component | Origin | Notes |
|---|---|---|
| `SidebarNav` | new | brand, sections, counts, footer, collapse to an icon rail; the selection glides with an accent bar |
| `Tabs` | Nexis | |
| `GlidingTabs` | Nexis | sub-tabs inside a panel, gliding pill |
| `Breadcrumb` | Nexis | |
| `Toolbar`, `ToolbarSpacer`, `ToolbarSeparator` | new | the fixed-height row atop a content area |
| `Pagination` | new | ellipsis only where it hides two or more pages |
| `Steps` | new | done steps stay clickable; ahead is muted |
| `useGlidingRail`, `RailIndicator` | Nexis | build your own travelling selection |

### Data

| Component | Origin | Notes |
|---|---|---|
| `DataTable` | new | columns with `value`/`cell`/`numeric`/`sortable`; three-state sort, stable, blanks last; controlled or in-memory; sticky header; quiet selection |
| `Tree` | new | flat render of visible nodes; full WAI-ARIA keyboard; indent guides |
| `VirtualList` | new | `@tanstack/react-virtual`, full-width rows, `follow` that releases when you scroll up |
| `PropertyList` | new | key/value `<dl>`, `mono` values |
| `Item*` | Nexis | list rows with media, content and actions |
| `Avatar`, `AvatarStack` | new | initials on neutral, presence dot |
| `Timeline` | new | time column, tone dots, `live` newest |
| `Empty*` | Nexis | empty states that say what to do next |
| `Skeleton` | Nexis | |

### Charts

| Component | Origin | Notes |
|---|---|---|
| `Stat` | new | label, display-face number, delta coloured by *good/bad* (`lowerIsBetter`), sparkline |
| `LineChart` | new | main series in the accent, optional muted dashed `compare`, area, hover crosshair + readout, nice gridlines |
| `BarChart` | new | one `highlight`ed bar in the accent |
| `Sparkline` | new | `brand` or `muted` |
| `Heatmap` | new | accent mixed into muted in OKLab |

### Layout and framing

| Component | Origin | Notes |
|---|---|---|
| `Panel`, `SectionLabel` | new | the titled region; the labelled hairline |
| `Card` | Nexis | things, not regions |
| `ResizablePanelGroup`/`Panel`/`Handle` | Nexis | `react-resizable-panels`; custom resize cursors |
| `ScrollArea`, `ScrollFade` | Nexis | themed scroll; edge fades |
| `Separator` | Nexis | |
| `BranchedMenu` | Nexis | grouped menu whose grouping is drawn |

### Chrome

| Component | Origin | Notes |
|---|---|---|
| `TitleBar` | new | drag region, brand, centre slot, actions, controls; macOS inset |
| `StatusBar`, `StatusItem` | new | facts, left and right; `live` items in tabular figures |
| `WindowControls` | Nexis | min/max/close on Windows/Linux; `preview` for galleries |
| `WindowResizeEdges` | Nexis | Linux-only resize strips (was `ResizeHandles`) |
| `ChromePreviewContext` | new | makes `controls="auto"` draw inert controls outside Tauri |

### Motion moments

`SceneEnter`, `Stagger`, `ResultArrival`, `RunLive`, `AuroraBorder`, `Blink`
— thin wrappers over the CSS classes, with `replayKey` to play again. See
[DESIGN_LANGUAGE.md §5](DESIGN_LANGUAGE.md#5-motion).

### Lib

`cn` · platform facts (`IN_TAURI`, `IS_MAC`, `USE_CUSTOM_WINDOW_CONTROLS`,
`MOD_KEY`, `fmtShortcut`, …) · `ease`, `dur`, `railSpring` · `formatElapsed`,
`formatBytes`, `formatCompact`, `formatDelta` · `nextSort`, `sortRows`,
`compareValues` · `fuzzyMatch`, `fuzzyFilter` · `dates` (`CalendarDate`
arithmetic) · `readAppTokens`, `readTerminalTokens`, `resolveCssColor`.

## Behaviour every interactive component carries

- Reachable and operable by keyboard; focus always visible (`ring-ring/30`).
- A role and an accessible name — icon-only buttons label the *button*, the
  glyph is `aria-hidden`.
- State in `data-*` / `aria-*` attributes (`data-state`, `aria-selected`,
  `aria-current`, `aria-sort`), so styles and tests key off the same thing.
- Colours only from tokens; the accent only for the one primary action, the
  selection and live progress.
- Motion from the tokens; nothing animates on live data.

## Known gaps

- No virtualised **table** (the `DataTable` renders every row; page it, or
  use `VirtualList` with your own row layout past ~2,000 rows).
- No multi-select in `DataTable` or `Tree` yet.
- No combobox (typeahead select) — `Command` inside a `Popover` is the
  pattern until there is one.
- Charts have no legend component and no time axis formatting beyond labels.
- `Calendar` picks a date, not a range.

## Rules for writing a component

1. **Check Nexis first.** If Nexis has it in `components/ui`, port it here
   unchanged except for imports — the package and Nexis must not drift. If
   you improve it, the improvement goes to Nexis too.
2. Tokens only. If a colour you need has no token, the answer is a token in
   `globals.css` that follows the theme (see how `success` maps to ANSI
   green), not a literal.
3. Icons via `<Icon>`; motion via the tokens; `m` not `motion.*`.
4. `data-slot` on the root; `className` merged last with `cn()`.
5. Pure logic (sorting, paging, date maths, thresholds) in an exported
   function with a test in `test/logic.test.ts`.
6. Export it from `src/index.ts` (a test fails otherwise) and show it in the
   gallery in the same commit; regenerate the screenshots that include it.
