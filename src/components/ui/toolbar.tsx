// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The row of controls along the top of a content area. Fixed height, so a
 * screen's content starts at the same y in every app; `ToolbarSpacer` pushes
 * what follows to the right; `ToolbarSeparator` is a short vertical hairline.
 *
 * Narrow windows: the toolbar is a size container named `toolbar`, so
 * secondary controls can step aside before they crowd the primary ones
 * (`className="@max-3xl/toolbar:hidden"`), and its children may shrink
 * (give a search field `min-w-0 shrink`). What hides must stay reachable,
 * usually from the command palette. It never wraps to a second row: the
 * height is part of the contract.
 */

import type * as React from "react";
import { cn } from "../../lib/utils";

export function Toolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      className={cn("@container/toolbar flex h-12 min-w-0 shrink-0 items-center gap-inline overflow-hidden border-b border-border/60 px-gutter", className)}
      {...props}
    />
  );
}

export function ToolbarSpacer() {
  return <span aria-hidden className="flex-1" />;
}

export function ToolbarSeparator() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}
