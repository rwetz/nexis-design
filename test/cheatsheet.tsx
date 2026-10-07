// Every snippet in AGENTS.md §3, compiled (`pnpm typecheck`) and mounted
// (`test/render.test.tsx`), so the cheat sheet cannot drift from the API.
// If you change a component's props, this file breaks first — then update
// AGENTS.md to match.
import * as React from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
  Alert, AlertDescription, AlertTitle,
  AuroraBorder, Avatar, Badge, BarChart, Button, CallChip, Calendar, Checkbox,
  type Column, CommandPalette, DataTable, DatePicker, dates,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
  Empty, EmptyDescription, EmptyHeader, EmptyTitle,
  Field, fmtShortcut, GlidingTabs, Heatmap, Icon, Input, LineChart, Meter, MOD_KEY, NumberInput,
  Pagination, Panel, PropertyList, ResultArrival, SceneEnter, SectionLabel, Segmented,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, SHIFT_KEY,
  SidebarNav, Sparkline, Spinner, Stat, StatusBar, StatusDot, StatusItem, Steps, Switch,
  ThoughtLine, Timeline, TitleBar, toast, Toolbar, ToolbarSpacer, Tooltip, TooltipContent, TooltipTrigger,
  Tree, type TreeNode, useCommandPaletteShortcut, useTheme, VirtualList, WindowResizeEdges,
} from "../src";

type Row = { id: string; name: string; rps: number };
const rows: Row[] = [{ id: "api", name: "api", rps: 905 }];
const nodes: TreeNode[] = [{ id: "src", label: "src", children: [{ id: "src/a.ts", label: "a.ts" }] }];

