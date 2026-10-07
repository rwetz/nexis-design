// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A KPI tile: label, a big number, the change, and an optional trend.
 *
 * The delta is coloured by whether the change is *good*, not by its sign —
 * latency going up is bad, so `lowerIsBetter` flips it. Getting this wrong is
 * the most common dashboard bug there is: a green arrow on a regression.
 * The number is set in the display face; everything else stays quiet.
 */

import type * as React from "react";
import { Icon } from "../../icon/icon";
import { formatDelta } from "../../lib/format";
import { cn } from "../../lib/utils";
import { Sparkline } from "./chart";

export function deltaTone(delta: number, lowerIsBetter = false): "good" | "bad" | "flat" {
  if (Math.abs(delta) < 0.05) return "flat";
  const up = delta > 0;
  return up !== lowerIsBetter ? "good" : "bad";
}

export function Stat({
  label,
  value,
  delta,
  lowerIsBetter = false,
  trend,
  caption,
  className,
}: {
  label: string;
  value: React.ReactNode;
  /** Percent change, e.g. 4.2 for +4.2%. */
  delta?: number;
  lowerIsBetter?: boolean;
  trend?: readonly number[];
  caption?: React.ReactNode;
  className?: string;
}) {
  const tone = delta === undefined ? null : deltaTone(delta, lowerIsBetter);
  return (
    <div
      data-slot="stat"
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/6 dark:ring-foreground/10",
        className,
      )}
    >
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-heading text-[26px] leading-none font-medium tracking-tight tabular-nums">{value}</span>
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs tabular-nums",
                tone === "good" && "text-success",
                tone === "bad" && "text-destructive",
                tone === "flat" && "text-muted-foreground",
              )}
            >
              {tone !== "flat" && <Icon name={delta > 0 ? "trend-up" : "trend-down"} size="xs" />}
              {formatDelta(delta)}
              {caption && <span className="text-muted-foreground">{caption}</span>}
            </span>
          )}
        </div>
        {trend && trend.length > 1 && <Sparkline values={trend} width={84} height={28} />}
      </div>
    </div>
  );
}
