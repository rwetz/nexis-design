// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Part-to-whole charts (RULES §18): `DonutChart` for one whole split into a
 * few parts, `ProportionBar` for the same split in a single line of space,
 * or several wholes compared one above the other.
 *
 * The one-accent rule holds: the part that matters (`highlight`) is
 * `--brand`, the rest step down a ramp of the foreground, and every part is
 * labelled with its name and share, so nothing depends on telling colours
 * apart. More than five parts fold the smallest into "Other": a sixth slice
 * is too thin to compare, and colour stops separating them.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export type Part = { label: string; value: number };

/** Largest first, at most `max` parts, the rest folded into one "Other". Zero and negative values are dropped. */
export function foldParts(parts: readonly Part[], max = 5, other = "Other"): Part[] {
  const sorted = parts.filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;
  const kept = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1).reduce((n, p) => n + p.value, 0);
  return [...kept, { label: other, value: rest }];
}

/** Shares that add up to exactly 100 when rounded (largest remainder), so a legend never reads 99% or 101%. */
export function roundedShares(values: readonly number[]): number[] {
  const total = values.reduce((n, v) => n + v, 0);
  if (!(total > 0)) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((n, v) => n + v, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

/** The accent for the highlighted part, then a ramp of the foreground for the rest. */
const RAMP = [70, 48, 32, 20, 12];
function tone(i: number, highlight: number | null | undefined, rank: number) {
  if (i === highlight) return "var(--brand)";
  return `color-mix(in oklab, var(--foreground) ${RAMP[Math.min(rank, RAMP.length - 1)]}%, transparent)`;
}
function tones(n: number, highlight: number | null | undefined) {
  let rank = 0;
  return Array.from({ length: n }, (_, i) => tone(i, highlight, i === highlight ? 0 : rank++));
}

function Legend({ parts, shares, colours, format, highlight }: { parts: Part[]; shares: number[]; colours: string[]; format: (v: number) => string; highlight?: number | null }) {
  return (
    <ul className="flex min-w-0 flex-col gap-1.5">
      {parts.map((p, i) => (
        <li key={p.label} className={cn("flex items-center gap-2 text-ui", i === highlight ? "text-foreground" : "text-muted-foreground")}>
          <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: colours[i] }} />
          <span className="min-w-0 flex-1 truncate">{p.label}</span>
          <span className="tabular-nums">{format(p.value)}</span>
          <span className="w-9 text-right tabular-nums">{shares[i]}%</span>
        </li>
      ))}
    </ul>
  );
}

export function DonutChart({
  parts,
  highlight,
  total,
  totalLabel = "Total",
  size = 140,
  format = (v) => String(Math.round(v)),
  max = 5,
  legend = true,
  label,
  className,
}: {
  parts: readonly Part[];
  /** Index (after folding, largest first) of the part drawn in the accent. */
  highlight?: number | null;
  /** The figure in the middle; defaults to the sum. */
  total?: React.ReactNode;
  totalLabel?: string;
  size?: number;
  format?: (v: number) => string;
  /** Parts shown before the rest fold into "Other". */
  max?: number;
  legend?: boolean;
  label: string;
  className?: string;
}) {
  const shown = foldParts(parts, max);
  const sum = shown.reduce((n, p) => n + p.value, 0);
  const shares = roundedShares(shown.map((p) => p.value));
  const colours = tones(shown.length, highlight);
  const r = 15.915; // circumference 100, so dash lengths are percentages
  const gap = shown.length > 1 ? 1.2 : 0;
  let at = 25; // start at twelve o'clock
  const arcs = shown.map((p, i) => {
    const len = sum > 0 ? (p.value / sum) * 100 : 0;
    const arc = { i, dash: `${Math.max(0, len - gap)} ${100 - Math.max(0, len - gap)}`, offset: at };
    at = (at - len + 100) % 100;
    return arc;
  });
  return (
    <div role="img" aria-label={`${label}: ${shown.map((p, i) => `${p.label} ${shares[i]}%`).join(", ")}`} className={cn("flex flex-wrap items-center gap-group", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" className="size-full" aria-hidden>
          <circle cx="21" cy="21" r={r} fill="none" stroke="var(--muted)" strokeWidth="5" />
          {arcs.map((a) => (
            <circle key={a.i} cx="21" cy="21" r={r} fill="none" stroke={colours[a.i]} strokeWidth="5" strokeDasharray={a.dash} strokeDashoffset={a.offset} />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-lg font-semibold tabular-nums">{total ?? format(sum)}</span>
          <span className="text-caption text-muted-foreground">{totalLabel}</span>
        </div>
      </div>
      {legend && (
        <div className="min-w-40 flex-1">
          <Legend parts={shown} shares={shares} colours={colours} format={format} highlight={highlight} />
        </div>
      )}
    </div>
  );
}

/** One whole as a single horizontal bar of parts: a donut in one line, or several wholes stacked to compare. */
export function ProportionBar({
  parts,
  highlight,
  format = (v) => String(Math.round(v)),
  max = 5,
  legend = true,
  label,
  className,
}: {
  parts: readonly Part[];
  highlight?: number | null;
  format?: (v: number) => string;
  max?: number;
  legend?: boolean;
  label: string;
  className?: string;
}) {
  const shown = foldParts(parts, max);
  const shares = roundedShares(shown.map((p) => p.value));
  const colours = tones(shown.length, highlight);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div role="img" aria-label={`${label}: ${shown.map((p, i) => `${p.label} ${shares[i]}%`).join(", ")}`} className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
        {shown.map((p, i) => (
          <span key={p.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ flexGrow: p.value, flexBasis: 0, background: colours[i] }} />
        ))}
      </div>
      {legend && <Legend parts={shown} shares={shares} colours={colours} format={format} highlight={highlight} />}
    </div>
  );
}
