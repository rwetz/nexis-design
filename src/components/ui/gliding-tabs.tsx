// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A small tab strip whose selection travels.
 *
 * `useGlidingRail` is the rule for every nav in the app (see the icon-and-
 * motion vault note), but each strip that used it wired the same forty lines
 * by hand: measure, register, a `motion.span` pill, the hover reset. Sub-tabs
 * inside panels mostly didn't bother and painted their own background per
 * button, so the selection blinked from place to place while the strip above
 * it glided. This is the hook as a component, sized for those inner strips:
 * one pill that moves, the same spring, one line at the call site.
 *
 * `size="lg"` is a page's own tabs (a launcher item page's Overview,
 * Controls, Options): 36px tall to sit beside an `Input`, `text-sm`, with a
 * hover pill that follows the pointer. The small size is for strips inside
 * panels.
 */

import { RailIndicator } from "./rail-indicator";
import { Icon, type IconName } from "../../icon/icon";
import { useGlidingRail } from "./use-gliding-rail";
import { cn } from "../../lib/utils";

export type GlidingTab<Id extends string> = {
  id: Id;
  label: string;
  icon?: IconName;
};

export function GlidingTabs<Id extends string>({
  tabs,
  value,
  onChange,
  label,
  size = "sm",
  className,
}: {
  tabs: readonly GlidingTab<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  /** Accessible name for the tablist. */
  label: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const lg = size === "lg";
  const rail = useGlidingRail<Id>(value, "horizontal", tabs.length);
  return (
    <div
      ref={rail.containerRef}
      role="tablist"
      aria-label={label}
      data-size={size}
      className={cn("relative flex items-center", lg ? "gap-0.5" : "gap-1", className)}
      onPointerLeave={() => rail.setHoverId(null)}
    >
      {lg && <RailIndicator rail={rail} rect={rail.hoverRect} radius={10} className="inset-y-0 bg-muted/60" />}
      <RailIndicator
        rail={rail}
        rect={rail.activeRect}
        radius={lg ? 10 : 8}
        className={lg ? "inset-y-0 bg-muted" : "inset-y-0 bg-primary/15"}
      />
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            ref={(el) => rail.registerItem(t.id, el)}
            onClick={() => onChange(t.id)}
            onPointerEnter={() => rail.setHoverId(t.id)}
            className={cn(
              "relative z-10 flex shrink-0 items-center transition-colors",
              lg ? "h-9 gap-2 rounded-[10px] px-3.5 text-sm font-medium" : "gap-1 rounded-md px-1.5 py-0.5 text-caption",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selected ? (lg ? "text-foreground" : "text-primary") : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.icon && <Icon name={t.icon} size={lg ? "sm" : "xs"} active={selected} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
