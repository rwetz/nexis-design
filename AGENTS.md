# AGENTS.md: building with Nexis Design

Instructions for coding agents (and people) using **@nexis/design** to build
Tauri desktop apps, and for working on the package itself. Read the section
you need; the API cheat sheet is exact (it is compiled: `test/cheatsheet.tsx`),
so copy from it rather than guessing prop names.

- **Nexis Design** = the design system of the Nexis app family: tokens, 22
  themes and the engine that applies them, ~70 React components (plus the layout patterns of RULES §4), the motion
  vocabulary, borderless window chrome and the cursor set. Tauri v2 + React
  19 + Tailwind v4 only.
- **Not for** native GPUI apps (that is
  [ferrite-design](https://github.com/rwetz/ferrite-design)) or websites.

---

## 1. Start an app

```bash
# from a checkout of nexis-design
scripts/new-app.sh nexis-<thing> <template> [dir] [--with store,dialog]
cd ../nexis-<thing> && pnpm install && pnpm tauri icon src-tauri/icons/icon.png && pnpm tauri dev
```

`--with` wires Tauri plugins end to end (npm dep, Cargo dep, `lib.rs`,
capability): `store dialog fs opener notification clipboard-manager process
http sql global-shortcut` (`http` ships a placeholder URL scope that
`pnpm check` fails on until you name the origin; `updater` is manual).
Decide them up front from what the app does: it needs `dialog` to open or
save a file, `store` to remember settings, `fs` or a Rust command to read what
it opened, `notification` for alerts, `clipboard-manager` for copy actions.
Anything else: [docs/BACKEND.md](docs/BACKEND.md) §3.

`new-app.sh` writes a complete Tauri v2 project: `package.json` (the package
pinned by git rev + exactly its peers), the no-flash `index.html`, `main.tsx`
with the providers, the template as `src/App.tsx` with its title renamed, a
starter `AppLogo.tsx`, `src/backend.ts` (the one door to Rust, with browser
fallbacks), `src-tauri/` with the chrome config for all three platforms and a
registered example command, the `check` and `verify` scripts, and an
`AGENTS.md` for the new app. The git pin only resolves once
the rev is pushed; to work against a local checkout use
`NEXIS_PATH=/path/to/nexis-design scripts/new-app.sh …`.

### Pick the template by the shape of the app

| Template | Shape | Start here for |
|---|---|---|
| `dashboard` | sidebar · toolbar · KPI stats · live chart · sortable table · details sheet · incidents | monitoring, analytics, fleet/system status, finance, home-lab |
| `workbench` | resizable split: tree · tabs · virtualised document · inspector | editors, notes, IDE-likes, asset browsers, API clients, git clients |
| `settings` | sidebar sections · inline fields · draft with save/discard · destructive confirm | preferences windows, config tools, admin consoles |
| `settings-deep` | settings chapters and groups · search · palette deep links | settings with many groups |
| `explorer` | search + filters toolbar · paginated sortable table · details sheet | CRUD/admin panels, issue trackers, CRMs, database browsers, inventories |
| `console` | filtered virtual log · follow-tail · level toggles · command prompt · job chip | log viewers, REPLs, job runners, serial monitors, chat transcripts |
| `wizard` | centred steps · validated pages · progress · done | installers, onboarding, setup and export flows |
| `minimal` | title bar · one view · status bar · palette | anything else; one-screen utilities |

See them running first: `pnpm dev` in this repo, then **App templates** in
the sidebar (or `#/app/<template>`).

For identity decisions use [BRANDING.md](docs/BRANDING.md). Match an app to
one reference and keep the heptagram geometry. Ask the user about the
icon background and mark color before finalizing the artwork.

### Recipes for app types without a template

Combine templates; every piece below is in the package.

- **Chat / messaging**: `workbench` shell: `SidebarNav` of channels (unread
  counts as `meta`) → a `VirtualList` of messages (`Avatar` + name + body) →
  a `Textarea` composer pinned at the bottom; `RunLive` round it while a
  reply streams, `ThoughtLine` in the header. No animation per message.
- **File manager**: `explorer`'s toolbar + `Breadcrumb` path + a resizable
  split with a `Tree` of folders and a `DataTable` of entries; `ContextMenu`
  on rows; `AlertDialog` for delete; `toast(…, { action: Undo })`.
- **Media / gallery**: `explorer` with its Grid view: `ThumbnailGrid` of
  `ThumbnailCard`s (`aspect="portrait"` for covers), `Segmented` for
  density, `Sheet` + `PropertyList` for metadata, `SceneEnter` as each loads.
- **Shop / catalogue**: `ProductCard`s (picture, eyebrow, title, `PriceTag`,
  `CardBadge`s, one action button) in a `ThumbnailGrid`, or in `Shelf`s on a
  home page; `FilterPanel` + `ActiveFilters` beside the grid with facets
  and counts derived from the data; a collapsed `SidebarNav` rail shows
  counts (Cart 3) as badges. Icons: `cart`, `bag`, `heart`, `store`,
  `package`.
- **Catalogue with varied item types**: let each category own its fields,
  and let fields become facets: a field list per category, values in a
  `Record<string, string>` per item, and `FilterPanel` facets built from
  the fields of the category being browsed.
- **Hero / summary banner**: a `Panel` with one headline number (`Stat`,
  large), one line under it, and a cluster of two or three overlapping
  `rounded-xl` pictures on the right that lift on hover. One per page, at
  the top; it is not a carousel.
- **Deep settings**: the `settings` template with `SettingsTree` in place of
  `SidebarNav`, driven by a `SettingsChapter[]` registry (RULES R4.2).
- **Music / media player**: `SidebarNav` library, `DataTable` tracklist, a
  bottom bar with icon `Button`s (`play`/`pause`/`stop`), `Slider` for
  position and volume, `Meter` as a level meter (it never tweens).
- **API client**: `workbench`: `Tree` of requests, tabs of open requests, a
  `Select` for the method + `Input` for the URL in a `Toolbar`, `GlidingTabs`
  for Headers/Body/Auth, `PropertyList` for response headers, `Stat` for
  timing.
- **System monitor**: `dashboard` with a `Meter` per core, `LineChart` per
  resource, a process `DataTable` (`density="compact"`), `Heatmap` of load by
  hour.
- **AI assistant panel**: `CommandPalette` + a `Sheet` or split pane;
  `RunLive` on the composer while streaming, `ThoughtLine` for
  reasoning, `CallChip` for a long agent run, `ResultArrival` when a result
  lands.
- **Kanban / tracker**: `explorer` data + columns of `Panel`s with `Item`
  cards; `Badge` tones for status; `Sheet` for details.
- **Notes / markdown editor**: `workbench`: `Tree` of notes, tabs, an editor
  in the document pane, `PropertyList` for metadata in the inspector. An editor
  (CodeMirror, ProseMirror) is the app's own dependency: import
  `globals.ide.css` instead of `globals.css` and read PITFALLS 9. Save with
  `store` or a Rust command to a file the user chose (BACKEND §4).
- **Terminal / REPL**: `console` for a command log; a real PTY is xterm.js plus
  a Rust PTY command and `globals.ide.css`; theme it from tokens on
  `paletteEpoch`.
- **Launcher / quick-action / menubar utility**: `minimal` where the
  `CommandPalette` is the main surface (open it by default, `Dialog`-style
  centred, no sidebar). A tray icon needs Tauri's `tray-icon` feature and
  Rust, not covered by the scaffold; keep the window small and hide it on blur.
- **Mail / feed / RSS reader**: `workbench` in three columns: `SidebarNav` of
  folders (unread as `meta`), a `VirtualList` of items, the open item as
  prose at `max-w-prose`. Unread is `font-medium` plus a neutral dot, not a
  colour.
- **Calendar / planner**: `Calendar` for the month, `Timeline` for the day,
  `Sheet` + `Field`s to edit; events are `Item`s with a `Badge` for the
  category (tones only).
- **Image / design / creative tool**: `workbench` with the canvas as the
  document; the inspector is `PanelSection`s of `ControlRow`s; assets in a
  `ThumbnailGrid`; previews are the real render (RULES R9).
- **Database / data browser**: `explorer` for the rows, `workbench`'s tree for
  schemas, `Combobox` for picking a table, `DataTable` sorting server-side
  (`sort`/`onSortChange`).
- **Form-heavy business app (invoices, inventory, CRM)**: `explorer` for the
  list, a `Sheet` or full page of `Field`s for the record (RULES R4.8),
  `Steps` when the record has more than one stage, `AlertDialog` for delete.
- **Installer / setup / export flow**: `wizard`; the last page is the result,
  with a `CallChip`/`Progress` while it runs (BACKEND §5).

### The build loop

1. **Pick** the template and the plugins from the app's shape (above), and
   scaffold. Run `pnpm install`, `pnpm tauri icon`, and `pnpm verify` once
   before touching anything: it must be clean.
2. **Contract first.** Write the types for the app's data and the list of Rust
   commands (name, arguments, result) before any screen. Put them in
   `src/backend.ts` as typed wrappers over `call(…, fallback)` with believable
   fallbacks, so every screen can be built and looked at in a browser.
3. **Screens.** Replace fixtures with `useLoad(…)` (BACKEND §2) and give every
   data view its four states (RULES R7.3). Actions go in the palette as you
   add them.
4. **Rust.** Implement the commands, register them, add plugins if the check
   says one is missing. `cargo check` on a desktop.
5. **Verify.** `pnpm verify`, then look (§5). Fix what the check names rather
   than silencing it.

---

## 2. The rules (non-negotiable)

The short list. The full ruleset, with a number for every rule, the layout
patterns, which overlay to use, the control grammar and the sizes to check
at, is [docs/RULES.md](docs/RULES.md). Read it before building UI; where
this list and RULES.md disagree, RULES.md wins.

1. **Providers once, at the root:** `LazyMotion features={domAnimation}
   strict` → `ThemeProvider storageKey="<app>"` → `TooltipProvider`, plus
   `<Toaster />`. Import `@nexis/design/styles/globals.css` (or
   `globals.ide.css` with a terminal/editor) once.
2. **Colours only from tokens**: `bg-card`, `text-muted-foreground`,
   `border-border`, `bg-brand`, `text-success`. Never a hex, never Tailwind's
   stock palette (`emerald-500`): they ignore all 22 themes. Tripwired.
3. **One accent.** `brand` (`Button variant="brand"`, `Badge variant="brand"`)
   marks *the* primary action, keyboard focus and live progress, nothing
   else: selection is neutral (RULES R6.2, R6.3). Never decoration, never a
   link, never a gradient. `primary` is a neutral, not the accent.
4. **State colours are tones:** `success` / `warning` / `info` /
   `destructive` (`Badge`, `StatusDot`, `text-success`). They are the theme's
   ANSI roles.
5. **Icons only via `<Icon name="…" />`**, sizes `xs sm md lg xl`, `active`
   for selected, bold beside `font-medium` text (R7.5), `swap` when a user
   action changes the glyph (R8.4). Never import `@phosphor-icons/react` (or any icon library)
   directly; add a name to `src/icon/icon.tsx` if the idea has none.
   **No emoji, anywhere.** Both tripwired.
6. **Type:** one face, Inter, for everything a person reads (RULES R1);
   there is no display face and no `font-heading`.
   `font-mono` only for code, paths and ids, never numbers: numbers are the
   sans with `tabular-nums`, right-aligned in a fixed slot. Sizes below 14px
   come from the scale: `text-micro` (10px), `text-caption` (11px),
   `text-ui` (12px) and `text-body` (13px); never `text-[11px]` or
   `text-xs`. Every size scales with the interface scale (RULES R2).
   Tripwired.
7. **Motion marks events.** Use the moments (`SceneEnter`, `ResultArrival`,
   `RunLive`, …) and the house tokens; never `animate-spin` (use
   `Spinner`), never `animate-pulse` for status (use `StatusDot live`). Live
   data never animates (`StatusItem live`, `Meter`, charts redraw in place).
   Import `m`, never `motion.*`.
8. **A selection that moves glides:** `SidebarNav`, `Segmented`,
   `GlidingTabs`, or `useGlidingRail` + `RailIndicator` for a new strip.
9. **Frame regions with `<Panel title meta actions>`**; long work the user
   started gets a `CallChip`; facts go in the `StatusBar`.
10. **State is explicit (RULES §14).** A flow with phases (a request, a job,
   a wizard, a draft) is one discriminated union, not `loading` + `error` +
   `data` flags; derived values are computed while rendering, never copied
   into state by an effect (tripwired); "nothing" is `null`, never `""`.
   Decide what a screen does with the principles (RULES P1 to P7) when no
   rule covers it.
10. **Every app exposes its actions in a `CommandPalette`** on Mod+Shift+P
    (`useCommandPaletteShortcut`).
11. **Chrome:** `TitleBar` + `WindowResizeEdges` at the root; window APIs only
    behind `IN_TAURI`. The shell arrives in order: `nexis-shell-header` on
    the title bar, `nexis-shell-body` on the body, `nexis-shell-status` on
    the status bar; a switched-to page is a `ViewEnter`.
12. **Docking layouts use dockview** with `@nexis/design/styles/dockview.css`
    (`dockview-theme-nexis`, `.nexis-dock`, `.nexis-dock-tab`), never a
    hand-themed one.
13. **No em dashes in anything a person reads**: UI strings, JSX text, docs,
    the wiki, the website, the changelog. Use a colon to introduce, a comma
    for an aside, parentheses for a list, a period between two sentences,
    `·` between parts of a title ("Epoch · Nexis") and `–` for "no value" in
    a cell. Code comments are exempt. Tripwired.
14. **Space and size:** the 4px grid; named spaces `gap-inline` / `gap-row` /
    `gap-group` / `mt-section` / `px-gutter` / `p-page`; fixed heights are
    48 (title bar, toolbar, panel header), 28 (status bar), 32 (control in a
    panel), 36 (in a dialog), 32 and 28 (rows). Everything is in rem, so the
    interface scale (RULES R2) moves it together; never `zoom`.
15. **Use the pattern's component** (RULES R4): `SettingsLayout` for settings,
    `PanelSection` + `ControlRow` for inspectors, `ThumbnailGrid` / `Strip` for
    galleries. If you are hand-building one, stop.
16. **Pick the overlay by the job** (RULES R5): `Select` for up to 12,
    `Combobox` beyond, `DropdownMenu` for actions, `Popover` to adjust,
    `AlertDialog` to confirm a destructive act, `Dialog` for a short blocking
    task (6 fields at most), `Sheet` for a side panel, `toast` for finished
    background work.
17. **Every data view has four states** (RULES R7.3): `Skeleton`, `Empty` with
    one action, an `Alert` with Retry, and the data. Reversible actions toast
    with Undo; irreversible ones ask in an `AlertDialog` (R7.4). Forms:
    RULES R4.8.
18. **The backend** (docs/BACKEND.md): reach Rust only through
    `src/backend.ts`; a command is the fn, its `generate_handler!` entry and
    a wrapper; a plugin is four edits; nothing slow on the main thread;
    narrowest permissions; data in the right home. `pnpm check` fails on the
    ones it can see.

---

## 3. API cheat sheet

```tsx
import { …anything below… } from "@nexis/design";
import "@nexis/design/styles/globals.css";      // once, in main.tsx / styles.css
```

### App skeleton

```tsx
export default function App() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  useCommandPaletteShortcut(() => setOpen((o) => !o));        // Mod+Shift+P
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />                                    {/* Linux only; self-gating */}
      <TitleBar brand={<AppLogo className="size-[18px] text-foreground" />} title="My App" center={…} actions={…} />
      <div className="flex min-h-0 flex-1">
        <SidebarNav value={page} onChange={setPage} collapsed={false}
          sections={[{ title: "Monitor", items: [{ id: "overview", label: "Overview", icon: "home", meta: 3 }] }]} />
        <main className="flex min-w-0 flex-1 flex-col">
          <Toolbar>… <ToolbarSpacer /> <Button variant="brand" size="sm"><Icon name="add" /> New</Button></Toolbar>
          …
        </main>
      </div>
      <StatusBar left={<StatusItem icon="git-branch">main</StatusItem>} right={<StatusItem live>{n} rows</StatusItem>} />
      <CommandPalette open={open} onOpenChange={setOpen} commands={[
        { id: "new", label: "New file", group: "File", icon: "file-add", shortcut: fmtShortcut(MOD_KEY, "N"), run: () => {} },
        { id: "mode", label: "Toggle light / dark", group: "View", icon: "contrast", keywords: ["theme"],
          run: () => theme.setMode(theme.resolvedMode === "dark" ? "light" : "dark") },
      ]} />
    </div>
  );
}
```

### Components

```tsx
// Controls
<Button variant="brand|default|secondary|outline|ghost|destructive|link|arrow" size="xs|sm|default|lg|icon-xs|icon-sm|icon|icon-lg">
<Button variant="ghost" size="icon-sm" aria-label="Refresh"><Icon name="refresh" /></Button>   // icon-only: label the button
<Icon name={copied ? "check" : "copy"} swap />   // a glyph a user action changes blurs through (R8.4)
<IconWeightProvider weight="bold">…</IconWeightProvider>   // icons beside font-medium text in a hand-built control (R7.5)
<Badge variant="brand|success|warning|info|destructive|secondary|outline">ok</Badge>
<StatusDot tone="neutral|brand|success|warning|info|danger" live />
<Meter label="cpu" value={0.49} warnAt={0.75} dangerAt={0.9} />      <Progress value={64} />
<Spinner />  <ThoughtLine width={32} />  <CallChip label="cargo build" startedAtMs={t0} onEnd={stop} />
<Checkbox checked={b | "indeterminate"} onCheckedChange={…} />  <Switch size="sm" checked={b} onCheckedChange={…} />
<RadioGroup value={v} onValueChange={…}><RadioGroupItem value="a" /></RadioGroup>
<Slider value={[v]} onValueChange={…} max={100} />   <Kbd>{MOD_KEY}</Kbd>   <KbdHint label="Open" keys={[MOD_KEY, "O"]} />
<Segmented label="Range" size="sm" value={r} onChange={setR} segments={[{ id: "1h", label: "1H", icon?: "…" }]} />
<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>Help</TooltipContent></Tooltip>

// Layout patterns (docs/RULES.md §4)
<SettingsLayout nav={<SidebarNav …/>}><SettingsPage title="Appearance" description="…"><SettingsGroup title="Theme">
  <SettingRow label="Mode" description="…"><Segmented …/></SettingRow>   // align="stretch" for inputs and selects
</SettingsGroup></SettingsPage></SettingsLayout>
<PanelSection title="Layers" actions={<Button variant="ghost" size="icon-sm" …/>}>…</PanelSection>
<ControlRow label="Line weight" edited={v !== def} onReset={reset} value={v}><Slider …/></ControlRow>
<ThumbnailGrid min="9rem" maxColumns={6}><ThumbnailCard image={url} title="Stencil" meta="Print" selected /></ThumbnailGrid>
<ThumbnailCard image={url} title="Dune" aspect="square|portrait|landscape" overlay={<CardBadge>New</CardBadge>} />
<ProductCard image={url} eyebrow="Acme" title="Lamp" price={<PriceTag price="$24" was="$30" prefix?="From" />} aside={<Sparkline …/>}
  badges={<CardBadge>-20%</CardBadge>} action={<Button size="icon-sm" variant="secondary" aria-label="Add to cart"><Icon name="cart" /></Button>} dimmed? onClick={open} />
<Shelf title="On sale" meta={12} action={…} wheel?="page|sideways">{cards with className="w-44 shrink-0"}</Shelf>
// Deep settings (R4.2): one registry drives the tree, the search and the palette
<SettingsTree nodes={settingsTreeNodes(SETTINGS)} chapter={c} section={s} onSelect={(c, s) => …} openAll={searching} />
findSettings(query, SETTINGS)  locateSetting("Mode", SETTINGS)   // SettingsPage/Group/Row take id and data-*; SettingsPage titleClassName, inset={false}
const data = await fetchJson<Data>("/data/x.json")              // rejects on a missing file, even Vite's 200 text/html fallback
const fade = useEdgeFade<HTMLDivElement>("x"); <div ref={fade.ref} style={fade.style} className="overflow-x-auto">…</div>   // any other sideways scroller (R4.9)
<Strip>{cards}</Strip>   <ColorPicker label="Ink" value="#163a70" onChange={set} swatches={others} />
<ListPresence>{rows.map((r) => <PresenceItem key={r.id}>…</PresenceItem>)}</ListPresence>

// Forms
<Field label="Name" required hint="…" error={msg | null} inline?><Input … /></Field>   // wires id/aria for the child
<NumberInput value={n} onChange={setN} min={1} max={64} step={1} decimals={0} suffix="ms" />
<Select value={v} onValueChange={…}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">A</SelectItem></SelectContent></Select>
<Combobox value={id} onValueChange={setId} clearable placeholder="Project" searchPlaceholder="Search projects"
  options={[{ value: "atlas", label: "Atlas", keywords: ["maps"] }]} />     // long or searchable list; Select is for 12 or fewer
<DatePicker selected={d} onSelect={setD} min={dates.today()} />      <Calendar selected={d} onSelect={setD} weekStartsOn={1} />
<DateRangePicker value={range} onChange={setRange} min={dates.today()} />
<Combobox label="Region" options={options} value={region} onValueChange={setRegion} />
// dates.date(2026, 10, 7)  dates.addDays(d, n)  dates.addMonths(d, n)  dates.iso(d)  dates.parseIso(s)
<Accordion type="single" collapsible><AccordionItem value="a"><AccordionTrigger meta="3">General</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>
<Accordion type="multiple" defaultValue={["a", "b"]}>…</Accordion>   // several open at once; meta={2} shows a count
const facets: Facet[] = [{ kind: "range", key: "price", label: "Price", unit: "$" }, { kind: "options", key: "seller", label: "Seller", options: [{ value: "Acme", count: 4 }] }];
<FilterPanel facets={facets} value={filters} onChange={setFilters} />   <ActiveFilters facets={facets} value={filters} onChange={setFilters} />
// filters: FilterState = EMPTY_FILTERS; filterCount(filters); rangeBounds(filters.ranges.price) -> { min, max } (null = no bound)
<RangeInput label="Price" unit="$" value={{ min: "", max: "" }} onChange={…} />   // NumberInput cannot be empty; this can

// Overlays
<DropdownMenu><DropdownMenuTrigger asChild>…</DropdownMenuTrigger><DropdownMenuContent>
  <DropdownMenuItem><Icon name="file-add" /> New <DropdownMenuShortcut>{fmtShortcut(MOD_KEY, "N")}</DropdownMenuShortcut></DropdownMenuItem>
  <DropdownMenuSub><DropdownMenuSubTrigger>Recent</DropdownMenuSubTrigger><DropdownMenuSubContent>…</DropdownMenuSubContent></DropdownMenuSub>
  <DropdownMenuCheckboxItem checked={b} onCheckedChange={…}>Wrap</DropdownMenuCheckboxItem>
  <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
</DropdownMenuContent></DropdownMenu>                                 // ContextMenu*, Menubar* use the same item vocabulary
<Popover>, <HoverCard>, <Dialog>, <Sheet> + <SheetContent side="right"> // shadcn API
<AlertDialog>…<AlertDialogAction variant="destructive">Delete</AlertDialogAction>
toast.success("Saved", { description: "…" })   toast("Deleted", { action: { label: "Undo", onClick } })   toast.promise(p, {…})

// Navigation
<Tabs>/<TabsList>/<TabsTrigger>/<TabsContent>   <GlidingTabs label="Request" value={v} onChange={…} tabs={[{ id, label, icon? }]} />
<Breadcrumb>…   <Pagination total={20} page={p} onChange={setP} />   <Steps steps={["A", "B"]} current={i} onSelect={setI} />

// Data
const columns: Column<Row, "name" | "rps">[] = [
  { key: "name", header: "Service", sortable: true, cell?: (r) => … },
  { key: "rps", header: "Req/s", numeric: true, sortable: true, value?: (r) => r.rps },
];
<DataTable label="Services" columns={columns} rows={rows} rowKey={(r) => r.id} defaultSort={{ key: "rps", dir: "desc" }}
  selected={sel} onSelect={setSel} density="compact" />               // sort/onSortChange to control it (server-side)
<Tree label="Files" nodes={[{ id, label, icon?, meta?, children? }]} expanded={set} onExpandedChange={setSet} selected={id} onSelect={(id, node) => …} />
// DataTable and Tree accept selection={keys} onSelectionChange={setKeys}. For a bounded table viewport, add virtual={{}}.
<VirtualList label="Log" count={n} rowHeight={24} follow renderRow={(i) => …} className="h-64" />
<PropertyList items={[{ label: "pid", value: "4412", mono: true }]} />
<Avatar name="Ada Lovelace" size={28} presence="online|away|busy|offline" />   <AvatarStack names={[…]} />
<Timeline events={[{ id, time: "12:04", title, detail?, tone?, live? }]} />
<Alert variant?="destructive"><Icon name="info" /><AlertTitle>…</AlertTitle><AlertDescription>…</AlertDescription></Alert>
<Empty><EmptyHeader><EmptyTitle>No matches</EmptyTitle><EmptyDescription>…</EmptyDescription></EmptyHeader></Empty>

// Charts
<Stat label="p95" value="54 ms" delta={-2} lowerIsBetter trend={values} caption="vs last week" />
<LineChart label="Latency" values={v} compare={baseline} labels={l} format={(v) => `${v}ms`} height={180} />
<BarChart label="Deploys" bars={[{ label: "Mon", value: 12 }]} highlight={3} />
<Sparkline values={v} width={96} tone="brand|muted" />   <Heatmap label="Load" rows={rows0to1} rowLabels={[…]} colLabels={[…]} />
<DonutChart label="Build time" parts={[{ label: "Compile", value: 142 }]} highlight={0} format={(v) => `${v}s`} />   // part of one whole, ≤5 parts (RULES §18)
<ProportionBar label="Storage" parts={parts} highlight={0} legend={false} />
<SkeletonGroup label="Loading services"><SkeletonRow /><SkeletonText lines={3} /><SkeletonCard aspect="portrait" /></SkeletonGroup>
<CardTilt foil? enter? />   // once, near the root, in a browsing app (RULES R8.3); then <ProductCard tilt foil? media? aspect={1.5} …/>, <Shelf enter>, <CollectionCard name count covers tone? />
<NexisMark className="size-[18px]" />   // the heptagram in currentColor (RULES §17)

// Failure and loading
<DataBoundary state={state} onRetry={reload} noun="issues" empty={<Empty>…one action…</Empty>}>{(rows) => <DataTable … />}</DataBoundary>
<ErrorBoundary label="Log view" resetKey={fileId} onError={report}>…</ErrorBoundary>   // root of the app, and around any view of external data
<Skeleton className="h-8 w-full" />                                                    // loading: the content's shape, never a lone spinner
const { state, reload } = useLoad(() => call<Row[]>("list_rows", {}, FIXTURE), []);   // state.status: "loading" | "error" (state.error) | "ready" (state.data)

// Framing, motion
<Panel title="Services" meta="8" actions={…} flush>…</Panel>   <SectionLabel>Danger zone</SectionLabel>
<SceneEnter replayKey={k}>   <ViewEnter replayKey={page}>   <ContentEnter replayKey={id}>   <Stagger>   <ResultArrival>   <RunLive active>

// Theme
const t = useTheme();  t.setThemeId("aurelian");  t.setMode("light|dark|system");  t.setContrast("high");  t.paletteEpoch
listNexisThemes()  listCommunityThemes()  getBuiltinTheme(id)  applyTheme(theme, "dark")  readAppTokens()
```

Icons (`ICON_NAMES` has all 172): `add close check delete edit copy search
filter refresh settings home folder folder-open file file-code document
terminal code git-branch git-commit play pause stop info alert alert-circle
success notification calendar clock user users lock key globe server
database cpu disk chart-bar chart-line trend-up trend-down sparkle theme
theme-dark theme-light contrast chevron-up/down/left/right arrow-right more
sidebar-left split-vertical layers grid table list-bullet star upload
download …`.
Themes: `nexis-default halcyon meridian cinder aurelian thicket vermillion
hotwire tangerine sulfur acid absinthe cyanotype glacier ultramarine
ultraviolet synthwave tokyo-night catppuccin nord gruvbox rose-pine`.

---

## 4. Gotchas that cost time

- **Text in a flex row overflows instead of truncating** → the flexible child
  needs `min-w-0` (and `min-h-0` vertically for scroll regions) plus
  `truncate`.
- **A component calls a Tauri API in the browser and the page dies**
  ("reading 'metadata'") → gate on `IN_TAURI` (PITFALLS §12).
- **Colours look right on the default theme and wrong on others** → a literal
  or a stock Tailwind colour slipped in; `pnpm test` names the line.
- **A canvas or terminal shows last theme's colours** → re-read tokens on
  `paletteEpoch`, not on the theme id.
- **Mixing toward grey turns purple** → `color-mix(in oklab, …)`, not oklch
  (PITFALLS §11).
- **Shortcut does nothing while an editor has focus** →
  `useCommandPaletteShortcut` listens in the capture phase; a hand-rolled
  `onKeyDown` on a div will not see it.
- **Tailwind class missing** in a file outside `src/` → Tailwind only scans
  the app's sources and the package (its own `@source`); add an `@source` for
  any other folder (PITFALLS §8).
- **`link:` the package and `tsc` reports two Reacts** → use `file:`
  (PITFALLS §10).
- **A view that fetches a data file spins forever** → a missing file came
  back as the app's own page, `200 text/html`; load data with `fetchJson`
  (PITFALLS §14).
- **A scroll spy or lazy loader crashes the app's jsdom tests** → stub
  `IntersectionObserver` beside `ResizeObserver` (PITFALLS §15).
- **`ERR_PNPM_LINKED_PKG_DIR_NOT_FOUND` with a `/c/...` path** → a Git Bash
  path in a `file:` dependency; use `file:../nexis-design` (PITFALLS §16).
- **Port 1420 in use** → another app, or a Vite left from an aborted
  `pnpm tauri dev`; each app has its own port (docs/SCAFFOLDING.md Step 4).

- **A Rust argument arrives missing** → JS keys are camelCase: `project_id` is
  `{ projectId }` (BACKEND B1.3).
- **The window freezes while a command runs** → a non-`async` command runs on
  the main thread (B1.5).
- **`invoke` says a command or plugin is not allowed/found** → a command is
  missing from `generate_handler!`, or a plugin is missing one of its four
  edits; `pnpm check` names which.
- **A `Select` with 40 items** → `Combobox`. **A `Dialog` with 9 fields** → a
  page or `wizard`.
- **A page that is blank in the browser but works in Tauri** → a Tauri API
  called outside `IN_TAURI`; use `src/backend.ts`.
- **A release window is white and has no devtools** → a render error; wrap in
  `ErrorBoundary` (the scaffold does at the root).
- Pick a template that is close and delete; do not build a shell from
  scratch.

---

## 5. Verify before you call it done

```bash
pnpm verify              # nexis-design-check (rules + Tauri wiring) + tsc + vite build
pnpm tauri dev           # look at it: every screen, dark and light, one other theme, high contrast
```

`pnpm look` is `nexis-design-look`: it opens the running app (`pnpm dev`) at
1024x768 to 3840x2160, dark and light, writes a screenshot of each, and
reports console errors, sideways scroll, elements outside the window, clipped
text, text under 10px, targets under 24px and unnamed controls. It does not
replace looking at the screenshots.

`pnpm check` is the package's `nexis-design-check`: the tripwires in §2 over
your `src/`, plus the Tauri wiring (plugins in all four places, every
`call("x")` registered, the Linux override present). It exits 1 on errors;
warnings (missing icons, no palette) do not fail. Fix what it names; a line
that must break a rule on purpose carries `nexis-ok: <rule-id> <why>`.

Look at it at the sizes in RULES §12 (1024x768 up to 3840x2160), not just
your window. **Headless (CI, a cloud container):** the frontend runs in any
browser. `pnpm dev` and drive it with Playwright (Chromium is enough; Tauri
APIs are gated off and `call` returns its fallbacks):
`scripts/shot.mjs <url> <out.png>` in this repo is a one-file example. Look at
the screenshot: overflow, a missing class, a wrong colour are only visible
that way. The native chrome (traffic lights, real min/max, resize) and the
Rust build (`cargo check` needs WebKitGTK on Linux) can only be checked on a
desktop: say so if you could not.

Report: what you built, what `pnpm verify` said, what you saw, and what you
could not check.

---

## 6. Working on @nexis/design itself

```bash
pnpm install
pnpm dev                 # the gallery: every component, every theme, every template
pnpm typecheck && pnpm test
pnpm screenshots         # regenerate docs/img (all, or `pnpm screenshots app-` for a subset)
```

### A fix lands everywhere

A fix or a change here is not done when it merges: it is done when every
app has it. Existing apps pin a commit, so nothing reaches them by itself.

1. **Fix it here, never only in an app.** An app that finds a bug in a
   component logs it (SCAFFOLD-ISSUES.md or APP-FINDINGS.md) and fixes it in
   this package; a local workaround is temporary and named as one.
2. **Future apps in the same change.** Templates, `new-app.sh`, the
   `nexis-scaffold` skill, RULES.md and the cheat sheet are updated in the
   same commit as the component, so the next scaffold starts with the fix.
3. **Say what it asks of apps.** Add an entry to
   [docs/CHANGES.md](docs/CHANGES.md) with an **Apps must** line: bump the
   pin, delete this local copy, rename that token. A rule change also gets a
   tripwire where one is possible, and apps run the same tripwires.
4. **Then carry it to every existing app.** After merging, run
   `pnpm consumers`: it lists each app, its pin, how far behind `main` it
   is, and the package components it still shadows with its own copy. Each
   app gets its own branch and PR that bumps the pin and does its **Apps
   must** lines. An unpinned app is pinned first. Nexis, the source of most
   components, takes the same fix in its own copy until it consumes this
   package.
5. **Nothing is silently left behind.** An app that cannot take a change yet
   gets a line under that change in CHANGES.md saying why.

- **Nexis is the source.** The theme files, `applyTheme`, `globals.css`,
  `icon.tsx` and most of `components/ui` are ports of Nexis's own. Change them
  in Nexis first (or in both, in the same breath), not here alone: drift
  between the two is the failure this package exists to end. New components
  that Nexis lacks are fine to add here first.
- `pnpm test`: theme contrast floors for all 22 themes × 2 modes, the design
  rules (icon vendor, emoji, raw colours, stock palette, `animate-spin`,
  `motion.*`, every component exported), the logic of every component, every
  template mounting, the cheat sheet mounting, 0.1 compatibility, and
  `design-check.test.ts`: every template scaffolded for real and run through
  `nexis-design-check`, and each way of getting an app wrong named. A new
  tripwire goes in both `test/design-rules.test.ts` and
  `bin/nexis-design-check.mjs`.
- A new component: [docs/COMPONENTS.md](docs/COMPONENTS.md#rules-for-writing-a-component):
  exported from `src/index.ts`, shown in the gallery, logic tested, added
  to the cheat sheet if it is common, screenshots regenerated.
- A new theme: generate it with `nexis-design theme new <id> --hue <degrees>`; it must pass `themes.contrast.test.ts`. Add its folder
  colour to `theme/folderColor.ts`.
- A new icon: a semantic name in `REGISTRY` (one name per idea).
- What changed and what it asks of apps: [docs/CHANGES.md](docs/CHANGES.md);
  who uses the package: `pnpm consumers`.
- Field notes: [docs/PITFALLS.md](docs/PITFALLS.md); what apps found that belongs back here: [docs/APP-FINDINGS.md](docs/APP-FINDINGS.md). What is next:
  [docs/ROADMAP.md](docs/ROADMAP.md).

## Workspace conventions

Added by the 2026-10-30 workspace audit. Workspace-level rules live in `Dev/AGENTS.md`; this section only records how they apply here.

- **Registry.** This project has a row in `Dev/PROJECTS.md`. Update it in the same change as any move, rename or archive.
- **File header.** New source files a human authors start with the Ryan Wetzstein box (project line: `Design`, year 2026) in the language's comment syntax, above imports and below any shebang. Skip generated files, lockfiles, JSON, Markdown and vendored code.
- **README.** Ferrite-style README pattern (see `Dev/AGENTS.md`, Creating a new project, step 4) whenever this README is touched. Keep the heptagram footer.
- **Jev.** Bounded judgments (pick one, score, yes/no) go through the TypeSafe skill or the contract in `apps/job-app-finder/src/job_app_finder/jev_fit.py`. Jev only ranks, routes or flags; irreversible actions stay behind human confirmation.
