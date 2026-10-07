// ╔══════════════════════════════════════╗
// ║  @nexis/design — app template        ║
// ║  console                             ║
// ╚══════════════════════════════════════╝
//
// Shape: a filtered, virtualised log that follows the tail · level filters ·
// a command prompt · a long-running job chip.
// Start here for: log viewers, REPLs, job runners, serial monitors, chat
// transcripts.
//
// Follow mode behaves like a terminal: new lines keep the view pinned to the
// bottom only while it is already at the bottom; scrolling up to read
// releases it.

import * as React from "react";
import {
  Badge,
  Button,
  CallChip,
  cn,
  CommandPalette,
  Icon,
  Input,
  StatusBar,
  StatusDot,
  StatusItem,
  Switch,
  TitleBar,
  toast,
  Toggle,
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  useCommandPaletteShortcut,
  VirtualList,
  WindowResizeEdges,
} from "@nexis/design";

type Level = "debug" | "info" | "warn" | "error";
type Line = { n: number; t: string; level: Level; src: string; msg: string };

const LEVEL_CLASS: Record<Level, string> = {
  debug: "text-muted-foreground/70",
  info: "text-info",
  warn: "text-warning",
  error: "text-destructive",
};

export default function App() {
  const [lines, setLines] = React.useState<Line[]>(() => Array.from({ length: 400 }, (_, i) => make(i)));
  const [levels, setLevels] = React.useState<Record<Level, boolean>>({ debug: false, info: true, warn: true, error: true });
  const [filter, setFilter] = React.useState("");
  const [follow, setFollow] = React.useState(true);
  const [running, setRunning] = React.useState(true);
  const [cmd, setCmd] = React.useState("");
  const [started] = React.useState(() => Date.now() - 3 * 60 * 1000);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLines((l) => [...l, make(l.length)]), 450);
    return () => clearInterval(id);
  }, [running]);

  const shown = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    return lines.filter((l) => levels[l.level] && (q === "" || l.msg.toLowerCase().includes(q) || l.src.includes(q)));
  }, [lines, levels, filter]);
  const errors = lines.filter((l) => l.level === "error").length;

  const run = () => {
    const c = cmd.trim();
    if (!c) return;
    setLines((l) => [...l, { n: l.length, t: clock(l.length), level: "info", src: "you", msg: `$ ${c}` }]);
    setCmd("");
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <TitleBar brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />} title="Tail" />
      <Toolbar>
        <div className="relative w-64">
          <Icon name="filter" className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" className="h-8 pl-8 font-mono text-xs" />
        </div>
        <div className="flex items-center gap-1">
          {(Object.keys(levels) as Level[]).map((l) => (
            <Toggle
              key={l}
              size="sm"
              pressed={levels[l]}
              onPressedChange={(v) => setLevels((s) => ({ ...s, [l]: v }))}
              className={cn("font-mono text-[11px] uppercase", levels[l] && LEVEL_CLASS[l])}
            >
              {l}
            </Toggle>
          ))}
        </div>
        <ToolbarSeparator />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch size="sm" checked={follow} onCheckedChange={setFollow} /> Follow
        </label>
        <ToolbarSpacer />
        {running ? (
          <CallChip label="worker · ingest" startedAtMs={started} onEnd={() => { setRunning(false); toast("Stopped worker"); }} />
        ) : (
          <Button size="sm" variant="brand" onClick={() => setRunning(true)}>
            <Icon name="play" /> Start
          </Button>
        )}
      </Toolbar>

      <VirtualList
        label="Log"
        count={shown.length}
        rowHeight={22}
        follow={follow}
        className="min-h-0 flex-1 bg-[var(--terminal-background)] py-1"
        renderRow={(i) => {
          const l = shown[i];
          return (
            <div className="flex h-full items-center gap-3 px-4 font-mono text-[12px] hover:bg-muted/40">
              <span className="w-16 shrink-0 text-muted-foreground tabular-nums">{l.t}</span>
              <span className={cn("w-11 shrink-0 uppercase", LEVEL_CLASS[l.level])}>{l.level}</span>
              <span className="w-14 shrink-0 truncate text-muted-foreground">{l.src}</span>
              <span className={cn("truncate", l.src === "you" && "text-brand")}>{l.msg}</span>
            </div>
          );
        }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex h-11 shrink-0 items-center gap-2 border-t border-border/60 px-4"
      >
        <span className="font-mono text-sm text-brand">›</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Type a command and press Enter"
          className="h-full flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="xs" variant="ghost" disabled={!cmd.trim()}>
          Run
        </Button>
      </form>

      <StatusBar
        left={
          <>
            <StatusItem>
              <span className="flex items-center gap-1.5">
                <StatusDot tone={running ? "success" : "neutral"} live={running} /> {running ? "Streaming" : "Paused"}
              </span>
            </StatusItem>
            {errors > 0 && (
              <StatusItem onClick={() => setLevels({ debug: false, info: false, warn: false, error: true })}>
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">{errors} errors</Badge>
              </StatusItem>
            )}
          </>
        }
        right={
          <>
            <StatusItem live>
              {shown.length.toLocaleString()} / {lines.length.toLocaleString()} lines
            </StatusItem>
            <StatusItem>{follow ? "following" : "paused at scroll"}</StatusItem>
          </>
        }
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={[
          { id: "clear", label: "Clear log", group: "Log", icon: "delete", run: () => setLines([]) },
          { id: "errors", label: "Show only errors", group: "Log", icon: "alert-circle", run: () => setLevels({ debug: false, info: false, warn: false, error: true }) },
          { id: "all", label: "Show all levels", group: "Log", icon: "list-bullet", run: () => setLevels({ debug: true, info: true, warn: true, error: true }) },
          { id: "toggle", label: running ? "Pause stream" : "Resume stream", group: "Worker", icon: running ? "pause" : "play", run: () => setRunning((r) => !r) },
        ]}
      />
    </div>
  );
}

// ── Fixture data — replace with your source ─────────────────────────────────

const SRC = ["http", "worker", "cache", "db", "lsp", "ingest"];
const MSG: Record<Level, string[]> = {
  debug: ["poll tick", "lease renewed for shard 3", "gc pause 2ms"],
  info: ["GET /api/v1/projects 200 in 41ms", "worker 3 picked up job build#4412", "flushed 1,204 events", "POST /deploy 202 in 118ms", "cache hit ratio 0.93"],
  warn: ["slow query projects_by_owner (412ms)", "retrying upstream search (2/3)", "pool at 90% capacity"],
  error: ["upstream search timed out after 2000ms", "failed to parse payload: unexpected EOF"],
};

function clock(n: number) {
  const s = 9 * 3600 + 30 * 60 + n;
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}

function make(n: number): Line {
  const r = (n * 2654435761) % 100;
  const level: Level = r < 12 ? "debug" : r < 82 ? "info" : r < 95 ? "warn" : "error";
  const msgs = MSG[level];
  return { n, t: clock(n), level, src: SRC[(n * 31) % SRC.length], msg: msgs[(n * 17) % msgs.length] };
}
