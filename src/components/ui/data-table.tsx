// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A sortable, selectable table for the data an app actually shows: services,
 * processes, rows from a query.
 *
 * Header clicks cycle unsorted → ascending → descending (`nextSort`), and the
 * sort is stable with blanks last in either direction (`sortRows`). Numbers
 * right-align and set in tabular mono so columns of digits line up. The
 * selected row is the accent's quiet tint, never the accent itself — a table
 * full of strong colour is a table nobody can read.
 *
 * Sorting is controlled when you pass `sort`/`onSortChange`, so a server-side
 * table can take the state and do the work itself; otherwise it sorts the
 * rows in memory.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { nextSort, type SortState, sortRows } from "../../lib/sort";
import { cn } from "../../lib/utils";

export type Column<T, K extends string = string> = {
  key: K;
  header: React.ReactNode;
  /** Value used for sorting; defaults to `row[key]`. */
  value?: (row: T) => unknown;
  /** Cell content; defaults to the value as text. */
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  numeric?: boolean;
  sortable?: boolean;
  width?: number | string;
};

type DataTableProps<T, K extends string> = {
  columns: readonly Column<T, K>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  sort?: SortState<K>;
  onSortChange?: (sort: SortState<K>) => void;
  defaultSort?: SortState<K>;
  selected?: string | null;
  onSelect?: (key: string, row: T) => void;
  /** Compact = 28px rows (logs, processes); default = 36px. */
  density?: "compact" | "default";
  stickyHeader?: boolean;
  empty?: React.ReactNode;
  className?: string;
  label?: string;
};

export function DataTable<T, K extends string>({
  columns,
  rows,
  rowKey,
  sort: sortProp,
  onSortChange,
  defaultSort = null,
  selected,
  onSelect,
  density = "default",
  stickyHeader = true,
  empty,
  className,
  label,
}: DataTableProps<T, K>) {
  const [sortState, setSortState] = React.useState<SortState<K>>(defaultSort);
  const sort = sortProp !== undefined ? sortProp : sortState;
  const setSort = (s: SortState<K>) => {
    if (onSortChange) onSortChange(s);
    if (sortProp === undefined) setSortState(s);
  };

  const byKey = React.useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const sorted = React.useMemo(
    () =>
      onSortChange && sortProp !== undefined
        ? [...rows]
        : sortRows(rows, sort, (row, key) => {
            const col = byKey.get(key);
            return col?.value ? col.value(row) : (row as Record<string, unknown>)[key];
          }),
    [rows, sort, byKey, onSortChange, sortProp],
  );

  const rowH = density === "compact" ? "h-7" : "h-9";
  const align = (c: Column<T, K>) =>
    c.align === "right" || (c.numeric && c.align === undefined) ? "text-right" : c.align === "center" ? "text-center" : "text-left";

  return (
    <div className={cn("relative min-h-0 overflow-auto nexis-scrollbar", className)}>
      <table aria-label={label} className="w-full border-separate border-spacing-0 text-[13px]">
        <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-card/95 backdrop-blur-sm")}>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const ariaSort = active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortable ? "none" : undefined;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={ariaSort}
                  style={{ width: c.width }}
                  className={cn(
                    "h-9 border-b border-border px-3 text-xs font-medium whitespace-nowrap text-muted-foreground",
                    align(c),
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => setSort(nextSort(sort, c.key))}
                      className={cn(
                        "group/sort inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                        active && "text-foreground",
                        align(c) === "text-right" && "flex-row-reverse",
                      )}
                    >
                      {c.header}
                      <Icon
                        name={active && sort!.dir === "desc" ? "chevron-down" : "chevron-up"}
                        size="xs"
                        className={cn(active ? "text-brand" : "opacity-0 group-hover/sort:opacity-40")}
                      />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted-foreground">
                {empty ?? "Nothing to show"}
              </td>
            </tr>
          )}
          {sorted.map((row) => {
            const key = rowKey(row);
            const isSel = key === selected;
            return (
              <tr
                key={key}
                aria-selected={onSelect ? isSel : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onClick={onSelect ? () => onSelect(key, row) : undefined}
                onKeyDown={
                  onSelect
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(key, row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "outline-none focus-visible:bg-muted/70",
                  onSelect && "cursor-pointer",
                  isSel ? "bg-brand/10" : onSelect && "hover:bg-muted/50",
                )}
              >
                {columns.map((c, ci) => {
                  const v = c.value ? c.value(row) : (row as Record<string, unknown>)[c.key];
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        rowH,
                        "border-b border-border/50 px-3 whitespace-nowrap",
                        align(c),
                        c.numeric && "font-mono text-[12px] tabular-nums text-foreground/85",
                        isSel && ci === 0 && "shadow-[inset_2px_0_0_var(--brand)]",
                      )}
                    >
                      {c.cell ? c.cell(row) : v === null || v === undefined ? "" : String(v)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
