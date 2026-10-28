/**
 * A section of a side panel or inspector (docs/RULES.md R4.3): a 48px
 * header row with an overline title and icon actions on the gutter, then the
 * body on the same gutter. Every hand-built panel header drifted (h-9 here,
 * px-1.5 there, a different heading style each time); this is the one.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export function PanelSection({
  title,
  actions,
  children,
  className,
  bodyClassName,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  title: React.ReactNode;
  /** Icon buttons (`size="icon-sm"`) at the header's right. */
  actions?: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section data-slot="panel-section" aria-label={typeof title === "string" ? title : undefined} className={cn("flex flex-col", className)} {...props}>
      <header className="flex h-12 shrink-0 items-center gap-1 px-gutter">
        <h3 className="min-w-0 flex-1 truncate text-micro font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
        {actions}
      </header>
      <div className={cn("flex flex-col gap-row px-gutter pb-group", bodyClassName)}>{children}</div>
    </section>
  );
}
