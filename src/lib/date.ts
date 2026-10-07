// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A calendar date with no time and no zone — what a date picker actually
 * picks. `Date` carries a time and a zone, and every off-by-one-day bug in a
 * picker comes from one of the two leaking in (midnight UTC is yesterday in
 * California). Kept as three integers and converted only at the edges.
 */
export type CalendarDate = { year: number; month: number; day: number };

/** `month` is 1-12. */
export function date(year: number, month: number, day: number): CalendarDate {
  return { year, month, day };
}

export function today(now: Date = new Date()): CalendarDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(d: CalendarDate): number {
  return new Date(d.year, d.month - 1, d.day).getDay();
}

export function addDays(d: CalendarDate, n: number): CalendarDate {
  const js = new Date(d.year, d.month - 1, d.day + n);
  return today(js);
}

/** Clamps the day, so Jan 31 + 1 month is Feb 28/29, not Mar 3. */
export function addMonths(d: CalendarDate, n: number): CalendarDate {
  const index = d.year * 12 + (d.month - 1) + n;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) };
}

export function compare(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function sameDay(a: CalendarDate | null | undefined, b: CalendarDate | null | undefined): boolean {
  return !!a && !!b && compare(a, b) === 0;
}

export function inRange(d: CalendarDate, min?: CalendarDate | null, max?: CalendarDate | null): boolean {
  return (!min || compare(d, min) >= 0) && (!max || compare(d, max) <= 0);
}

export function iso(d: CalendarDate): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.year, 4)}-${p(d.month)}-${p(d.day)}`;
}

export function parseIso(s: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = { year: +m[1], month: +m[2], day: +m[3] };
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > daysInMonth(d.year, d.month)) return null;
  return d;
}

/**
 * The 6×7 grid a month view draws: always 42 cells, starting on
 * `weekStartsOn`, so the calendar never changes height between months.
 */
export function monthGrid(year: number, month: number, weekStartsOn = 0): CalendarDate[] {
  const first = { year, month, day: 1 };
  const lead = (weekday(first) - weekStartsOn + 7) % 7;
  const start = addDays(first, -lead);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
