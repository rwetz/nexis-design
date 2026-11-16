// ╔══════════════════════════════════════╗
// ║  @nexis/design · app template        ║
// ║  explorer                            ║
// ╚══════════════════════════════════════╝
//
// Shape: search + filter toolbar · paginated sortable table or a card grid
// (the view switch) · details sheet.
// Start here for: CRUD/admin panels, issue trackers, CRMs, database
// browsers, inventories, libraries and catalogues (keep the grid; give cards
// pictures with `image` and `aspect="portrait"`, or use `ProductCard`).
//
// Narrow windows: secondary controls step aside (`@max-*/toolbar:hidden`)
// and stay in the command palette.

import * as React from "react";
import {
  Avatar,
  Badge,
  Button,
  CardBadge,
  type Column,
  CommandPalette,
  DataBoundary,
  DataTable,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Icon,
  Input,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PropertyList,
  Segmented,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  sortRows,
  type SortState,
  StatusBar,
  StatusItem,
  Switch,
  TitleBar,
  toast,
  ThumbnailCard,
  ThumbnailGrid,
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  useCommandPaletteShortcut,
  useLoad,
  WindowResizeEdges,
  Checkbox,
  NexisMark,
} from "@nexis/design";

type Status = "open" | "in-progress" | "done";
type Issue = { id: string; title: string; status: Status; owner: string; points: number; updated: number };
type K = "id" | "title" | "status" | "owner" | "points" | "updated";

const PAGE = 14;
const STATUS_TONE = { open: "secondary", "in-progress": "info", done: "success" } as const;

// The data arrives through one async function, so the view already has its
// loading, error and empty states (RULES R7.3). Replace the body with
// `call<Issue[]>("list_issues", {}, ISSUES)` from src/backend.ts.
const fetchIssues = async () => ISSUES;
const NONE: Issue[] = [];

