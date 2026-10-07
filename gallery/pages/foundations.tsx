import { cn } from "@nexis/design";
import { Demo, Grid, Page } from "../kit";

const SURFACES = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["popover", "bg-popover"],
  ["sidebar", "bg-sidebar"],
  ["muted", "bg-muted"],
  ["accent", "bg-accent"],
  ["secondary", "bg-secondary"],
  ["primary", "bg-primary"],
] as const;

const SIGNALS = [
  ["brand", "bg-brand", "the one accent"],
  ["destructive", "bg-destructive", "error · danger"],
  ["success", "bg-success", "ANSI green"],
  ["warning", "bg-warning", "ANSI yellow"],
  ["info", "bg-info", "ANSI blue"],
  ["ring", "bg-ring", "focus"],
] as const;

const MOTION = [
  ["--dur-tap", "90ms", "toggles, chevrons, hovers"],
  ["--dur-panel", "140ms", "popovers, tooltips, collapsibles"],
  ["--dur-window", "200ms", "dialogs, sheets"],
  ["--dur-scene", "420ms", "a data scene arriving"],
  ["--blink-cadence", "1060ms", "a VT100 caret — live indicators"],
  ["--tick-cadence", "640ms × 4 steps", "indeterminate progress"],
  ["--live-cadence", "1600ms", "a long run's slow scan"],
] as const;

const CURSORS = [
  ["default", "arrow"],
  ["pointer", "pointer"],
  ["text", "text"],
  ["crosshair", "crosshair"],
  ["grab", "grab"],
  ["grabbing", "grabbing"],
  ["move", "all_scroll"],
  ["not-allowed", "not_allowed"],
  ["col-resize", "col_resize"],
  ["row-resize", "row_resize"],
  ["nwse-resize", "nwse_resize"],
  ["zoom-in", "zoom_in"],
  ["help", "help"],
  ["wait", "wait"],
  ["copy", "copy"],
  ["alias", "alias"],
] as const;

export function FoundationsPage() {
  return (
    <Page
      title="Foundations"
      lede="Colour is OKLCH tokens with one source of truth; type is three faces with fixed jobs; motion is a small set of tokens every transition inherits; the cursor is a bespoke set. Everything on this page re-tints with the theme."
    >
      <Grid cols={2}>
        <Demo title="Surfaces" meta="depth is surface steps + a hairline, not shadows">
          <div className="grid grid-cols-4 gap-3">
            {SURFACES.map(([name, cls]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <span className={cn("h-14 rounded-xl ring-1 ring-border", cls)} />
                <span className="font-mono text-[11px] text-muted-foreground">--{name}</span>
              </div>
            ))}
          </div>
        </Demo>
        <Demo title="Signals" meta="state colours follow the theme's ANSI roles">
          <div className="grid grid-cols-3 gap-3">
            {SIGNALS.map(([name, cls, note]) => (
              <div key={name} className="flex items-center gap-3">
                <span className={cn("size-10 shrink-0 rounded-xl", cls)} />
                <span className="flex flex-col">
                  <span className="font-mono text-[11px]">--{name}</span>
                  <span className="text-[11px] text-muted-foreground">{note}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex h-6 overflow-hidden rounded-lg">
            {["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"].flatMap((c) => [
              <span key={c} className="flex-1" style={{ background: `var(--terminal-ansi-${c})` }} />,
            ])}
          </div>
          <div className="-mt-2 flex h-6 overflow-hidden rounded-lg">
            {["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"].map((c) => (
              <span key={c} className="flex-1" style={{ background: `var(--terminal-ansi-bright-${c})` }} />
            ))}
          </div>
        </Demo>
      </Grid>

      <Demo title="Type" meta="Geist · Geist Mono · Space Grotesk">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Display — font-heading</span>
            <span className="font-heading text-4xl font-medium tracking-tight">Nexis 1.31</span>
            <span className="font-heading text-xl font-medium">Panel titles, dialogs, empty states</span>
            <span className="text-xs text-muted-foreground">Space Grotesk. Only where the app speaks in its own voice; illegible below ~13px.</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Interface — font-sans</span>
            <span className="text-base">The quick brown fox jumps over the lazy dog.</span>
            <span className="text-sm">Body 14 · labels, menus, inputs</span>
            <span className="text-[13px]">Dense 13 · trees, tables, sidebars</span>
            <span className="text-xs text-muted-foreground">Meta 12 · hints, captions, the status bar at 11</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Code & figures — font-mono</span>
            <span className="font-mono text-sm">const p95 = 54; // ms</span>
            <span className="font-mono text-sm tabular-nums">0123456789 · 1,204.50</span>
            <span className="text-xs text-muted-foreground">Geist Mono. Same skeleton as Geist, so code and chrome agree. Tabular figures in every table.</span>
          </div>
        </div>
      </Demo>

      <Grid cols={2}>
        <Demo title="Radius" meta="one --radius, scaled">
          <div className="flex items-end gap-4">
            {["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-4xl", "rounded-full"].map((r) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <span className={cn("size-12 bg-muted ring-1 ring-border", r)} />
                <span className="font-mono text-[10px] text-muted-foreground">{r.replace("rounded-", "")}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Pills for controls (buttons, inputs, selects), 3xl for floating surfaces (menus, popovers), 2xl for panels and cards, 12px for the window itself.
          </p>
        </Demo>
        <Demo title="Motion tokens" meta="every bare transition-* inherits --dur-tap / --ease-enter">
          <table className="w-full text-[13px]">
            <tbody>
              {MOTION.map(([t, v, note]) => (
                <tr key={t} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 font-mono text-[12px]">{t}</td>
                  <td className="py-1.5 font-mono text-[12px] text-brand">{v}</td>
                  <td className="py-1.5 text-muted-foreground">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">
            Arrive on <span className="font-mono">--ease-enter</span> (decelerate hard), leave on <span className="font-mono">--ease-exit</span> (accelerate away, faster). Nothing overshoots — nothing in a tool should bounce.
          </p>
        </Demo>
      </Grid>

      <Demo title="Cursors" meta="the Tailless Smooth set — hover a tile">
        <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
          {CURSORS.map(([css, file]) => (
            <div
              key={css}
              className={cn("flex flex-col items-center gap-2 rounded-xl bg-muted/50 p-3 ring-1 ring-border/60", `cursor-${css}`)}
            >
              <img src={`./cursors/${file}.png`} alt="" className="size-8 rounded-md bg-white/90 p-0.5" />
              <span className="font-mono text-[10px] text-muted-foreground">{css}</span>
            </div>
          ))}
        </div>
      </Demo>
    </Page>
  );
}
