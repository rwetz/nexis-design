// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A labelled level: CPU, memory, quota, a VU meter.
 *
 * Different from `Progress`, which is work moving toward done. A meter is a
 * reading that can go up or down, so it has thresholds instead of a goal —
 * the fill turns `warning` past `warnAt` and `destructive` past `dangerAt`.
 * It never animates its fill: a live reading that tweens is always showing a
 * value that is no longer true (docs/DESIGN_LANGUAGE.md §5, "live data never
 * animates").
 */

import { cn } from "../../lib/utils";

type MeterProps = {
  /** 0..1. Clamped. */
  value: number;
  label?: string;
  /** Text on the right; defaults to the percentage. Pass `null` to hide. */
  readout?: string | null;
  warnAt?: number;
  dangerAt?: number;
  className?: string;
};

export function meterTone(value: number, warnAt = 0.75, dangerAt = 0.9): "normal" | "warn" | "danger" {
  if (value >= dangerAt) return "danger";
  if (value >= warnAt) return "warn";
  return "normal";
}

export function Meter({ value, label, readout, warnAt = 0.75, dangerAt = 0.9, className }: MeterProps) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const tone = meterTone(v, warnAt, dangerAt);
  const text = readout === undefined ? `${Math.round(v * 100)}%` : readout;
  return (
    <div
      data-slot="meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn("grid grid-cols-[minmax(0,auto)_1fr_auto] items-center gap-3 text-xs", className)}
    >
      {label !== undefined ? (
        <span className="w-12 truncate text-muted-foreground">{label}</span>
      ) : (
        <span />
      )}
      <span className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            tone === "danger" ? "bg-destructive" : tone === "warn" ? "bg-warning" : "bg-brand",
          )}
          style={{ width: `${v * 100}%` }}
        />
      </span>
      {text !== null ? (
        <span className="w-10 text-right font-mono tabular-nums text-foreground/80">{text}</span>
      ) : (
        <span />
      )}
    </div>
  );
}
