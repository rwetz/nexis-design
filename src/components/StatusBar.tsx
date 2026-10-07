// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The window's bottom edge: short facts about the app's state, left and
 * right. Facts, not controls — anything clickable here is a shortcut to
 * somewhere else (the branch opens source control), never the only way in.
 *
 * Values that change live (a counter, a clock, throughput) go in a
 * `StatusItem` with `live`, which sets them in tabular figures so the bar
 * does not jitter as digits change width — and never animates them.
 */

import type * as React from "react";
import { Icon, type IconName } from "../icon/icon";
import { cn } from "../lib/utils";

export function StatusBar({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      data-slot="status-bar"
      className={cn(
        "flex h-7 shrink-0 items-center gap-1 border-t border-border/60 bg-sidebar/60 px-2 text-[11px] text-muted-foreground select-none",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1">{left}</div>
      <span className="flex-1" />
      <div className="flex min-w-0 items-center gap-1">{right}</div>
    </footer>
  );
}

export function StatusItem({
  icon,
  children,
  live = false,
  onClick,
  title,
  className,
}: {
  icon?: IconName;
  children?: React.ReactNode;
  live?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  const body = (
    <>
      {icon && <Icon name={icon} size="xs" />}
      {children !== undefined && <span className={cn("truncate", live && "font-mono tabular-nums")}>{children}</span>}
    </>
  );
  const cls = cn("inline-flex h-5 items-center gap-1.5 rounded-md px-1.5", className);
  return onClick ? (
    <button type="button" title={title} onClick={onClick} className={cn(cls, "hover:bg-muted hover:text-foreground")}>
      {body}
    </button>
  ) : (
    <span title={title} className={cls}>
      {body}
    </span>
  );
}
