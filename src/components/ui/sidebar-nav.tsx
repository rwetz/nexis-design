// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * An app's primary navigation: a brand row, grouped items with optional
 * counts, and a footer.
 *
 * The selection is a single highlight that glides between items
 * (`useGlidingRail`, vertical) with a short accent bar on its leading edge —
 * the same rail Nexis's Settings nav uses. `collapsed` shrinks it to an icon
 * rail; labels move into tooltips.
 */

import * as React from "react";
import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { RailIndicator } from "./rail-indicator";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { useGlidingRail } from "./use-gliding-rail";

export type SidebarNavItem<Id extends string = string> = {
  id: Id;
  label: string;
  icon: IconName;
  /** A count or short status on the right. */
  meta?: React.ReactNode;
};

export type SidebarNavSection<Id extends string = string> = {
  title?: string;
  items: readonly SidebarNavItem<Id>[];
};

export function SidebarNav<Id extends string>({
  sections,
  value,
  onChange,
  brand,
  footer,
  collapsed = false,
  label = "Main",
  className,
}: {
  sections: readonly SidebarNavSection<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  brand?: React.ReactNode;
  footer?: React.ReactNode;
  collapsed?: boolean;
  label?: string;
  className?: string;
}) {
  const count = sections.reduce((n, s) => n + s.items.length, 0);
  const rail = useGlidingRail<Id>(value, "vertical", collapsed ? -count : count); // revision: re-measure on collapse too

  return (
    <nav
      aria-label={label}
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        collapsed ? "w-14" : "w-56",
        className,
      )}
    >
      {brand && <div className={cn("flex h-11 shrink-0 items-center gap-2", collapsed ? "justify-center" : "px-4")}>{brand}</div>}
      <div
        ref={rail.containerRef}
        className="relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2"
        onPointerLeave={() => rail.setHoverId(null)}
      >
        <RailIndicator rail={rail} rect={rail.hoverRect} radius={10} className="inset-x-2 bg-sidebar-accent/70" />
        <RailIndicator rail={rail} rect={rail.activeRect} radius={10} className="inset-x-2 bg-sidebar-accent" />
        <RailIndicator rail={rail} rect={rail.activeRect} radius={2} className="left-2 w-[3px] bg-brand" />
        {sections.map((section, si) => (
          <React.Fragment key={section.title ?? si}>
            {section.title && !collapsed && (
              <div className="relative z-10 px-2.5 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase first:pt-1">
                {section.title}
              </div>
            )}
            {section.title && collapsed && si > 0 && <div className="mx-2 my-2 h-px bg-sidebar-border" />}
            {section.items.map((item) => {
              const on = item.id === value;
              const button = (
                <button
                  key={item.id}
                  ref={(el) => rail.registerItem(item.id, el)}
                  type="button"
                  aria-current={on ? "page" : undefined}
                  onClick={() => onChange(item.id)}
                  onPointerEnter={() => rail.setHoverId(item.id)}
                  className={cn(
                    "relative z-10 flex h-8 shrink-0 items-center gap-2.5 rounded-[10px] text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    collapsed ? "justify-center px-0" : "px-2.5",
                    on ? "font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon name={item.icon} size="md" active={on} />
                  {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                  {!collapsed && item.meta !== undefined && (
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{item.meta}</span>
                  )}
                </button>
              );
              if (!collapsed) return button;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {footer && <div className="shrink-0 border-t border-sidebar-border p-2">{footer}</div>}
    </nav>
  );
}
