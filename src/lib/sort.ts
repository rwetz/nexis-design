// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

export type SortDir = "asc" | "desc";
export type SortState<K extends string = string> = { key: K; dir: SortDir } | null;

/**
 * The click cycle every sortable column header uses: unsorted → ascending →
 * descending → unsorted. A third state matters: without it the only way back
 * to the data's natural order is a reload.
 */
export function nextSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  if (!current || current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  return null;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/**
 * Compares the way a person reads a column: numbers numerically, strings
 * with natural ordering ("file2" before "file10"), nullish values last in
 * both directions.
 */
export function compareValues(a: unknown, b: unknown): number {
  const an = a === null || a === undefined || a === "";
  const bn = b === null || b === undefined || b === "";
  if (an || bn) return an === bn ? 0 : an ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return collator.compare(String(a), String(b));
}

/** Stable sort of `rows` by `sort`; returns the input order when unsorted. */
export function sortRows<T, K extends string>(
  rows: readonly T[],
  sort: SortState<K>,
  value: (row: T, key: K) => unknown,
): T[] {
  if (!sort) return [...rows];
  const sign = sort.dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i }))
    .sort((x, y) => {
      const a = value(x.row, sort.key);
      const b = value(y.row, sort.key);
      const aNull = a === null || a === undefined || a === "";
      const bNull = b === null || b === undefined || b === "";
      // Nullish last regardless of direction — flipping the sign would
      // otherwise bring every blank to the top on descending.
      if (aNull || bNull) return aNull === bNull ? x.i - y.i : aNull ? 1 : -1;
      return sign * compareValues(a, b) || x.i - y.i;
    })
    .map((x) => x.row);
}
