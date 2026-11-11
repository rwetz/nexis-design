// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

// The principles of docs/RULES.md, each paired with the design that carries
// it out and the one that breaks it. The "Don't" columns break rules on
// purpose; nothing here is a pattern to copy except the "Do" columns.

import * as React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  cn,
  Icon,
  type IconName,
  Input,
  Progress,
  Segmented,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  StatusDot,
  Switch,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@nexis/design";
import { Page } from "../kit";

// ── Frame ────────────────────────────────────────────────────────────────────

type Layer = "Principle" | "Foundation" | "Pattern" | "Component";

function Principle({
  id,
  title,
  statement,
  ask,
  rules,
  doNote,
  dontNote,
  good,
  bad,
}: {
  id: string;
  title: string;
  statement: string;
  ask: string;
  rules: string[];
  doNote: string;
  dontNote: string;
  good: React.ReactNode;
  bad: React.ReactNode;
}) {
  return (
    <section id={id.toLowerCase()} className="flex flex-col gap-group rounded-2xl bg-card p-gutter ring-1 ring-border/60">
      <div className="flex max-w-prose flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-ui font-medium text-muted-foreground tabular-nums">{id}</span>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="text-body">{statement}</p>
        <p className="text-body text-muted-foreground">
          <span className="font-medium text-foreground">Ask:</span> {ask}
        </p>
        <div className="flex flex-wrap gap-1">
          {rules.map((r) => (
            <Badge key={r} variant="outline" className="tabular-nums">
              {r}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid gap-group md:grid-cols-2">
        <Column kind="do" note={doNote}>
          {good}
        </Column>
        <Column kind="dont" note={dontNote}>
          {bad}
        </Column>
      </div>
    </section>
  );
}

function Column({ kind, note, children }: { kind: "do" | "dont"; note: string; children: React.ReactNode }) {
  const isDo = kind === "do";
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2 text-ui font-medium">
        <Icon name={isDo ? "success" : "close"} size="sm" className={isDo ? "text-success" : "text-destructive"} />
        {isDo ? "Do" : "Don't"}
      </div>
      <div
        className={cn(
          "flex min-h-40 flex-col justify-center gap-3 rounded-xl p-gutter",
          isDo ? "bg-background ring-1 ring-border/60" : "bg-background ring-1 ring-destructive/30",
        )}
      >
        {children}
      </div>
      <p className="text-ui text-muted-foreground">{note}</p>
    </div>
  );
}

// ── P1 Predictable: an explicit machine vs a pile of flags ──────────────────

type Job = { state: "idle" } | { state: "running"; progress: number } | { state: "failed"; error: string } | { state: "done"; files: number };
const JOB_STATES: Job["state"][] = ["idle", "running", "failed", "done"];
const EDGES: Record<Job["state"], Job["state"][]> = { idle: ["running"], running: ["done", "failed"], failed: ["running"], done: ["idle"] };

function MachineDo() {
  const [job, setJob] = React.useState<Job>({ state: "idle" });
  const progress = job.state === "running" ? job.progress : null;
  // The fixture job: a timer standing in for real progress events.
  React.useEffect(() => {
    if (progress === null) return;
    const id = setTimeout(() => setJob(progress >= 100 ? { state: "done", files: 3 } : { state: "running", progress: progress + 10 }), 120);
    return () => clearTimeout(id);
  }, [progress]);
  const go = (to: Job["state"]) =>
    setJob(to === "running" ? { state: "running", progress: 0 } : to === "failed" ? { state: "failed", error: "Disk full" } : to === "done" ? { state: "done", files: 3 } : { state: "idle" });
  return (
    <>
      <div className="flex flex-wrap items-center gap-1 text-ui" aria-label="Job states">
        {JOB_STATES.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <Icon name="chevron-right" size="xs" className="text-muted-foreground" />}
            <span className={cn("rounded-full px-2 py-0.5 tabular-nums", job.state === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>{s}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="flex min-h-12 items-center gap-3 text-body">
        {job.state === "idle" && <span className="text-muted-foreground">Ready to export.</span>}
        {job.state === "running" && <Progress value={job.progress} className="flex-1" />}
        {job.state === "failed" && (
          <span className="flex items-center gap-2 text-destructive">
            <Icon name="alert" size="sm" /> {job.error}
          </span>
        )}
        {job.state === "done" && (
          <span className="flex items-center gap-2">
            <Icon name="success" size="sm" className="text-success" /> Exported {job.files} files
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["running", "failed", "done", "idle"] as const).map((to) => (
          <Button key={to} size="sm" variant="secondary" disabled={!EDGES[job.state].includes(to)} onClick={() => go(to)}>
            {to === "running" ? (job.state === "failed" ? "Retry" : "Start") : to === "failed" ? "Fail" : to === "done" ? "Finish" : "Reset"}
          </Button>
        ))}
      </div>
    </>
  );
}

function MachineDont() {
  const [flags, setFlags] = React.useState({ loading: true, error: true, data: true });
  const impossible = Number(flags.loading) + Number(flags.error) + Number(flags.data) > 1;
  return (
    <>
      <div className="flex flex-wrap gap-4 text-ui">
        {(Object.keys(flags) as (keyof typeof flags)[]).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <Checkbox checked={flags[k]} onCheckedChange={(v) => setFlags((f) => ({ ...f, [k]: v === true }))} />
            <span className="font-mono">{k}</span>
          </label>
        ))}
      </div>
      <div className="flex min-h-12 flex-wrap items-center gap-3 text-body">
        {flags.loading && <Spinner />}
        {flags.error && <span className="text-destructive">Export failed</span>}
        {flags.data && <span>Exported 3 files</span>}
        {!flags.loading && !flags.error && !flags.data && <span className="text-muted-foreground">Nothing at all</span>}
      </div>
      <p className={cn("text-ui", impossible ? "text-destructive" : "text-muted-foreground")}>
        {impossible ? "This combination cannot happen, and the screen shows it anyway." : "Eight combinations of three flags; four of them make sense."}
      </p>
    </>
  );
}

// ── P2 Clear ─────────────────────────────────────────────────────────────────

function ClearDo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="brand" size="sm">
        <Icon name="download" /> Export
      </Button>
      <Button variant="ghost" size="sm">
        Cancel
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Save">
            <Icon name="save" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ClearDont() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="brand" size="sm">
        OK
      </Button>
      <Button variant="secondary" size="sm" className="uppercase">
        Submit!
      </Button>
      <Button variant="ghost" size="icon-sm">
        <Icon name="more" />
      </Button>
    </div>
  );
}

