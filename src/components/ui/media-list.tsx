// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A launcher library as a list (RULES R4.10): one row per item with its art,
 * title and a line under it, a few short columns, and a hover action.
 *
 * Rows are rounded and lift on hover: the art zooms a little, the row takes
 * a muted wash and the action (Play, Install) fades in at the end. The whole
 * row opens the item; the action does its own thing. Headers sort when the
 * column says it can. A status column is a `StatusDot` and its `toneText`
 * (R6), not a word in the body colour.
 *
 * A `DataTable` is for records you compare; this is for things you open.
 * From Stipple.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { ContentEnter } from "../motion";

export type MediaListColumn<T, K extends string = string> = {
  key: K;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** A value to sort by; leave it out and the column does not sort. */
  sortValue?: (row: T) => string | number;
  /** "end" for numbers and times. */
  align?: "start" | "end";
  /** The column's width: "8rem" (default). */
  width?: string;
  /**
   * Hide the column when the list itself is narrower than this (a container
   * query, so a filter rail or a sidebar beside it counts): md 42rem,
   * lg 56rem, xl 64rem.
   */
  hideBelow?: "md" | "lg" | "xl";
};

export type MediaListSort<K extends string = string> = { key: K; dir: "asc" | "desc" };

const HIDE = { md: "@max-2xl:hidden", lg: "@max-4xl:hidden", xl: "@max-5xl:hidden" } as const;

export function MediaList<T, K extends string = string>({
  rows,
  rowKey,
  label,
  art,
  title,
  subtitle,
  columns,
  action,
  onOpen,
  sort,
  onSort,
  className,
}: {
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** The list's accessible name. */
  label: string;
  /** A small picture: `CoverArt` with the item's landscape art. */
  art: (row: T) => React.ReactNode;
  title: (row: T) => React.ReactNode;
  /** One line under the title: a tagline, an author. */
  subtitle?: (row: T) => React.ReactNode;
  columns: readonly MediaListColumn<T, K>[];
  /** The row's own action, shown on hover and focus: a Play or Install button. */
  action?: (row: T) => React.ReactNode;
  onOpen: (row: T) => void;
  sort?: MediaListSort<K>;
  onSort?: (sort: MediaListSort<K>) => void;
  className?: string;
}) {
  const sorted = React.useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const v = col.sortValue;
    const out = [...rows].sort((a, b) => {
      const x = v(a), y = v(b);
      return typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    });
    return sort?.dir === "desc" ? out.reverse() : out;
  }, [rows, columns, sort]);

  // tailwind-merge drops `@container` next to `flex`: keep it outside cn()
  return (
    <div data-slot="media-list" role="table" aria-label={label} className={`@container ${cn("flex flex-col gap-1", className)}`}>
      <div role="row" className="flex items-center gap-group px-3 pb-1 text-caption text-muted-foreground">
        <span role="columnheader" className="min-w-0 flex-1 pl-[5.5rem]">
          Title
        </span>
        {columns.map((c) => {
          const on = sort?.key === c.key;
          const head = (
            <>
              {c.header}
              {on && <Icon name={sort!.dir === "asc" ? "chevron-up" : "chevron-down"} size="xs" />}
            </>
          );
          return (
            <span
              key={c.key}
              role="columnheader"
              aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
              className={cn("flex shrink-0", c.align === "end" && "justify-end", c.hideBelow && HIDE[c.hideBelow])}
              style={{ width: c.width ?? "8rem" }}
            >
              {c.sortValue && onSort ? (
                <button
                  type="button"
                  onClick={() => onSort({ key: c.key, dir: on && sort!.dir === "asc" ? "desc" : "asc" })}
                  className={cn(
                    "-mx-1 inline-flex items-center gap-1 rounded-md px-1 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                    on && "text-foreground",
                  )}
                >
                  {head}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1">{head}</span>
              )}
            </span>
          );
        })}
        {action && <span aria-hidden className="w-24 shrink-0" />}
      </div>

      <ContentEnter replayKey={sort ? `${sort.key}-${sort.dir}` : undefined} className="flex flex-col gap-1">
        {sorted.map((row) => (
          <div
            key={rowKey(row)}
            role="row"
            className="group/row relative flex h-16 items-center gap-group rounded-xl px-3 transition-[background-color,transform] duration-150 hover:bg-muted/60 has-[:focus-visible]:bg-muted/60 active:scale-[0.995]"
          >
            {/* the whole row opens the item; the action sits above this button */}
            <button
              type="button"
              aria-label={`Open ${typeof title(row) === "string" ? title(row) : rowKey(row)}`}
              onClick={() => onOpen(row)}
              className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <span role="cell" className="pointer-events-none relative flex min-w-0 flex-1 items-center gap-group">
              <span className="relative h-11 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/8">
                <span className="absolute inset-0 transition-transform duration-300 ease-out group-hover/row:scale-[1.06]">{art(row)}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{title(row)}</span>
                {subtitle && <span className="truncate text-ui text-muted-foreground">{subtitle(row)}</span>}
              </span>
            </span>
            {columns.map((c) => (
              <span
                key={c.key}
                role="cell"
                className={cn(
                  "pointer-events-none relative flex shrink-0 items-center truncate text-ui",
                  c.align === "end" && "justify-end tabular-nums",
                  c.hideBelow && HIDE[c.hideBelow],
                )}
                style={{ width: c.width ?? "8rem" }}
              >
                {c.cell(row)}
              </span>
            ))}
            {action && (
              <span
                role="cell"
                className="relative flex w-24 shrink-0 justify-end opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100"
              >
                {action(row)}
              </span>
            )}
          </div>
        ))}
      </ContentEnter>
    </div>
  );
}
