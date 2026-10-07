# AGENTS.md — building with Nexis Design

Instructions for coding agents (and people) using **@nexis/design** to build
Tauri desktop apps, and for working on the package itself. Read the section
you need; the API cheat sheet is exact (it is compiled — `test/cheatsheet.tsx`),
so copy from it rather than guessing prop names.

- **Nexis Design** = the design system of the Nexis app family: tokens, 22
  themes and the engine that applies them, ~70 React components, the motion
  vocabulary, borderless window chrome and the cursor set. Tauri v2 + React
  19 + Tailwind v4 only.
- **Not for** native GPUI apps (that is
  [ferrite-design](https://github.com/rwetz/ferrite-design)) or websites.

---

## 1. Start an app

```bash
# from a checkout of nexis-design
scripts/new-app.sh nexis-<thing> <template> [dir]
cd ../nexis-<thing> && pnpm install && pnpm tauri icon src-tauri/icons/icon.png && pnpm tauri dev
```

`new-app.sh` writes a complete Tauri v2 project: `package.json` (the package
pinned by git rev + exactly its peers), the no-flash `index.html`, `main.tsx`
with the providers, the template as `src/App.tsx` with its title renamed, a
starter `AppLogo.tsx`, `src-tauri/` with the chrome config for all three
platforms, and an `AGENTS.md` for the new app. The git pin only resolves once
the rev is pushed; to work against a local checkout use
`NEXIS_PATH=/path/to/nexis-design scripts/new-app.sh …`.

### Pick the template by the shape of the app

| Template | Shape | Start here for |
|---|---|---|
| `dashboard` | sidebar · toolbar · KPI stats · live chart · sortable table · details sheet · incidents | monitoring, analytics, fleet/system status, finance, home-lab |
| `workbench` | resizable split: tree · tabs · virtualised document · inspector | editors, notes, IDE-likes, asset browsers, API clients, git clients |
| `settings` | sidebar sections · inline fields · draft with save/discard · destructive confirm | preferences windows, config tools, admin consoles |
| `explorer` | search + filters toolbar · paginated sortable table · details sheet | CRUD/admin panels, issue trackers, CRMs, database browsers, inventories |
| `console` | filtered virtual log · follow-tail · level toggles · command prompt · job chip | log viewers, REPLs, job runners, serial monitors, chat transcripts |
| `wizard` | centred steps · validated pages · progress · done | installers, onboarding, setup and export flows |
| `minimal` | title bar · one view · status bar · palette | anything else; one-screen utilities |

See them running first: `pnpm dev` in this repo, then **App templates** in
the sidebar (or `#/app/<template>`).

### Recipes for app types without a template

Combine templates; every piece below is in the package.

- **Chat / messaging** — `workbench` shell: `SidebarNav` of channels (unread
  counts as `meta`) → a `VirtualList` of messages (`Avatar` + name + body) →
  a `Textarea` composer pinned at the bottom; `AuroraBorder` round it while a
  reply streams, `ThoughtLine` in the header. No animation per message.
- **File manager** — `explorer`'s toolbar + `Breadcrumb` path + a resizable
  split with a `Tree` of folders and a `DataTable` of entries; `ContextMenu`
  on rows; `AlertDialog` for delete; `toast(…, { action: Undo })`.
- **Media / gallery** — a wrapping grid of cards, `Segmented` for density,
  `Sheet` + `PropertyList` for metadata, `SceneEnter` as each loads.
- **Music / media player** — `SidebarNav` library, `DataTable` tracklist, a
  bottom bar with icon `Button`s (`play`/`pause`/`stop`), `Slider` for
  position and volume, `Meter` as a level meter (it never tweens).
- **API client** — `workbench`: `Tree` of requests, tabs of open requests, a
  `Select` for the method + `Input` for the URL in a `Toolbar`, `GlidingTabs`
  for Headers/Body/Auth, `PropertyList` for response headers, `Stat` for
  timing.
- **System monitor** — `dashboard` with a `Meter` per core, `LineChart` per
  resource, a process `DataTable` (`density="compact"`), `Heatmap` of load by
  hour.
- **AI assistant panel** — `CommandPalette` + a `Sheet` or split pane;
  `AuroraBorder` on the composer while streaming, `ThoughtLine` for
  reasoning, `CallChip` for a long agent run, `ResultArrival` when a result
  lands.
- **Kanban / tracker** — `explorer` data + columns of `Panel`s with `Item`
  cards; `Badge` tones for status; `Sheet` for details.

---

## 2. The rules (non-negotiable)

1. **Providers once, at the root:** `LazyMotion features={domAnimation}
   strict` → `ThemeProvider storageKey="<app>"` → `TooltipProvider`, plus
   `<Toaster />`. Import `@nexis/design/styles/globals.css` (or
   `globals.ide.css` with a terminal/editor) once.
2. **Colours only from tokens** — `bg-card`, `text-muted-foreground`,
   `border-border`, `bg-brand`, `text-success`. Never a hex, never Tailwind's
   stock palette (`emerald-500`): they ignore all 22 themes. Tripwired.
3. **One accent.** `brand` (`Button variant="brand"`, `Badge variant="brand"`)
   marks *the* primary action, the selected item, focus and live progress —
   never decoration, never a link. `primary` is a neutral, not the accent.
4. **State colours are tones:** `success` / `warning` / `info` /
   `destructive` (`Badge`, `StatusDot`, `text-success`). They are the theme's
   ANSI roles.
5. **Icons only via `<Icon name="…" />`**, sizes `xs sm md lg xl`, `active`
   for selected. Never import `@phosphor-icons/react` (or any icon library)
   directly; add a name to `src/icon/icon.tsx` if the idea has none.
   **No emoji, anywhere.** Both tripwired.
6. **Type:** Geist by default; `font-mono` for code, ids and numbers in
   tables (with `tabular-nums`); `font-heading` (Space Grotesk) only for
   titles, empty states and big numbers — never below ~13px.
7. **Motion marks events.** Use the moments (`SceneEnter`, `ResultArrival`,
   `AuroraBorder`, …) and the house tokens; never `animate-spin` (use
   `Spinner`), never `animate-pulse` for status (use `StatusDot live`). Live
   data never animates (`StatusItem live`, `Meter`, charts redraw in place).
   Import `m`, never `motion.*`.
8. **A selection that moves glides:** `SidebarNav`, `Segmented`,
   `GlidingTabs`, or `useGlidingRail` + `RailIndicator` for a new strip.
9. **Frame regions with `<Panel title meta actions>`**; long work the user
   started gets a `CallChip`; facts go in the `StatusBar`.
10. **Every app exposes its actions in a `CommandPalette`** on Mod+Shift+P
    (`useCommandPaletteShortcut`).
11. **Chrome:** `TitleBar` + `WindowResizeEdges` at the root; window APIs only
    behind `IN_TAURI`.

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
      <TitleBar brand={<AppLogo className="size-[18px] text-brand" />} title="My App" center={…} actions={…} />
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
<Badge variant="brand|success|warning|info|destructive|secondary|outline">ok</Badge>
<StatusDot tone="neutral|brand|success|warning|info|danger" live />
<Meter label="cpu" value={0.49} warnAt={0.75} dangerAt={0.9} />      <Progress value={64} />
<Spinner />  <ThoughtLine width={32} />  <CallChip label="cargo build" startedAtMs={t0} onEnd={stop} />
<Checkbox checked={b | "indeterminate"} onCheckedChange={…} />  <Switch size="sm" checked={b} onCheckedChange={…} />
<RadioGroup value={v} onValueChange={…}><RadioGroupItem value="a" /></RadioGroup>
<Slider value={[v]} onValueChange={…} max={100} />   <Kbd>{MOD_KEY}</Kbd>   <KbdHint label="Open" keys={[MOD_KEY, "O"]} />
<Segmented label="Range" size="sm" value={r} onChange={setR} segments={[{ id: "1h", label: "1H", icon?: "…" }]} />
<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>Help</TooltipContent></Tooltip>

// Forms
<Field label="Name" required hint="…" error={msg | null} inline?><Input … /></Field>   // wires id/aria for the child
<NumberInput value={n} onChange={setN} min={1} max={64} step={1} decimals={0} suffix="ms" />
<Select value={v} onValueChange={…}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">A</SelectItem></SelectContent></Select>
<DatePicker selected={d} onSelect={setD} min={dates.today()} />      <Calendar selected={d} onSelect={setD} weekStartsOn={1} />
// dates.date(2026, 10, 7)  dates.addDays(d, n)  dates.addMonths(d, n)  dates.iso(d)  dates.parseIso(s)
<Accordion type="single" collapsible><AccordionItem value="a"><AccordionTrigger meta="3">General</AccordionTrigger><AccordionContent>…</AccordionContent></AccordionItem></Accordion>

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

// Framing, motion
<Panel title="Services" meta="8" actions={…} flush>…</Panel>   <SectionLabel>Danger zone</SectionLabel>
<SceneEnter replayKey={k}>   <Stagger>   <ResultArrival>   <RunLive active>   <AuroraBorder active className="rounded-2xl">

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
- Pick a template that is close and delete; do not build a shell from
  scratch.

---

## 5. Verify before you call it done

```bash
pnpm build               # tsc + vite
pnpm tauri dev           # look at it: every screen, dark and light, one other theme, high contrast
```

**Headless (CI, a cloud container):** the frontend runs in any browser.
`pnpm dev` and drive it with Playwright (Chromium is enough; Tauri APIs are
gated off) — `scripts/shot.mjs <url> <out.png>` in this repo is a one-file
example. Look at the screenshot: overflow, a missing class, a wrong colour
are only visible that way. The native chrome (traffic lights, real min/max,
resize) can only be checked in `tauri dev` on each OS — say so if you could
not.

---

## 6. Working on @nexis/design itself

```bash
pnpm install
pnpm dev                 # the gallery: every component, every theme, every template
pnpm typecheck && pnpm test
pnpm screenshots         # regenerate docs/img (all, or `pnpm screenshots app-` for a subset)
```

- **Nexis is the source.** The theme files, `applyTheme`, `globals.css`,
  `icon.tsx` and most of `components/ui` are ports of Nexis's own. Change them
  in Nexis first (or in both, in the same breath), not here alone — drift
  between the two is the failure this package exists to end. New components
  that Nexis lacks are fine to add here first.
- `pnpm test` — theme contrast floors for all 22 themes × 2 modes, the design
  rules (icon vendor, emoji, raw colours, stock palette, `animate-spin`,
  `motion.*`, every component exported), the logic of every component, every
  template mounting, the cheat sheet mounting, 0.1 compatibility.
- A new component: [docs/COMPONENTS.md](docs/COMPONENTS.md#rules-for-writing-a-component)
  — exported from `src/index.ts`, shown in the gallery, logic tested, added
  to the cheat sheet if it is common, screenshots regenerated.
- A new theme: generate it with Nexis's `scripts/generate-theme-palettes.py`
  and copy the file in; it must pass `themes.contrast.test.ts`. Add its folder
  colour to `theme/folderColor.ts`.
- A new icon: a semantic name in `REGISTRY` (one name per idea).
- Field notes: [docs/PITFALLS.md](docs/PITFALLS.md). What is next:
  [docs/ROADMAP.md](docs/ROADMAP.md).
