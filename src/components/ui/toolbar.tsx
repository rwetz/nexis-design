// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The row of controls along the top of a content area. Fixed height, so a
 * screen's content starts at the same y in every app; `ToolbarSpacer` pushes
 * what follows to the right; `ToolbarSeparator` is a short vertical hairline.
 */

import type * as React from "react";
import { cn } from "../../lib/utils";

export function Toolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      className={cn("flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4", className)}
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
