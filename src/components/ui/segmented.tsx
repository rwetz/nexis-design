// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A mode switch: one of a few mutually exclusive views ("1H · 24H · 7D",
 * "Grid · List"). The selection is one pill that *travels* — `useGlidingRail`
 * plus `RailIndicator`, the family rule for every strip whose selection moves
 * (docs/DESIGN_LANGUAGE.md §5.3) — instead of each segment painting its own
 * background and the highlight blinking from place to place.
 *
 * `GlidingTabs` is the same idea sized for sub-tabs inside a panel; this is
 * the control-sized one for toolbars.
 */

import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { RailIndicator } from "./rail-indicator";
import { useGlidingRail } from "./use-gliding-rail";

export type Segment<Id extends string> = { id: Id; label?: string; icon?: IconName; title?: string };

export function Segmented<Id extends string>({
  segments,
  value,
  onChange,
  label,
  size = "default",
  equalWidth = false,
  className,
}: {
  segments: readonly Segment<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  /** Accessible name for the group. */
  label: string;
  size?: "default" | "sm";
  /** Use equal tracks for peer choices, sized by the longest label. */
  equalWidth?: boolean;
  className?: string;
}) {
  const rail = useGlidingRail<Id>(value, "horizontal", segments.length);
  const selected = Math.max(0, segments.findIndex((segment) => segment.id === value));
  return (
    <div
      ref={rail.containerRef}
      role="radiogroup"
      aria-label={label}
      style={equalWidth && segments.length ? { gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` } : undefined}
      className={cn(
        "relative items-center rounded-full bg-muted p-0.5",
        equalWidth ? "inline-grid" : "inline-flex",
        size === "sm" ? "h-7" : "h-8",
        className,
      )}
    >
      <RailIndicator
        rail={rail}
        rect={rail.activeRect}
        radius={999}
        className="inset-y-0.5 bg-background shadow-sm ring-1 ring-foreground/5 dark:bg-foreground/12"
      />
      {segments.map((s, index) => {
        const on = s.id === value;
        return (
          <button
            key={s.id}
            ref={(el) => rail.registerItem(s.id, el)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={index === selected ? 0 : -1}
            onKeyDown={(event) => {
              const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
              const step = event.key === "ArrowRight" ? (rtl ? -1 : 1)
                : event.key === "ArrowLeft" ? (rtl ? 1 : -1)
                : event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
              const target = event.key === "Home" ? 0 : event.key === "End" ? segments.length - 1
                : step ? (index + step + segments.length) % segments.length : null;
              if (target === null) return;
              event.preventDefault();
              event.currentTarget.parentElement?.querySelectorAll("button")[target]?.focus();
              onChange(segments[target].id);
            }}
            aria-label={s.label ? undefined : s.title}
            title={s.title}
            onClick={() => onChange(s.id)}
            className={cn(
              "relative z-10 inline-flex h-full min-w-0 items-center justify-center gap-1.5 rounded-full font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              size === "sm" ? "px-2.5 text-ui" : "px-3 text-body",
              on ? "text-foreground" : "text-foreground/80 hover:text-foreground",
            )}
          >
            {s.icon && <Icon name={s.icon} active={on} className="shrink-0" />}
            {s.label && <span className="truncate">{s.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
