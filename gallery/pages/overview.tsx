import * as React from "react";
import {
  Badge,
  Button,
  CallChip,
  fmtShortcut,
  Icon,
  ICON_NAMES,
  Kbd,
  KbdGroup,
  LineChart,
  listBuiltinThemes,
  Meter,
  MOD_KEY,
  Panel,
  Segmented,
  SHIFT_KEY,
  Stat,
  Switch,
  Timeline,
  Tree,
  useTheme,
  type TreeNode,
  ThoughtLine,
  AuroraBorder,
  Textarea,
} from "@nexis/design";
import { wave } from "../data";
import { Page } from "../kit";

const TREE: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "theme", label: "theme", children: [{ id: "a", label: "applyTheme.ts", icon: "file-code" }] },
      { id: "ui", label: "ui", meta: "58" },
      { id: "icon.tsx", label: "icon.tsx", icon: "file-code" },
    ],
  },
  { id: "docs", label: "docs" },
  { id: "readme", label: "README.md", icon: "document" },
];

const STARTED = Date.now() - 128 * 1000;
const LAT = wave(48, 3, 52, 22, 8);
const BASE = wave(48, 9, 46, 14, 4);

export function OverviewPage() {
  const t = useTheme();
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(["src", "theme"]));
  const [range, setRange] = React.useState<"1h" | "24h" | "7d">("24h");
  const themes = listBuiltinThemes();

  return (
    <Page title="" className="pt-10">
      <section className="flex flex-wrap items-center gap-6">
        <img src="./brand/nexis-logo.png" alt="" className="size-16" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="font-heading text-4xl font-medium tracking-tight">Nexis Design</h1>
          <p className="max-w-[70ch] text-sm text-muted-foreground">
            The design system for the Nexis family of Tauri desktop apps: OKLCH tokens, {themes.length} themes, a runtime theme engine,
            the components, the motion vocabulary, borderless window chrome and the cursor set — the same layer Nexis itself is built on.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="brand" onClick={() => (location.hash = "/controls")}>
            Components <Icon name="arrow-right" />
          </Button>
          <Button variant="secondary" onClick={() => (location.hash = "/app/dashboard")}>
            Templates
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Themes" value={themes.length} caption="light + dark" />
        <Stat label="Components" value="70+" />
        <Stat label="Icons" value={ICON_NAMES.length} />
        <Stat label="App templates" value="7" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Latency"
          meta="p95 · dashed = last week"
          actions={
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
          }
        >
          <LineChart values={LAT} compare={BASE} format={(v) => `${Math.round(v)}ms`} height={190} label="Latency" />
        </Panel>
        <Panel title="Controls" meta="one accent">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="brand">
                <Icon name="play" /> Run
              </Button>
              <Button variant="secondary">Step</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="destructive" size="icon" aria-label="Delete">
                <Icon name="delete" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">live</Badge>
              <Badge variant="success">ok</Badge>
              <Badge variant="warning">degraded</Badge>
              <Badge variant="destructive">fault</Badge>
              <KbdGroup className="ml-auto">
                <Kbd>{MOD_KEY}</Kbd>
                <Kbd>{SHIFT_KEY}</Kbd>
                <Kbd>P</Kbd>
              </KbdGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Meter label="cpu" value={0.49} />
              <Meter label="mem" value={0.81} />
            </div>
            <div className="flex items-center gap-3">
              <Switch defaultChecked id="ov-sw" />
              <label htmlFor="ov-sw" className="text-sm">
                Format on save
              </label>
              <span className="ml-auto">
                <CallChip label="cargo build" startedAtMs={STARTED} onEnd={() => {}} />
              </span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Explorer" flush bodyClassName="py-1">
          <Tree label="Files" nodes={TREE} expanded={expanded} onExpandedChange={setExpanded} selected="a" />
        </Panel>
        <Panel title="Activity" meta="today">
          <Timeline
            events={[
              { id: "1", time: "12:04", title: "Released v1.31.0", detail: "6 platforms", tone: "success" },
              { id: "2", time: "11:58", title: "Agent run", detail: "refactor · 4 files", tone: "brand", live: true },
              { id: "3", time: "09:30", title: "Theme set regenerated", detail: "17 palettes", tone: "neutral" },
            ]}
          />
        </Panel>
        <Panel title="Assistant" meta={<span className="inline-flex items-center gap-1.5"><ThoughtLine /> thinking</span>}>
          <AuroraBorder className="rounded-2xl">
            <Textarea rows={3} placeholder="Ask about this workspace…" className="rounded-2xl bg-card" />
          </AuroraBorder>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{fmtShortcut(MOD_KEY, "↵")} to send</span>
            <span>{t.resolvedMode === "dark" ? "Dark" : "Light"} · {themes.find((x) => x.id === t.themeId)?.name}</span>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
