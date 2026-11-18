// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The one big button on an item's page whose label is the item's state:
 * Install, Installing 42%, Play, Resume (Steam, Battle.net). It keeps its
 * width through every state, so the row beside it never jumps; the install
 * fills the button's own surface; the stage is named in a caption under it
 * that may run wider than the button. The caption slot is always there.
 * From Stipple.
 */

import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export type LaunchState =
  | { kind: "checking" }
  | { kind: "install"; what: string; estimate?: string }
  | { kind: "installing"; stage: string; frac: number | null }
  | { kind: "play" }
  | { kind: "resume" };

export type LaunchLabels = { play: string; install: string; resume: string };
const LABELS: LaunchLabels = { play: "Play", install: "Install", resume: "Resume" };

/** What the button says and shows for a state, the caption under it, and whether it is busy. */
export function launchFace(s: LaunchState, labels: LaunchLabels = LABELS): { label: string; icon: IconName; caption: string; busy: boolean; pct: number | null } {
  switch (s.kind) {
    case "checking":
      return { label: labels.play, icon: "play", caption: "", busy: true, pct: null };
    case "install":
      return { label: labels.install, icon: "download", caption: s.estimate ? `${s.what}, ${s.estimate}` : s.what, busy: false, pct: null };
    case "installing": {
      const pct = s.frac === null ? null : Math.round(Math.min(1, Math.max(0, s.frac)) * 100);
      return { label: pct === null ? "Installing" : `Installing ${pct}%`, icon: "download", caption: s.stage, busy: true, pct };
    }
    case "resume":
      return { label: labels.resume, icon: "play", caption: "", busy: false, pct: null };
    case "play":
      return { label: labels.play, icon: "play", caption: "", busy: false, pct: null };
  }
}

export function LaunchButton({
  state,
  onInstall,
  onPlay,
  labels,
  className,
}: {
  state: LaunchState;
  onInstall: () => void;
  /** Play and Resume. */
  onPlay: () => void;
  /** Other words for other things: "Open", "Get". */
  labels?: Partial<LaunchLabels>;
  className?: string;
}) {
  const face = launchFace(state, { ...LABELS, ...labels });
  return (
    <div data-slot="launch-button" className={cn("flex w-48 flex-col items-stretch gap-1", className)}>
      <Button variant="brand" size="lg" className="relative w-full overflow-hidden" disabled={face.busy} onClick={state.kind === "install" ? onInstall : onPlay}>
        {state.kind === "installing" && (
          // the fill is the progress: the button's own surface, so it reads as one control
          <span aria-hidden className="absolute inset-y-0 left-0 bg-background/25 transition-[width] duration-300" style={{ width: `${face.pct ?? 0}%` }} />
        )}
        <span className="relative flex items-center gap-inline">
          <Icon name={face.icon} /> {face.label}
        </span>
      </Button>
      <span className="h-4 w-96 max-w-[70vw] truncate text-caption text-muted-foreground" aria-live="polite">
        {face.caption}
      </span>
    </div>
  );
}
