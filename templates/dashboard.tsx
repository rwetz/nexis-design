// ╔══════════════════════════════════════╗
// ║  @nexis/design — app template        ║
// ║  dashboard                           ║
// ╚══════════════════════════════════════╝
//
// Shape: sidebar · toolbar · KPI tiles · live chart · sortable table ·
// details sheet · incidents.
// Start here for: monitoring, analytics, fleet/system status, finance,
// home-lab panels.
//
// Copied into a new app by `scripts/new-app.sh <name> dashboard`. Replace the
// fixture data at the bottom with your own source; keep the shell.

import * as React from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  type Column,
  CommandPalette,
  DataTable,
  formatCompact,
  Icon,
  LineChart,
  Panel,
  PropertyList,
  Segmented,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SidebarNav,
  Sparkline,
  Stat,
  StatusBar,
  StatusDot,
  StatusItem,
  TitleBar,
  Timeline,
  toast,
  Toolbar,
  ToolbarSpacer,
  useCommandPaletteShortcut,
  useTheme,
  WindowResizeEdges,
} from "@nexis/design";

type Range = "1h" | "24h" | "7d";

export default function App() {
  const theme = useTheme();
  const [page, setPage] = React.useState("overview");
  const [range, setRange] = React.useState<Range>("24h");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [acked, setAcked] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  // Live data never animates: the tick changes numbers in place.
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const latency = React.useMemo(() => series(60, 3 + tick * 0.05, 52, 22), [tick]);
  const lastWeek = React.useMemo(() => series(60, 9, 46, 14), []);
  const svc = SERVICES.find((s) => s.id === selected) ?? null;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <TitleBar brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />} title="Pulse" />
      <div className="flex min-h-0 flex-1">
        <SidebarNav
          value={page}
          onChange={setPage}
          sections={[
            {
              title: "Monitor",
              items: [
                { id: "overview", label: "Overview", icon: "home" },
                { id: "services", label: "Services", icon: "server", meta: SERVICES.length },
                { id: "alerts", label: "Alerts", icon: "notification", meta: acked ? undefined : 1 },
              ],
            },
            { title: "Admin", items: [{ id: "settings", label: "Settings", icon: "settings" }] },
          ]}
          footer={
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <StatusDot tone="success" /> on call · Ryan
            </div>
          }
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <Toolbar>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>pulse</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{page}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <ToolbarSpacer />
            <Segmented
              size="sm"
              label="Range"
              value={range}
              onChange={setRange}
              segments={[
                { id: "1h", label: "1H" },
                { id: "24h", label: "24H" },
                { id: "7d", label: "7D" },
              ]}
            />
            <Button variant="ghost" size="icon-sm" aria-label="Search" onClick={() => setPaletteOpen(true)}>
              <Icon name="search" />
            </Button>
          </Toolbar>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 nexis-scrollbar">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Stat label="Requests / s" value={formatCompact(3852 + (tick % 7) * 13)} delta={3.4} trend={series(20, 1, 50, 20)} />
                <Stat label="p95 latency" value={`${Math.round(latency[latency.length - 1])} ms`} delta={-2} lowerIsBetter trend={series(20, 2, 50, 10)} />
                <Stat label="Error rate" value="0.31%" delta={0.1} lowerIsBetter trend={series(20, 5, 30, 5)} />
                <Stat label="Uptime" value="99.99%" delta={0} />
              </div>

              <Panel title="Latency" meta={`p95 · last ${range} · dashed = last week`}>
                <LineChart
                  label="p95 latency"
                  values={latency}
                  compare={lastWeek}
                  labels={latency.map((_, i) => (i === latency.length - 1 ? "now" : `-${latency.length - i}m`))}
                  format={(v) => `${Math.round(v)}ms`}
                  height={220}
                />
              </Panel>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Panel title="Services" meta="click a row for details" flush>
                  <DataTable
                    label="Services"
                    columns={COLUMNS}
                    rows={SERVICES}
                    rowKey={(s) => s.id}
                    defaultSort={{ key: "rps", dir: "desc" }}
                    selected={selected}
                    onSelect={setSelected}
                  />
                </Panel>
                <Panel title="Incidents" meta="today">
                  <div className="flex flex-col gap-4">
                    {!acked && (
                      <Alert className="border-warning/40 bg-warning/8">
                        <Icon name="alert" className="text-warning" />
                        <AlertTitle>Search degraded</AlertTitle>
                        <AlertDescription>p95 above 120 ms in us-east-1</AlertDescription>
                        <AlertAction>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setAcked(true);
                              toast.success("Acknowledged", { description: "search · us-east-1" });
                            }}
                          >
                            Acknowledge
                          </Button>
                        </AlertAction>
                      </Alert>
                    )}
                    <Timeline
                      events={[
                        { id: "1", time: "12:04", title: "Deploy finished", detail: "api · build 4412", tone: "success" },
                        { id: "2", time: "11:58", title: "Latency alert", detail: "search · us-east-1", tone: "warning", live: !acked },
                        { id: "3", time: "09:30", title: "Daily report sent", tone: "neutral" },
                      ]}
                    />
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        </main>
      </div>
      <StatusBar
        left={
          <>
            <StatusItem>
              <span className="flex items-center gap-1.5">
                <StatusDot tone="success" live /> Live
              </span>
            </StatusItem>
            <StatusItem live>tick {tick}</StatusItem>
          </>
        }
        right={
          <>
            <StatusItem>{SERVICES.length} services</StatusItem>
            <StatusItem icon={theme.resolvedMode === "dark" ? "theme-dark" : "theme-light"}>{theme.theme.name}</StatusItem>
          </>
        }
      />

      <Sheet open={svc !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {svc && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <StatusDot tone={svc.status === "ok" ? "success" : "warning"} /> {svc.name}
                </SheetTitle>
                <SheetDescription>{svc.region}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4">
                <Sparkline values={series(40, svc.p95, svc.p95, 12)} width={320} height={56} />
                <PropertyList
                  items={[
                    { label: "Status", value: <Badge variant={svc.status === "ok" ? "success" : "warning"}>{svc.status}</Badge> },
                    { label: "Requests/s", value: svc.rps, mono: true },
                    { label: "p95", value: `${svc.p95} ms`, mono: true },
                    { label: "Errors", value: `${svc.errors.toFixed(2)}%`, mono: true },
                    { label: "Owner", value: "platform" },
                  ]}
                />
              </div>
              <SheetFooter>
                <Button variant="brand" onClick={() => toast("Paging platform on-call…")}>
                  Page owner
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={[
          ...["overview", "services", "alerts", "settings"].map((p) => ({
            id: `go-${p}`,
            label: `Go to ${p[0].toUpperCase()}${p.slice(1)}`,
            group: "Navigate",
            icon: "arrow-right" as const,
            run: () => setPage(p),
          })),
          ...SERVICES.map((s) => ({
            id: `svc-${s.id}`,
            label: `Open service: ${s.name}`,
            group: "Services",
            icon: "server" as const,
            run: () => setSelected(s.id),
          })),
          {
            id: "mode",
            label: "Toggle light / dark",
            group: "View",
            icon: "contrast",
            run: () => theme.setMode(theme.resolvedMode === "dark" ? "light" : "dark"),
          },
        ]}
      />
    </div>
  );
}