// ── P3 Hierarchy ─────────────────────────────────────────────────────────────

function DialogSketch({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-popover p-4 ring-1 ring-border">
      <div className="text-sm font-medium">Delete 4 layers?</div>
      <p className="text-body text-muted-foreground">They can be restored from the history for 30 days.</p>
      <div className="flex flex-wrap justify-end gap-2">{children}</div>
    </div>
  );
}

// ── P4 Deference ─────────────────────────────────────────────────────────────

const ROWS: { id: string; label: string; icon: IconName }[] = [
  { id: "a", label: "Overview", icon: "home" },
  { id: "b", label: "Services", icon: "server" },
  { id: "c", label: "Alerts", icon: "notification" },
];

function ListDo() {
  const [on, setOn] = React.useState("b");
  return (
    <div className="flex flex-col gap-0.5">
      {ROWS.map((r) => (
        <button
          key={r.id}
          type="button"
          aria-current={on === r.id ? "page" : undefined}
          onClick={() => setOn(r.id)}
          className={cn("flex h-8 items-center gap-2 rounded-lg px-2 text-body outline-none focus-visible:ring-2 focus-visible:ring-ring", on === r.id ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}
        >
          <Icon name={r.icon} size="sm" active={on === r.id} /> {r.label}
        </button>
      ))}
    </div>
  );
}

const LOUD = ["text-info", "text-success", "text-warning"];
function ListDont() {
  const [on, setOn] = React.useState("b");
  return (
    <div className="flex flex-col gap-1 rounded-lg p-1 ring-1 ring-border">
      {ROWS.map((r, i) => (
        <button
          key={r.id}
          type="button"
          onClick={() => setOn(r.id)}
          className={cn("flex h-8 items-center gap-2 rounded-md border-l-4 px-2 text-body", on === r.id ? "border-brand bg-brand text-brand-foreground" : "border-transparent bg-muted/40")}
        >
          <Icon name={r.icon} size="sm" className={on === r.id ? undefined : LOUD[i]} /> {r.label}
        </button>
      ))}
    </div>
  );
}

// ── P5 Consistency ───────────────────────────────────────────────────────────

function ControlsDo() {
  const [wrap, setWrap] = React.useState(true);
  const [density, setDensity] = React.useState<"compact" | "default" | "roomy">("default");
  return (
    <div className="flex flex-col gap-3 text-body">
      <label className="flex items-center justify-between gap-3">
        Wrap lines <Switch checked={wrap} onCheckedChange={setWrap} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        Density
        <Segmented size="sm" label="Density" value={density} onChange={setDensity} segments={[{ id: "compact", label: "Compact" }, { id: "default", label: "Default" }, { id: "roomy", label: "Roomy" }]} />
      </div>
    </div>
  );
}

function ControlsDont() {
  const [wrap, setWrap] = React.useState("on");
  const [density, setDensity] = React.useState(false);
  return (
    <div className="flex flex-col gap-3 text-body">
      <div className="flex items-center justify-between gap-3">
        Wrap lines
        <Select value={wrap} onValueChange={setWrap}>
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on">On</SelectItem>
            <SelectItem value="off">Off</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center justify-between gap-3">
        Compact density <Checkbox checked={density} onCheckedChange={(v) => setDensity(v === true)} />
      </label>
    </div>
  );
}

// ── P6 Responsive feedback ───────────────────────────────────────────────────

type Save = { state: "idle" } | { state: "saving" };

function SaveDo() {
  const [save, setSave] = React.useState<Save>({ state: "idle" });
  const run = () => {
    setSave({ state: "saving" });
    setTimeout(() => {
      setSave({ state: "idle" });
      toast.success("Saved 2 changes", { action: { label: "Undo", onClick: () => toast("Changes undone") } });
    }, 900);
  };
  return (
    <div className="flex items-center gap-3">
      <Button variant="brand" size="sm" disabled={save.state === "saving"} onClick={run}>
        {save.state === "saving" ? <Spinner /> : <Icon name="save" />} Save
      </Button>
      <span className="text-ui text-muted-foreground">Busy in place, then a toast with Undo.</span>
    </div>
  );
}

function SaveDont() {
  const [text, setText] = React.useState("Save");
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="brand"
        size="sm"
        onClick={() => {
          setText("Saving your changes, please wait...");
          setTimeout(() => setText("Save"), 900);
        }}
      >
        {text}
      </Button>
    </div>
  );
}

