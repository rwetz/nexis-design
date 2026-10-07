// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Things that happened, in order: deploys, incidents, a run's stages.
 * Times sit in a fixed-width mono column so they align; each event's dot
 * takes its tone; `live` on the newest event blinks it at caret cadence.
 */

import type * as React from "react";
import { cn } from "../../lib/utils";
import { StatusDot, type Tone } from "./status-dot";

export type TimelineEvent = {
  id: string;
  time: string;
  title: React.ReactNode;
  detail?: React.ReactNode;
  tone?: Tone;
  live?: boolean;
};

export function Timeline({ events, className }: { events: readonly TimelineEvent[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {events.map((e, i) => (
        <li key={e.id} className="grid grid-cols-[3.5rem_1rem_minmax(0,1fr)] gap-x-2">
          <span className="pt-0.5 text-right font-mono text-[11px] text-muted-foreground tabular-nums">{e.time}</span>
          <span className="relative flex justify-center">
            <StatusDot tone={e.tone ?? "neutral"} live={e.live} className="mt-1.5" />
            {i < events.length - 1 && <span aria-hidden className="absolute top-4 bottom-0 w-px bg-border" />}
          </span>
          <div className="flex min-w-0 flex-col pb-4">
            <span className="truncate text-[13px] text-foreground">{e.title}</span>
            {e.detail && <span className="truncate text-xs text-muted-foreground">{e.detail}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