// ── Fixture data — replace with your source ─────────────────────────────────

type Service = { id: string; name: string; region: string; rps: number; p95: number; errors: number; status: "ok" | "degraded" };

const SERVICES: Service[] = [
  { id: "ingest", name: "ingest", region: "eu-west-1", rps: 1204, p95: 77, errors: 0.91, status: "ok" },
  { id: "queue", name: "queue", region: "us-east-1", rps: 942, p95: 65, errors: 0.68, status: "ok" },
  { id: "api", name: "api", region: "us-east-1", rps: 905, p95: 63, errors: 0.35, status: "ok" },
  { id: "media", name: "media", region: "us-west-2", rps: 851, p95: 56, errors: 0.73, status: "ok" },
  { id: "auth", name: "auth", region: "us-east-1", rps: 624, p95: 32, errors: 0.58, status: "ok" },
  { id: "search", name: "search", region: "us-east-1", rps: 336, p95: 128, errors: 2.62, status: "degraded" },
  { id: "billing", name: "billing", region: "eu-west-1", rps: 195, p95: 14, errors: 0.47, status: "ok" },
];

const COLUMNS: Column<Service, "name" | "region" | "rps" | "p95" | "errors">[] = [
  {
    key: "name",
    header: "Service",
    sortable: true,
    cell: (s) => (
      <span className="flex items-center gap-2">
        <StatusDot tone={s.status === "ok" ? "success" : "warning"} /> {s.name}
      </span>
    ),
  },
  { key: "region", header: "Region", sortable: true, cell: (s) => <span className="text-muted-foreground">{s.region}</span> },
  { key: "rps", header: "Req/s", numeric: true, sortable: true },
  { key: "p95", header: "p95", numeric: true, sortable: true, cell: (s) => `${s.p95}ms` },
  { key: "errors", header: "Errors", numeric: true, sortable: true, cell: (s) => `${s.errors.toFixed(2)}%` },
];

function series(n: number, seed: number, base: number, amp: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, base + amp * Math.sin(i / 6 + seed) + amp * 0.35 * Math.sin(i / 2.1 + seed * 2) + amp * 0.15 * Math.cos(i * 1.7)),
  );
}