export function Cheatsheet() {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState("overview");
  const [range, setRange] = React.useState<"1h" | "24h">("24h");
  const [sel, setSel] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(["src"]));
  const [n, setN] = React.useState(8);
  const [day, setDay] = React.useState<dates.CalendarDate | null>(dates.date(2026, 10, 7));
  const theme = useTheme();
  useCommandPaletteShortcut(() => setOpen((o) => !o));

  // Columns
  const columns: Column<Row, "name" | "rps">[] = [
    { key: "name", header: "Service", sortable: true },
    { key: "rps", header: "Req/s", numeric: true, sortable: true, cell: (r) => r.rps.toLocaleString() },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Chrome */}
      <WindowResizeEdges />
      <TitleBar brand={<Icon name="sparkle" />} title="My App" center={null} actions={null} />
      <SidebarNav
        value={page}
        onChange={setPage}
        sections={[{ title: "Monitor", items: [{ id: "overview", label: "Overview", icon: "home", meta: 3 }] }]}
        collapsed={false}
      />
      <Toolbar>
        <Segmented label="Range" size="sm" value={range} onChange={setRange} segments={[{ id: "1h", label: "1H" }, { id: "24h", label: "24H" }]} />
        <ToolbarSpacer />
        <Button variant="brand" size="sm">
          <Icon name="add" /> New
        </Button>
      </Toolbar>
      <StatusBar left={<StatusItem icon="git-branch">main</StatusItem>} right={<StatusItem live>{n} rows</StatusItem>} />

      {/* Controls */}
      <Button variant="brand" size="sm" onClick={() => toast.success("Saved", { description: "2 changes" })}>Run</Button>
      <Button variant="ghost" size="icon-sm" aria-label="Refresh"><Icon name="refresh" /></Button>
      <Button variant="destructive"><Icon name="delete" /> Delete</Button>
      <Badge variant="success">ok</Badge>
      <StatusDot tone="warning" live />
      <Meter label="cpu" value={0.49} />
      <Spinner />
      <ThoughtLine width={32} />
      <CallChip label="cargo build" startedAtMs={Date.now()} onEnd={() => {}} />
      <Checkbox checked onCheckedChange={() => {}} />
      <Switch checked={false} onCheckedChange={() => {}} />
      <Tooltip>
        <TooltipTrigger asChild><Button variant="ghost">?</Button></TooltipTrigger>
        <TooltipContent>Help</TooltipContent>
      </Tooltip>

      {/* Forms */}
      <Field label="Name" required hint="Lowercase" error={null}>
        <Input defaultValue="pulse" />
      </Field>
      <NumberInput value={n} onChange={setN} min={1} max={64} suffix="ms" />
      <Select defaultValue="a">
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="a">A</SelectItem></SelectContent>
      </Select>
      <DatePicker selected={day} onSelect={setDay} min={dates.today()} />
      <Calendar selected={day} onSelect={setDay} weekStartsOn={1} />
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger meta="3">General</AccordionTrigger>
          <AccordionContent>…</AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Overlays */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline">Menu</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Icon name="file-add" /> New <DropdownMenuShortcut>{fmtShortcut(MOD_KEY, "N")}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Recent</DropdownMenuSubTrigger>
            <DropdownMenuSubContent><DropdownMenuItem>~/code</DropdownMenuItem></DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet open={sel !== null} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent><SheetHeader><SheetTitle>{sel}</SheetTitle></SheetHeader></SheetContent>
      </Sheet>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={[
          { id: "new", label: "New file", group: "File", icon: "file-add", shortcut: fmtShortcut(MOD_KEY, "N"), run: () => {} },
          { id: "mode", label: "Toggle light / dark", group: "View", icon: "contrast", keywords: ["theme"], shortcut: fmtShortcut(MOD_KEY, SHIFT_KEY, "L"),
            run: () => theme.setMode(theme.resolvedMode === "dark" ? "light" : "dark") },
        ]}
      />

      {/* Navigation */}
      <GlidingTabs label="Request" value="body" onChange={() => {}} tabs={[{ id: "body", label: "Body" }, { id: "auth", label: "Auth", icon: "lock" }]} />
      <Pagination total={20} page={6} onChange={() => {}} />
      <Steps steps={["Account", "Theme", "Done"]} current={1} onSelect={() => {}} />

      {/* Data */}
      <Panel title="Services" meta="8" actions={null} flush>
        <DataTable label="Services" columns={columns} rows={rows} rowKey={(r) => r.id}
          defaultSort={{ key: "rps", dir: "desc" }} selected={sel} onSelect={setSel} density="compact" />
      </Panel>
      <Tree label="Files" nodes={nodes} expanded={expanded} onExpandedChange={setExpanded} selected={sel} onSelect={(id) => setSel(id)} />
      <VirtualList label="Log" count={10000} rowHeight={24} follow className="h-64" renderRow={(i) => <div>line {i}</div>} />
      <PropertyList items={[{ label: "pid", value: "4412", mono: true }]} />
      <Avatar name="Ada Lovelace" size={28} presence="online" />
      <Timeline events={[{ id: "1", time: "12:04", title: "Deployed", detail: "api", tone: "success" }]} />
      <Alert><Icon name="info" /><AlertTitle>Indexing</AlertTitle><AlertDescription>…</AlertDescription></Alert>
      <Empty><EmptyHeader><EmptyTitle>No matches</EmptyTitle><EmptyDescription>Clear the filter.</EmptyDescription></EmptyHeader></Empty>
      <SectionLabel>Danger zone</SectionLabel>

      {/* Charts */}
      <Stat label="p95" value="54 ms" delta={-2} lowerIsBetter trend={[3, 4, 2, 5]} />
      <LineChart label="Latency" values={[1, 3, 2]} compare={[1, 2, 2]} labels={["a", "b", "c"]} format={(v) => `${v}ms`} height={180} />
      <BarChart label="Deploys" bars={[{ label: "Mon", value: 12 }]} highlight={0} />
      <Sparkline values={[1, 3, 2]} width={96} tone="muted" />
      <Heatmap label="Load" rows={[[0, 0.5, 1]]} rowLabels={["Mon"]} />

      {/* Motion moments */}
      <SceneEnter replayKey={page}>…</SceneEnter>
      <ResultArrival>48.2 tok/s</ResultArrival>
      <AuroraBorder active className="rounded-2xl"><Input /></AuroraBorder>
    </div>
  );
}