export default function App() {
  const { state, reload } = useLoad(fetchIssues, []);
  const [closed, setClosed] = React.useState<ReadonlySet<string>>(() => new Set());
  const issues = React.useMemo(() => state.status === "ready"
    ? state.data.map((issue) => closed.has(issue.id) ? { ...issue, status: "done" as const } : issue)
    : NONE, [closed, state]);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | Status>("all");
  const [mine, setMine] = React.useState(false);
  const [owners, setOwners] = React.useState<Set<string>>(() => new Set(OWNERS));
  const [sort, setSort] = React.useState<SortState<K>>({ key: "updated", dir: "asc" });
  // The page belongs to one set of filters: a new search starts on page 1.
  // Kept with the filters it was chosen under rather than reset by an effect
  // after the fact, which drew one frame of an empty page 7 (RULES R14.3).
  const filterKey = JSON.stringify([query, status, mine, [...owners]]);
  const [paged, setPaged] = React.useState({ key: filterKey, page: 1 });
  const page = paged.key === filterKey ? paged.page : 1;
  const setPage = (p: number) => setPaged({ key: filterKey, page: p });
  const [selected, setSelected] = React.useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [view, setView] = React.useState<"table" | "grid">("table");
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = issues.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!mine || r.owner === "Ryan Wetzstein") &&
        owners.has(r.owner) &&
        (q === "" || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)),
    );
    return sortRows(rows, sort, (r, k) => r[k]);
  }, [issues, query, status, mine, owners, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE, current * PAGE);
  const issue = issues.find((i) => i.id === selected) ?? null;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <TitleBar brand={<NexisMark className="size-[18px]" />} title="Ledger" />
      <Toolbar>
        <div className="relative w-72 min-w-32 shrink">
          <Icon name="search" className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search issues…" className="h-8 pl-8" />
        </div>
        <Segmented
          size="sm"
          label="Status"
          className="@max-3xl/toolbar:hidden"
          value={status}
          onChange={setStatus}
          segments={[
            { id: "all", label: "All" },
            { id: "open", label: "Open" },
            { id: "in-progress", label: "In progress" },
            { id: "done", label: "Done" },
          ]}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Icon name="filter" /> Owners
              {owners.size < OWNERS.length && <Badge variant="brand">{owners.size}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-60">
            <div className="flex flex-col gap-3">
              {OWNERS.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={owners.has(o)}
                    onCheckedChange={(v) =>
                      setOwners((s) => {
                        const n = new Set(s);
                        if (v) n.add(o);
                        else n.delete(o);
                        return n;
                      })
                    }
                  />
                  <Avatar name={o} size={20} /> {o}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <span className="contents @max-4xl/toolbar:hidden">
          <ToolbarSeparator />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch size="sm" checked={mine} onCheckedChange={setMine} /> Mine
          </label>
        </span>
        <ToolbarSpacer />
        <Segmented
          size="sm"
          label="View"
          value={view}
          onChange={setView}
          segments={[
            { id: "table", label: "Table" },
            { id: "grid", label: "Grid" },
          ]}
        />
        <Button variant="brand" size="sm" onClick={() => toast("New issue")}>
          <Icon name="add" /> New issue
        </Button>
      </Toolbar>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-2">
        <DataBoundary
          state={state}
          onRetry={reload}
          noun="issues"
          className="h-full"
          empty={
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyTitle>No issues yet</EmptyTitle>
                <EmptyDescription>Create the first one to start tracking work.</EmptyDescription>
              </EmptyHeader>
              <Button variant="brand" onClick={() => toast("New issue")}>
                <Icon name="add" /> New issue
              </Button>
            </Empty>
          }
        >
          {() => (<>
        {rows.length === 0 ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyTitle>No issues match</EmptyTitle>
              <EmptyDescription>Clear the search or widen the filters.</EmptyDescription>
            </EmptyHeader>
            <Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); setMine(false); setOwners(new Set(OWNERS)); }}>
              Reset filters
            </Button>
          </Empty>
        ) : view === "grid" ? (
          <div className="-mx-1 h-full overflow-y-auto px-1 pt-1 pb-4 nexis-scrollbar">
            <ThumbnailGrid min="11rem">
              {rows.map((r) => (
                <ThumbnailCard
                  key={r.id}
                  title={r.title}
                  meta={`${r.id} · ${r.owner}`}
                  aspect="landscape"
                  placeholder={<Icon name="document" size="xl" />}
                  overlay={<CardBadge>{r.status}</CardBadge>}
                  selected={selected === r.id}
                  onClick={() => setSelected(r.id)}
                />
              ))}
            </ThumbnailGrid>
          </div>
        ) : (
          <DataTable
            label="Issues"
            columns={COLUMNS}
            rows={rows}
            rowKey={(r) => r.id}
            sort={sort}
            onSortChange={(s) => setSort(s)}
            selected={selected}
            onSelect={setSelected}
            className="h-full"
          />
        )}
          </>)}
        </DataBoundary>
      </div>

      <div className="flex h-12 shrink-0 items-center gap-3 border-t border-border/60 px-4">
        <span className="text-ui text-muted-foreground tabular-nums">
          {filtered.length === 0 ? 0 : (current - 1) * PAGE + 1}–{Math.min(current * PAGE, filtered.length)} of {filtered.length}
        </span>
        <span className="flex-1" />
        <Pagination total={pages} page={current} onChange={setPage} />
      </div>

      <StatusBar
        left={<StatusItem icon="database">issues.sqlite</StatusItem>}
        right={state.status === "ready" ? <StatusItem live>{filtered.length} rows</StatusItem> : undefined}
      />

      <Sheet open={issue !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="sm:max-w-md">
          {issue && (
            <>
              <SheetHeader>
                <SheetDescription className="font-mono">{issue.id}</SheetDescription>
                <SheetTitle>{issue.title}</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <PropertyList
                  items={[
                    { label: "Status", value: <Badge variant={STATUS_TONE[issue.status]}>{issue.status}</Badge> },
                    { label: "Owner", value: <span className="inline-flex items-center gap-2"><Avatar name={issue.owner} size={20} />{issue.owner}</span> },
                    { label: "Points", value: issue.points, mono: true },
                    { label: "Updated", value: `${issue.updated}d ago` },
                  ]}
                />
              </div>
              <SheetFooter>
                {closed.has(issue.id) ? (
                  <Button variant="secondary" onClick={() => {
                    setClosed((previous) => {
                      const next = new Set(previous);
                      next.delete(issue.id);
                      return next;
                    });
                    toast.success(`${issue.id} reopened`);
                  }}>Reopen issue</Button>
                ) : issue.status !== "done" && (
                  <Button variant="brand" onClick={() => {
                    setClosed((previous) => new Set(previous).add(issue.id));
                    toast.success(`${issue.id} closed`);
                  }}>Close issue</Button>
                )}
                <Button variant="outline" onClick={() => setSelected(null)}>Close details</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={[
          ...(["all", "open", "in-progress", "done"] as const).map((s) => ({
            id: `status-${s}`,
            label: `Show ${s === "all" ? "all statuses" : s}`,
            group: "Filter",
            icon: "filter" as const,
            run: () => setStatus(s),
          })),
          { id: "mine", label: mine ? "Show everyone's" : "Show only mine", group: "Filter", icon: "user" as const, run: () => setMine((m) => !m) },
          { id: "view", label: view === "table" ? "Show as grid" : "Show as table", group: "View", icon: "grid" as const, run: () => setView((v) => (v === "table" ? "grid" : "table")) },
          ...issues.slice(0, 40).map((i) => ({
            id: i.id,
            label: `${i.id} ${i.title}`,
            group: "Issues",
            icon: "document" as const,
            run: () => setSelected(i.id),
          })),
        ]}
      />
    </div>
  );
}

const COLUMNS: Column<Issue, K>[] = [
  { key: "id", header: "ID", sortable: true, width: 90, cell: (r) => <span className="font-mono text-ui text-muted-foreground">{r.id}</span> },
  { key: "title", header: "Title", sortable: true, cell: (r) => <span className="block max-w-[46ch] truncate">{r.title}</span> },
  { key: "status", header: "Status", sortable: true, cell: (r) => <Badge variant={STATUS_TONE[r.status]}>{r.status}</Badge> },
  {
    key: "owner",
    header: "Owner",
    sortable: true,
    cell: (r) => (
      <span className="flex items-center gap-2">
        <Avatar name={r.owner} size={20} />
        <span className="text-muted-foreground">{r.owner}</span>
      </span>
    ),
  },
  { key: "points", header: "Pts", numeric: true, sortable: true, width: 70 },
  { key: "updated", header: "Updated", numeric: true, sortable: true, width: 100, cell: (r) => `${r.updated}d` },
];

// ── Fixture data: replace with your source ──────────────────────────────────

const OWNERS = ["Ryan Wetzstein", "Ada Lovelace", "Grace Hopper", "Alan Turing"];
const VERBS = ["Fix", "Add", "Remove", "Speed up", "Document", "Refactor", "Test"];
const THINGS = ["theme crossfade on Linux", "rail spring retarget", "palette ranking for acronyms", "high-contrast tokens", "virtual list follow mode", "date picker min/max", "status bar overflow", "resize edges on KDE", "toast stacking", "icon registry pruning", "DataTable sticky header", "Segmented keyboard nav"];
const ISSUES: Issue[] = Array.from({ length: 124 }, (_, i) => {
  const a = (i * 7919) % 97;
  return {
    id: `NX-${(1200 + i).toString()}`,
    title: `${VERBS[a % VERBS.length]} ${THINGS[(a * 3 + i) % THINGS.length]}`,
    status: (["open", "in-progress", "done"] as const)[(a + i) % 3],
    owner: OWNERS[(a + 2 * i) % OWNERS.length],
    points: [1, 2, 3, 5, 8][a % 5],
    updated: (a % 30) + 1,
  };
});
