import * as React from "react";
import {
  AuroraBorder,
  Blink,
  Button,
  Icon,
  ResultArrival,
  RunLive,
  SceneEnter,
  Segmented,
  Spinner,
  Stagger,
  ThoughtLine,
  useTheme,
  DEFAULT_THEME_ID,
  Textarea,
} from "@nexis/design";
import { Demo, Grid, Page } from "../kit";

function Curve({ d, label, color }: { d: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="-4 -4 108 108" className="size-28 overflow-visible">
        <rect x="0" y="0" width="100" height="100" rx="6" fill="none" stroke="var(--border)" />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function MotionPage() {
  const [n, setN] = React.useState(0);
  const [range, setRange] = React.useState<"1h" | "24h" | "7d" | "30d">("24h");
  const t = useTheme();
  return (
    <Page
      title="Motion"
      lede="Derived from what Nexis is — a terminal. Transitions are short and decisive; pending states blink at a caret's cadence instead of breathing; indeterminate progress ticks in steps because a character cell cannot sweep. Effects are moments that carry information — a scene arriving, a result landing, a run that is alive — never decoration. All of it switches off under reduced motion."
    >
      <Grid cols={3}>
        <Demo title="Curves" meta="asymmetric · no overshoot" bodyClassName="flex-row justify-around">
          <Curve d="M0,100 C20,100 0,0 100,0" label="--ease-enter" color="var(--brand)" />
          <Curve d="M0,100 C40,100 100,0 100,0" label="--ease-exit" color="var(--muted-foreground)" />
        </Demo>
        <Demo title="Live indicators" meta="caret blink · stepped spin · thought line">
          <div className="flex flex-col gap-3 text-sm">
            <span className="flex items-center gap-2">
              <Blink className="inline-block h-4 w-2 rounded-[1px] bg-brand" /> caret cadence, 1060ms square wave
            </span>
            <span className="flex items-center gap-2">
              <Spinner /> four quarter-turns, not a sweep
            </span>
            <span className="flex items-center gap-2">
              <ThoughtLine width={40} /> a stream still arriving
            </span>
          </div>
        </Demo>
        <Demo title="Gliding rail" meta="interruptible spring · clip-path, no relayout">
          <Segmented
            label="Range"
            value={range}
            onChange={setRange}
            segments={[
              { id: "1h", label: "1H" },
              { id: "24h", label: "24H" },
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
            ]}
          />
          <p className="text-xs text-muted-foreground">Click fast between ends: the pill retargets mid-flight instead of finishing the old trip first.</p>
        </Demo>
      </Grid>

      <Demo
        title="Moments"
        meta="each plays once"
        actions={
          <Button size="xs" variant="secondary" onClick={() => setN((x) => x + 1)}>
            <Icon name="refresh" size="xs" /> Replay
          </Button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Scene enter · 420ms</span>
            <SceneEnter replayKey={n} className="grid h-36 place-items-center rounded-2xl bg-muted/60 text-sm text-muted-foreground">
              A canvas or companion window arriving
            </SceneEnter>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Stagger · 70ms apart</span>
            <Stagger replayKey={n} className="grid h-36 grid-cols-3 gap-2">
              {["Bare", "Standard", "Everything"].map((x) => (
                <div key={x} className="grid place-items-center rounded-2xl bg-muted/60 text-xs text-muted-foreground">
                  {x}
                </div>
              ))}
            </Stagger>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Result arrival · one accent flash</span>
            <ResultArrival replayKey={n} className="flex h-36 flex-col justify-center gap-1 rounded-2xl bg-card p-4 ring-1 ring-border">
              <span className="text-xs text-muted-foreground">llama.cpp · q4_k_m</span>
              <span className="font-heading text-3xl font-medium tabular-nums">48.2 tok/s</span>
              <span className="text-xs text-success">+12% vs onnx</span>
            </ResultArrival>
          </div>
        </div>
      </Demo>

      <Grid cols={2}>
        <Demo title="Run live" meta="a long operation that is alive">
          <RunLive className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <Spinner />
            <div className="flex flex-col">
              <span className="text-sm">Benchmark · 4 models × 3 backends</span>
              <span className="text-xs text-muted-foreground">cell 7 of 12</span>
            </div>
          </RunLive>
        </Demo>
        <Demo title="Aurora" meta={t.themeId === DEFAULT_THEME_ID && t.rainbowAccent ? "full spectrum on Nexis Default" : "the theme's accent"}>
          <AuroraBorder className="rounded-2xl">
            <Textarea rows={2} placeholder="Ask about this workspace…" className="rounded-2xl bg-card" />
          </AuroraBorder>
        </Demo>
      </Grid>

      <Demo title="Rainbow hover" meta="Nexis Default only · hover the ghost buttons">
        <div className="flex flex-wrap items-center gap-2">
          {(["search", "git-branch", "terminal", "debug", "settings"] as const).map((i) => (
            <Button key={i} variant="ghost" size="sm">
              <Icon name={i} /> {i.replace("-", " ")}
            </Button>
          ))}
          <Button variant="ghost" size="sm">
            Text only
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The default theme is the one neutral palette, so its hover lights the glyph (or the label) with one of four rotating gradients. Every other theme's accent is its identity, so it never gets one; high contrast turns it off.
        </p>
      </Demo>
    </Page>
  );
}
