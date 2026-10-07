// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The family's charts: line (with an optional comparison series), bars,
 * sparkline and heatmap. Plain SVG drawn from the theme tokens, so every one
 * re-tints with the theme and high-contrast mode with no extra wiring.
 *
 * The colour rule is the family's one-accent rule applied to data: the series
 * that matters is `--brand`; a comparison (last week, a baseline) is muted
 * and dashed; gridlines are the border hairline. A chart with five saturated
 * series has no headline. If you genuinely need categorical colours, use the
 * theme's ANSI roles (`var(--terminal-ansi-*)`) — they are generated per
 * theme against contrast floors — not a hand-picked palette.
 *
 * Charts draw once and do not animate on data updates: a live line that
 * tweens between samples is always showing values that never existed.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T>(null);
  const [w, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Rounds a max up to a 1/2/2.5/5 × 10ⁿ step so gridlines land on nice numbers. */
export function niceMax(max: number): number {
  if (!(max > 0)) return 1;
  const exp = Math.floor(Math.log10(max));
  const base = 10 ** exp;
  for (const m of [1, 2, 2.5, 5, 10]) if (m * base >= max) return m * base;
  return 10 * base;
}

function path(values: readonly number[], w: number, h: number, max: number, min = 0): string {
  if (values.length === 0) return "";
  const dx = values.length > 1 ? w / (values.length - 1) : 0;
  const span = max - min || 1;
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * dx).toFixed(2)},${(h - ((v - min) / span) * h).toFixed(2)}`)
    .join("");
}

type LineChartProps = {
  values: readonly number[];
  /** A second, muted, dashed series — last period, a baseline. */
  compare?: readonly number[];
  labels?: readonly string[];
  format?: (v: number) => string;
  height?: number;
  /** Fill under the main series. */
  area?: boolean;
  className?: string;
  label?: string;
};

export function LineChart({
  values,
  compare,
  labels,
  format = (v) => String(Math.round(v)),
  height = 180,
  area = true,
  className,
  label,
}: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);
  const gradId = React.useId().replace(/:/g, "");
  const padL = 40;
  const padB = labels ? 20 : 6;
  const padT = 8;
  const w = Math.max(0, width - padL - 4);
  const h = Math.max(0, height - padB - padT);
  const max = niceMax(Math.max(...values, ...(compare ?? []), 0));
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const n = values.length;
  const dx = n > 1 ? w / (n - 1) : 0;
  const yOf = (v: number) => padT + h - (v / max) * h;

  return (
    <div ref={ref} className={cn("relative w-full select-none", className)} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={label}
          onPointerMove={(e) => {
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left - padL;
            setHover(n > 1 ? Math.min(n - 1, Math.max(0, Math.round(x / dx))) : 0);
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={padL + w} y1={yOf(t)} y2={yOf(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={padL - 8} y={yOf(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                {format(t)}
              </text>
            </g>
          ))}
          <g transform={`translate(${padL},${padT})`}>
            {compare && (
              <path d={path(compare, w, h, max)} fill="none" stroke="var(--muted-foreground)" strokeOpacity={0.55} strokeWidth={1.25} strokeDasharray="3 4" />
            )}
            {area && n > 1 && <path d={`${path(values, w, h, max)}L${w},${h}L0,${h}Z`} fill={`url(#${gradId})`} />}
            <path d={path(values, w, h, max)} fill="none" stroke="var(--brand)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && (
              <g>
                <line x1={hover * dx} x2={hover * dx} y1={0} y2={h} stroke="var(--foreground)" strokeOpacity={0.25} />
                <circle cx={hover * dx} cy={h - (values[hover] / max) * h} r={3.5} fill="var(--background)" stroke="var(--brand)" strokeWidth={2} />
              </g>
            )}
          </g>
          {labels && (
            <g>
              {labels.map((l, i) =>
                i % Math.max(1, Math.ceil(labels.length / 6)) === 0 || i === labels.length - 1 ? (
                  <text
                    key={i}
                    x={padL + i * dx}
                    y={height - 4}
                    textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
                    className="fill-muted-foreground font-mono text-[10px]"
                  >
                    {l}
                  </text>
                ) : null,
              )}
            </g>
          )}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute top-1 rounded-lg bg-popover px-2 py-1 text-[11px] shadow-md ring-1 ring-foreground/10"
          style={{
            left: Math.min(width - 110, Math.max(0, padL + hover * dx + 8)),
          }}
        >
          {labels?.[hover] && <span className="mr-2 text-muted-foreground">{labels[hover]}</span>}
          <span className="font-mono font-medium text-foreground">{format(values[hover])}</span>
          {compare?.[hover] !== undefined && (
            <span className="ml-2 font-mono text-muted-foreground">{format(compare[hover])}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function BarChart({
  bars,
  highlight,
  height = 160,
  format = (v) => String(Math.round(v)),
  className,
  label,
}: {
  bars: readonly { label: string; value: number }[];
  /** Index of the bar drawn in the accent; the rest are muted. */
  highlight?: number | null;
  height?: number;
  format?: (v: number) => string;
  className?: string;
  label?: string;
}) {
  const max = niceMax(Math.max(...bars.map((b) => b.value), 0));
  return (
    <div role="img" aria-label={label} className={cn("flex w-full items-end gap-2", className)} style={{ height }}>
      {bars.map((b, i) => {
        const on = i === highlight;
        return (
          <div key={b.label} className="group/bar flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className={cn("font-mono text-[10px] tabular-nums", on ? "text-foreground" : "text-muted-foreground opacity-0 group-hover/bar:opacity-100")}>
              {format(b.value)}
            </span>
            <div
              className={cn("w-full rounded-t-md rounded-b-xs", on ? "bg-brand" : "bg-muted-foreground/25 group-hover/bar:bg-muted-foreground/40")}
              style={{ height: `${(b.value / max) * (height - 36)}px` }}
            />
            <span className={cn("truncate text-[11px]", on ? "text-foreground" : "text-muted-foreground")}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Sparkline({
  values,
  width = 96,
  height = 24,
  tone = "brand",
  className,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
  tone?: "brand" | "muted";
  className?: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  const d = path(values, width - pad * 2, height - pad * 2, max, min);
  const last = values[values.length - 1];
  const lx = width - pad;
  const ly = pad + (height - pad * 2) - ((last - min) / (max - min || 1)) * (height - pad * 2);
  const stroke = tone === "brand" ? "var(--brand)" : "var(--muted-foreground)";
  return (
    <svg width={width} height={height} aria-hidden className={cn("shrink-0 overflow-visible", className)}>
      <path d={d} transform={`translate(${pad},${pad})`} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2} fill={stroke} />
    </svg>
  );
}

export function Heatmap({
  rows,
  rowLabels,
  colLabels,
  cell = 14,
  className,
  label,
}: {
  /** Values 0..1, rows × columns. */
  rows: readonly (readonly number[])[];
  rowLabels?: readonly string[];
  colLabels?: readonly string[];
  cell?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div role="img" aria-label={label} className={cn("inline-grid w-fit gap-[3px]", className)} style={{ gridTemplateColumns: `auto repeat(${rows[0]?.length ?? 0}, ${cell}px)` }}>
      {colLabels && (
        <>
          <span />
          {colLabels.map((c, i) => (
            <span key={i} className="text-center font-mono text-[9px] text-muted-foreground">
              {c}
            </span>
          ))}
        </>
      )}
      {rows.map((r, ri) => (
        <React.Fragment key={ri}>
          <span className="pr-2 text-right text-[10px] leading-[14px] text-muted-foreground">{rowLabels?.[ri] ?? ""}</span>
          {r.map((v, ci) => (
            <span
              key={ci}
              title={`${rowLabels?.[ri] ?? ri} ${colLabels?.[ci] ?? ci}: ${Math.round(v * 100)}%`}
              className="rounded-[4px]"
              style={{
                width: cell,
                height: cell,
                background:
                  v <= 0.02
                    ? "color-mix(in oklab, var(--muted) 80%, transparent)"
                    : `color-mix(in oklab, var(--brand) ${Math.round(12 + Math.min(1, v) * 88)}%, var(--muted))`,
              }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
