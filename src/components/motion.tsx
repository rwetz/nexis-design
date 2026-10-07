// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The family's motion moments, as components. Each is a thin wrapper over a
 * class in globals.css — the CSS is the system; these exist so a call site
 * reads as intent (`<SceneEnter>`) rather than as a class name, and so
 * replaying is a prop (`replayKey`) rather than a remount trick.
 *
 * They are *moments*, not decoration (docs/DESIGN_LANGUAGE.md §5): a scene
 * arriving once, a result landing once, a long run being visibly alive.
 * Buttons and menus keep the ordinary transition budget. Every one of these
 * is switched off by the shared `prefers-reduced-motion` rule.
 */

import type * as React from "react";
import { cn } from "../lib/utils";

type MomentProps = React.ComponentProps<"div"> & {
  /** Change to play the entrance again. */
  replayKey?: React.Key;
};

/** A data canvas or companion window arriving: rise + settle, 420ms. */
export function SceneEnter({ replayKey, className, ...props }: MomentProps) {
  return <div key={replayKey} className={cn("nexis-scene-enter", className)} {...props} />;
}

/** Children enter one after another, 70ms apart. For setup cards, not lists. */
export function Stagger({ replayKey, className, ...props }: MomentProps) {
  return <div key={replayKey} className={cn("nexis-stagger", className)} {...props} />;
}

/** A finished result landing — one accent flash, then rest. */
export function ResultArrival({ replayKey, className, ...props }: MomentProps) {
  return <div key={replayKey} className={cn("nexis-result-arrival", className)} {...props} />;
}

/** A long-running operation that is live: a slow accent scan around the edge. */
export function RunLive({ active = true, className, ...props }: React.ComponentProps<"div"> & { active?: boolean }) {
  return <div className={cn(active && "nexis-run-live", className)} {...props} />;
}

/**
 * The aurora: the accent traced around an element's edge while something is
 * streaming. On the default theme with the rainbow accent on, it is the full
 * spectrum. Give the wrapper the same radius as its content.
 */
export function AuroraBorder({ active = true, className, ...props }: React.ComponentProps<"div"> & { active?: boolean }) {
  return <div className={cn(active && "aurora-border", className)} {...props} />;
}

/** Caret-cadence blink for an inline live marker. */
export function Blink({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("nexis-blink", className)} {...props} />;
}
