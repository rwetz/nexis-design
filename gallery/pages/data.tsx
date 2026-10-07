import * as React from "react";
import {
  Avatar,
  AvatarStack,
  Badge,
  type Column,
  DataTable,
  Icon,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Button,
  PropertyList,
  StatusDot,
  Timeline,
  Tree,
  type TreeNode,
  VirtualList,
  cn,
} from "@nexis/design";
import { logLine, SERVICES, type Service } from "../data";
import { Demo, Grid, Page } from "../kit";

const TREE: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "src/components",
        label: "components",
        children: [
          { id: "src/components/ui", label: "ui", meta: "58", children: [{ id: "x", label: "button.tsx" }] },
          { id: "src/components/TitleBar.tsx", label: "TitleBar.tsx", icon: "file-code" },
          { id: "src/components/StatusBar.tsx", label: "StatusBar.tsx", icon: "file-code" },
        ],
      },
      { id: "src/theme", label: "theme", children: [{ id: "src/theme/applyTheme.ts", label: "applyTheme.ts", icon: "file-code" }] },
      { id: "src/index.ts", label: "index.ts", icon: "file-code" },
    ],
  },
  { id: "docs", label: "docs", children: [{ id: "docs/DESIGN_LANGUAGE.md", label: "DESIGN_LANGUAGE.md", icon: "document" }] },
  { id: "package.json", label: "package.json", icon: "file" },
  { id: "README.md", label: "README.md", icon: "document" },
];

type K = "name" | "region" | "rps" | "p95" | "errors" | "status";
const COLUMNS: Column<Service, K>[] = [
  {
    key: "name",
    header: "Service",
    sortable: true,
    cell: (s) => (
      <span className="flex items-center gap-2">
        <StatusDot tone={s.status === "ok" ? "success" : s.status === "degraded" ? "warning" : "danger"} />
        {s.name}
      </span>
    ),
  },
  { key: "region", header: "Region", sortable: true, cell: (s) => <span className="text-muted-foreground">{s.region}</span> },
  { key: "rps", header: "Req/s", numeric: true, sortable: true },
  { key: "p95", header: "p95", numeric: true, sortable: true, cell: (s) => `${s.p95}ms` },
  { key: "errors", header: "Errors", numeric: true, sortable: true, cell: (s) => `${s.errors.toFixed(2)}%` },
];

const LEVEL_TONE: Record<string, string> = {
  error: "text-destructive",
  warn: "text-warning",
  debug: "text-muted-foreground/70",
  info: "text-info",
};

export function DataPage() {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(["src", "src/components"]));
  const [file, setFile] = React.useState<string | null>("src/components/TitleBar.tsx");
  const [sel, setSel] = React.useState<string | null>("search");
  const svc = SERVICES.find((s) => s.id === sel);

  return (
    <Page
      title="Data"
      lede="Tables sort with a three-state cycle and keep blanks last in both directions. Numbers are right-aligned Geist Mono in tabular figures, so columns of digits line up. Selection is the accent's quiet tint plus a leading bar — never a block of strong colour."
    >
      <Grid cols={3} className="lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Demo title="Data table" meta="click a header to sort, a row to select" flush>
          <DataTable
            label="Services"
            columns={COLUMNS}
            rows={SERVICES}
            rowKey={(s) => s.id}
            defaultSort={{ key: "rps", dir: "desc" }}
            selected={sel}
            onSelect={setSel}
            className="max-h-[340px]"
          />
        </Demo>
        <Demo title="Property list" meta={svc ? svc.name : "—"}>
          {svc && (
            <PropertyList
              items={[
                { label: "Status", value: <Badge variant={svc.status === "ok" ? "success" : "warning"}>{svc.status}</Badge> },
                { label: "Region", value: svc.region },
                { label: "Requests/s", value: svc.rps, mono: true },
                { label: "p95", value: `${svc.p95} ms`, mono: true },
                { label: "Error rate", value: `${svc.errors.toFixed(2)}%`, mono: true },
                { label: "Owner", value: "platform" },
              ]}
            />
          )}
        </Demo>
      </Grid>

      <Grid cols={3}>
        <Demo title="Tree" meta="arrows · enter · home/end" flush bodyClassName="py-1">
          <Tree label="Files" nodes={TREE} expanded={expanded} onExpandedChange={setExpanded} selected={file} onSelect={(id) => setFile(id)} />
        </Demo>
        <Demo title="Virtual list" meta="10,000 rows" flush>
          <VirtualList
            label="Log"
            count={10000}
            rowHeight={24}
            className="h-[300px] py-1"
            renderRow={(i) => {
              const l = logLine(i);
              return (
                <div className="flex h-full items-center gap-3 px-4 font-mono text-[11.5px] hover:bg-muted/50">
                  <span className="w-12 shrink-0 text-right text-muted-foreground/60 tabular-nums">{i + 1}</span>
                  <span className="shrink-0 text-muted-foreground">{l.t}</span>
                  <span className={cn("w-10 shrink-0 uppercase", LEVEL_TONE[l.level])}>{l.level}</span>
                  <span className="truncate">{l.msg}</span>
                </div>
              );
            }}
          />
        </Demo>
        <Demo title="Timeline" meta="today">
          <Timeline
            events={[
              { id: "1", time: "12:04", title: "Deploy finished", detail: "api · build 4412", tone: "success" },
              { id: "2", time: "11:58", title: "Latency alert", detail: "search · us-east-1", tone: "warning", live: true },
              { id: "3", time: "10:41", title: "Config changed", detail: "ingest · pool 16 → 24", tone: "info" },
              { id: "4", time: "09:30", title: "Daily report sent", tone: "neutral" },
            ]}
          />
        </Demo>
      </Grid>

      <Grid cols={2}>
        <Demo title="Items" meta="list rows with media and actions">
          <ItemGroup className="gap-2">
            {[
              { name: "Ada Lovelace", role: "Reviewer", presence: "online" as const },
              { name: "Grace Hopper", role: "Maintainer", presence: "away" as const },
              { name: "Alan Turing", role: "Contributor", presence: "offline" as const },
            ].map((p) => (
              <Item key={p.name} variant="outline" size="sm">
                <ItemMedia>
                  <Avatar name={p.name} presence={p.presence} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{p.name}</ItemTitle>
                  <ItemDescription>{p.role}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="ghost" size="icon-sm" aria-label="Message">
                    <Icon name="chat" />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </Demo>
        <Demo title="Avatars" meta="initials on neutral — no per-user confetti">
          <div className="flex items-center gap-3">
            <Avatar name="Ryan Wetzstein" size={40} presence="online" />
            <Avatar name="Grace Hopper" size={32} presence="busy" />
            <Avatar name="Linus" size={28} presence="away" />
            <Avatar name="Ken Thompson" size={24} />
          </div>
          <AvatarStack names={["Ada Lovelace", "Grace Hopper", "Alan Turing", "Barbara Liskov", "Edsger Dijkstra", "Donald Knuth"]} />
        </Demo>
      </Grid>
    </Page>
  );
}
