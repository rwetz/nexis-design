// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A titled region of a screen — the frame every dashboard tile, inspector
 * section and side pane sits in.
 *
 * Exists so a region's title, its meta ("12 items", "last 24h") and its
 * actions sit in the same place in every app. Before it, each app built the
 * header row by hand and the three drifted: different heights, the meta on
 * the left in one app and the right in another, actions that jumped when the
 * title wrapped.
 *
 * The title is set in the display face (`font-heading`) — this is one of the
 * few places the family speaks in its own voice.
 */

import type * as React from "react";
import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";

type PanelProps = Omit<React.ComponentProps<"section">, "title"> & {
  title?: React.ReactNode;
  icon?: IconName;
  /** Quiet text after the title: a count, a range, a hint. */
  meta?: React.ReactNode;
  /** Controls on the right of the header. */
  actions?: React.ReactNode;
  /** Drop body padding — for tables, lists and charts that run edge to edge. */
  flush?: boolean;
  bodyClassName?: string;
};

export function Panel({
  title,
  icon,
  meta,
  actions,
  flush = false,
  className,
  bodyClassName,
  children,
  ...props
}: PanelProps) {
  const hasHeader = title !== undefined || actions !== undefined || meta !== undefined;
  return (
    <section
      data-slot="panel"
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/6 dark:ring-foreground/10",
        className,
      )}
      {...props}
    >
      {hasHeader && (
        <header
          data-slot="panel-header"
          className="flex h-10 shrink-0 items-center gap-2 border-b border-border/60 px-4"
        >
          {icon && <Icon name={icon} className="text-muted-foreground" />}
          {title !== undefined && (
            <h3 className="truncate font-heading text-[13px] font-medium tracking-tight">{title}</h3>
          )}
          {meta !== undefined && (
            <span className="truncate text-xs text-muted-foreground">{meta}</span>
          )}
          <span className="flex-1" />
          {actions}
        </header>
      )}
      <div
        data-slot="panel-body"
        className={cn("min-h-0 flex-1", flush ? "" : "p-4", bodyClassName)}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * A labelled hairline that splits a panel or a form into sections.
 * The label is optional; without one it is just the rule.
 */
export function SectionLabel({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-label"
      className={cn("flex items-center gap-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase", className)}
      {...props}
    >
      {children}
      <span aria-hidden className="h-px flex-1 bg-border/70" />
    </div>
  );
}