// ── P7 Adaptable ─────────────────────────────────────────────────────────────

function StatusDo() {
  return (
    <div className="flex flex-col gap-2 text-body">
      <span className="flex items-center gap-2">
        <StatusDot tone="success" /> Healthy
      </span>
      <span className="flex items-center gap-2">
        <Icon name="alert" size="sm" className="text-warning" /> Degraded: p95 above 120 ms
      </span>
      <Input aria-label="Filter services" placeholder="Filter services" className="h-8" />
    </div>
  );
}

function StatusDont() {
  return (
    <div className="flex flex-col gap-2 text-body">
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-success" />
        api
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-warning" />
        search
      </span>
      <div className="flex h-8 items-center rounded-md bg-muted px-2 text-ui text-muted-foreground/50" onClick={() => {}}>
        filter...
      </div>
    </div>
  );
}

// ── The page ─────────────────────────────────────────────────────────────────

const LAYERS: { layer: Layer; answers: string; sections: string }[] = [
  { layer: "Principle", answers: "What matters; how to decide when no rule fits", sections: "P1 to P7" },
  { layer: "Foundation", answers: "What every screen is made of", sections: "§1 Type · §2 Scale · §3 Space · §6 Colour · §8 Motion · §10 Words · §15 Accessibility" },
  { layer: "Pattern", answers: "What kind of screen or moment this is", sections: "§4 Layouts · §5 Overlays · §14 State · §16 Feedback" },
  { layer: "Component", answers: "Which one thing does the job", sections: "§7 Controls · §9 Previews · §11 Templates" },
];

