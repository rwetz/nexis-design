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

import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";
import { Icon } from "../../icon/icon";
import { nextSort, type SortState, sortRows } from "../../lib/sort";
import { cn } from "../../lib/utils";
import { Checkbox } from "./checkbox";

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
  /** Controlled checkbox selection. Selected keys outside the current rows are preserved. */
  selection?: ReadonlySet<string>;
  onSelectionChange?: (selection: Set<string>) => void;
  /** Requires a bounded scroll height. Cells stay on one line. */
  virtual?: { rowHeight?: number; overscan?: number };
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
  selection,
  onSelectionChange,
  virtual,
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

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLTableSectionElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(36);
  const virtualized = !!virtual;
  React.useLayoutEffect(() => {
    const header = headerRef.current;
    if (!virtualized || !header) return;
    const measure = () => {
      if (header.offsetHeight > 0) setHeaderHeight(header.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [virtualized]);

  const rowHeight = virtual?.rowHeight ?? headerHeight * (density === "compact" ? 28 / 36 : 1);
  const getItemKey = React.useCallback((index: number) => rowKey(sorted[index]), [rowKey, sorted]);
  const virtualizer = useVirtualizer({
    count: sorted.length,
    enabled: virtualized,
    getScrollElement: () => scrollRef.current,
    getItemKey,
    estimateSize: () => rowHeight,
    overscan: virtual?.overscan ?? 8,
    scrollMargin: headerHeight,
  });
  React.useLayoutEffect(() => {
    if (virtualized) virtualizer.measure();
  }, [rowHeight, virtualized, virtualizer]);
  const items = virtualizer.getVirtualItems();
  const first = items[0];
  const last = items.at(-1);
  const rendered = virtual ? items.map(({ index }) => sorted[index]) : sorted;
  const colSpan = columns.length + (selection ? 1 : 0);
  const selectedCount = React.useMemo(
    () => selection ? sorted.reduce((count, row) => count + Number(selection.has(rowKey(row))), 0) : 0,
    [rowKey, selection, sorted],
  );
  const allSelected = selectedCount > 0 && selectedCount === sorted.length;
  const changeSelection = (keys: Iterable<string>, checked: boolean) => {
    const next = new Set(selection);
    for (const key of keys) {
      if (checked) next.add(key);
      else next.delete(key);
    }
    onSelectionChange?.(next);
  };
  const spacer = (height: number) => height > 0 && (
    <tr aria-hidden="true"><td colSpan={colSpan} style={{ height, padding: 0 }} /></tr>
  );

  const rowH = density === "compact" ? "h-7" : "h-9";
  const align = (c: Column<T, K>) =>
    c.align === "right" || (c.numeric && c.align === undefined) ? "text-right" : c.align === "center" ? "text-center" : "text-left";

  return (
    <div ref={scrollRef} className={cn("relative min-h-0 overflow-auto nexis-scrollbar", className)}>
      <table
        aria-label={label}
        aria-rowcount={virtual ? Math.max(1, sorted.length) + 1 : undefined}
        className={cn("w-full border-separate border-spacing-0 text-body", virtual && "table-fixed")}
      >
        <thead ref={headerRef} className={cn(stickyHeader && "sticky top-0 z-10 bg-card/95 backdrop-blur-sm")}>
          <tr aria-rowindex={virtual ? 1 : undefined}>
            {selection && (
              <th scope="col" className="w-10 border-b border-border px-3">
                <Checkbox
                  aria-label="Select all rows"
                  checked={allSelected || (selectedCount > 0 ? "indeterminate" : false)}
                  disabled={!sorted.length || !onSelectionChange}
                  onCheckedChange={(checked) => changeSelection(sorted.map((row) => rowKey(row)), checked === true)}
                />
              </th>
            )}
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
                    "h-9 border-b border-border px-3 text-ui font-medium whitespace-nowrap text-muted-foreground",
                    align(c),
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => setSort(nextSort(sort, c.key))}
                      className={cn(
                        "group/sort inline-flex min-h-6 items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                        active && "text-foreground",
                        align(c) === "text-right" && "flex-row-reverse",
                      )}
                    >
                      {c.header}
                      <Icon
                        name={active && sort!.dir === "desc" ? "chevron-down" : "chevron-up"}
                        size="xs"
                        className={cn(active ? "text-foreground" : "opacity-0 group-hover/sort:opacity-40")}
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
            <tr aria-rowindex={virtual ? 2 : undefined}>
              <td colSpan={colSpan} className="px-3 py-10 text-center text-sm text-muted-foreground">
                {empty ?? "Nothing to show"}
              </td>
            </tr>
          )}
          {virtual && first && spacer(first.start - headerHeight)}
          {rendered.map((row, i) => {
            const key = rowKey(row);
            const isSel = selection ? selection.has(key) : key === selected;
            return (
              <tr
                key={key}
                aria-rowindex={virtual ? items[i].index + 2 : undefined}
                aria-selected={onSelect && !selection ? isSel : undefined}
                style={virtual ? { height: rowHeight } : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onClick={onSelect ? () => onSelect(key, row) : undefined}
                onKeyDown={
                  onSelect
                    ? (e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onSelect(key, row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "outline-none focus-visible:bg-muted/70",
                  onSelect && "cursor-pointer",
                  isSel ? "bg-muted" : onSelect && "hover:bg-muted/50",
                )}
              >
                {selection && (
                  <td className="border-b border-border/50 px-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label={`Select row ${key}`}
                      checked={isSel}
                      disabled={!onSelectionChange}
                      onCheckedChange={(checked) => changeSelection([key], checked === true)}
                    />
                  </td>
                )}
                {columns.map((c) => {
                  const v = c.value ? c.value(row) : (row as Record<string, unknown>)[c.key];
                  const content = c.cell ? c.cell(row) : v === null || v === undefined ? "" : String(v);
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        !virtual && rowH,
                        "border-b border-border/50 px-3 whitespace-nowrap",
                        align(c),
                        c.numeric && "text-ui tabular-nums text-foreground/85",
                      )}
                    >
                      {virtual ? <div className="overflow-hidden text-ellipsis" style={{ maxHeight: rowHeight - 1 }}>{content}</div> : content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {virtual && last && spacer(virtualizer.getTotalSize() + headerHeight - last.end)}
        </tbody>
      </table>
    </div>
  );
}