export function RulesPage() {
  return (
    <Page
      title="Rules"
      lede="The principles in docs/RULES.md, each beside the design that carries it out and one that breaks it. The order matters: when two principles pull apart, the higher one wins. The Don't columns break rules on purpose."
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {LAYERS.map((l, i) => (
          <div key={l.layer} className="flex flex-col gap-1 rounded-xl bg-card p-4 ring-1 ring-border/60">
            <span className="text-ui text-muted-foreground tabular-nums">Layer {i + 1}</span>
            <span className="text-sm font-medium">{l.layer}s</span>
            <span className="text-body text-muted-foreground">{l.answers}</span>
            <span className="text-ui">{l.sections}</span>
          </div>
        ))}
      </div>

      <Principle
        id="P1"
        title="Predictable"
        statement="What is on screen is one state. A flow with phases is one value whose type names every phase, so a state nobody designed cannot be drawn."
        ask="Can this screen be in a state its code did not name?"
        rules={["R14.2", "R14.3", "R14.5"]}
        doNote="One union: four named states, and only the transitions that exist are enabled. Progress lives inside running, so it cannot outlive it."
        dontNote="Three flags side by side. Turn them on in any mix and the screen draws a spinner, an error and a result at once."
        good={<MachineDo />}
        bad={<MachineDont />}
      />
      <Principle
        id="P2"
        title="Clear"
        statement="Every element says what it is and what it does: buttons are verbs, icon-only controls have a name and a tooltip, text is sentence case."
        ask="Would someone new know what this does before clicking it?"
        rules={["R7", "R10.1", "R15.1"]}
        doNote="The verb on the button; the icon button is named for screen readers and on hover."
        dontNote="OK to what? Shouting, an exclamation mark, and an icon with no name."
        good={<ClearDo />}
        bad={<ClearDont />}
      />
      <Principle
        id="P3"
        title="Hierarchy"
        statement="The most important thing reads first, by size, weight and position. One primary action per region, and it is the one that moves the task on."
        ask="Squint at it. Is the first thing you see the thing that matters?"
        rules={["R1.4", "R1.5", "R6.2", "R16.2"]}
        doNote="One destructive action, said as a verb, and a quiet way out."
        dontNote="Three equal shouts: the eye has nowhere to land, and the safe choice looks as loud as the dangerous one."
        good={
          <DialogSketch>
            <Button variant="ghost" size="sm">
              Keep them
            </Button>
            <Button variant="destructive" size="sm">
              Delete 4 layers
            </Button>
          </DialogSketch>
        }
        bad={
          <DialogSketch>
            <Button variant="brand" size="sm">
              Cancel
            </Button>
            <Button variant="brand" size="sm">
              Archive
            </Button>
            <Button variant="brand" size="sm">
              Delete
            </Button>
          </DialogSketch>
        }
      />
      <Principle
        id="P4"
        title="Deference"
        statement="The chrome steps back so the content leads. Selection is neutral, the accent marks only the primary action, focus and live progress, and nothing is coloured for decoration."
        ask="If this were removed, would anyone miss what it said?"
        rules={["R6.2", "R6.3", "R6.4"]}
        doNote="Selected is a neutral fill and full-strength text. The list is quiet until you need it."
        dontNote="An accent fill, a bar and a colour per icon: the nav outshouts the page it leads to."
        good={<ListDo />}
        bad={<ListDont />}
      />
      <Principle
        id="P5"
        title="Consistency"
        statement="One expression per idea across the family: on/off is a Switch, one of a few is a Segmented, one of many is a Select."
        ask="Is there already a component or a rule for this?"
        rules={["R5", "R7", "R11.1"]}
        doNote="The same idea, the same control, in every app."
        dontNote="A select for a yes/no and a checkbox for a choice of three: each one is learned again."
        good={<ControlsDo />}
        bad={<ControlsDont />}
      />
      <Principle
        id="P6"
        title="Responsive feedback"
        statement="Every action answers at once. Short work shows a busy state in place, long work shows progress, and a finished action says what happened and offers Undo."
        ask="After the click, how does the person know it worked?"
        rules={["R16.1", "R16.2", "R16.3", "R8"]}
        doNote="The button keeps its width and shows a spinner; a toast says what was saved and how to undo it."
        dontNote="The label becomes a sentence, the button grows, the layout jumps, and nothing says it worked."
        good={<SaveDo />}
        bad={<SaveDont />}
      />
      <Principle
        id="P7"
        title="Adaptable"
        statement="It works by keyboard alone, at every interface scale, in every theme and in high contrast. State is never colour alone."
        ask="Does it still work at 1024 px, at 150%, without a mouse, in light mode?"
        rules={["R2", "R15.1", "R15.2", "R15.4"]}
        doNote="Each status has a word and an icon, and the field is a real input with a name."
        dontNote="Colour is the only difference between healthy and degraded, and the 'field' is a div that keyboard and screen readers cannot reach."
        good={<StatusDo />}
        bad={<StatusDont />}
      />

      <div className="flex flex-col gap-3 rounded-2xl bg-card p-gutter ring-1 ring-border/60">
        <h2 className="text-lg font-semibold">Loading, in its shape</h2>
        <p className="max-w-prose text-body text-muted-foreground">R16 by duration: under 100 ms nothing, then a busy control, then progress or a skeleton in the content's shape, then a CallChip for long work.</p>
        <div className="grid gap-group sm:grid-cols-3">
          <Alert>
            <Icon name="info" />
            <AlertTitle>Under 1 s</AlertTitle>
            <AlertDescription>
              <span className="flex items-center gap-2">
                <Spinner /> The control's own busy state
              </span>
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2 rounded-xl p-4 ring-1 ring-border/60">
            <span className="text-ui text-muted-foreground">Up to 10 s, content</span>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-4 ring-1 ring-border/60">
            <span className="text-ui text-muted-foreground">Up to 10 s, countable</span>
            <Progress value={64} />
            <span className="text-ui tabular-nums">64%</span>
          </div>
        </div>
      </div>
    </Page>
  );
}
