// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A month grid and the picker built on it.
 *
 * Dates are `CalendarDate` (lib/date.ts) — year/month/day with no time or
 * zone — because a `Date` carries both, and every off-by-one-day bug in a
 * picker is one of them leaking in.
 *
 * The grid is always six weeks, so paging months never changes the
 * component's height. Today is ringed; the selection is the accent. Arrow
 * keys move by a day, PageUp/PageDown by a month.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import {
  addDays,
  addMonths,
  type CalendarDate,
  compare,
  inRange,
  iso,
  MONTH_NAMES,
  monthGrid,
  sameDay,
  today as todayOf,
  WEEKDAY_SHORT,
} from "../../lib/date";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type CalendarRange = { start: CalendarDate; end: CalendarDate };

type CalendarProps = {
  range?: CalendarRange | { start: CalendarDate; end: null } | null;
  selected?: CalendarDate | null;
  onSelect?: (d: CalendarDate) => void;
  min?: CalendarDate | null;
  max?: CalendarDate | null;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /** Month to show first; defaults to the selection, then today. */
  defaultMonth?: CalendarDate;
  /** Fixed "today", for screenshots and tests. */
  today?: CalendarDate;
  className?: string;
};

export function Calendar({
  selected,
  range,
  onSelect,
  min,
  max,
  weekStartsOn = 0,
  defaultMonth,
  today,
  className,
}: CalendarProps) {
  const now = today ?? todayOf();
  const [view, setView] = React.useState<CalendarDate>(() => {
    const boundedToday = min && compare(now, min) < 0 ? min : max && compare(now, max) > 0 ? max : now;
    const d = defaultMonth ?? selected ?? range?.start ?? boundedToday;
    return { year: d.year, month: d.month, day: 1 };
  });
  const [focus, setFocus] = React.useState<CalendarDate>(selected ?? range?.start ?? now);
  const gridRef = React.useRef<HTMLDivElement>(null);

  const cells = monthGrid(view.year, view.month, weekStartsOn);
  const focusDay = cells.find((d) => sameDay(d, focus) && inRange(d, min, max))
    ?? cells.find((d) => d.month === view.month && inRange(d, min, max))
    ?? cells.find((d) => inRange(d, min, max));
  const monthLabel = `${MONTH_NAMES[view.month - 1]} ${view.year}`;
  const heads = Array.from({ length: 7 }, (_, i) => WEEKDAY_SHORT[(i + weekStartsOn) % 7]);

  const moveFocus = (d: CalendarDate) => {
    setFocus(d);
    if (d.year !== view.year || d.month !== view.month) setView({ year: d.year, month: d.month, day: 1 });
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso(d)}"]`)?.focus();
    });
  };

  return (
    <div data-slot="calendar" className={cn("w-[17rem] select-none", className)}>
      <div className="mb-2 flex items-center gap-1">
        <span className="flex-1 pl-1 text-sm font-medium">
          {MONTH_NAMES[view.month - 1]} <span className="text-muted-foreground">{view.year}</span>
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => setView(addMonths(view, -1))}>
          <Icon name="chevron-left" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => setView(addMonths(view, 1))}>
          <Icon name="chevron-right" />
        </Button>
      </div>
      <div role="grid" aria-label={monthLabel} aria-multiselectable={range ? true : undefined} ref={gridRef} className="flex flex-col gap-0.5 text-center text-ui">
        <div role="row" className="grid grid-cols-7 gap-0.5">
          {heads.map((h) => (
            <span key={h} role="columnheader" className="pb-1 text-caption text-muted-foreground">
              {h}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, week) => (
          <div key={week} role="row" className="grid grid-cols-7 gap-0.5">
            {cells.slice(week * 7, week * 7 + 7).map((d) => {
              const outside = d.month !== view.month;
              const disabled = !inRange(d, min, max);
              const isSel = sameDay(d, selected) || sameDay(d, range?.start) || sameDay(d, range?.end);
              const inside = !!range?.end && inRange(d, range.start, range.end);
              const isToday = sameDay(d, now);
              return (
                <div key={iso(d)} role="gridcell" aria-selected={isSel || inside}>
                  <button
                    type="button"
                    data-date={iso(d)}
                    aria-label={formatCalendarDate(d)}
                    aria-current={isToday ? "date" : undefined}
                    disabled={disabled}
                    tabIndex={sameDay(d, focusDay) ? 0 : -1}
                    onClick={() => {
                      setFocus(d);
                      onSelect?.(d);
                    }}
                    onKeyDown={(e) => {
                      const step: Record<string, CalendarDate> = {
                        ArrowLeft: addDays(d, -1),
                        ArrowRight: addDays(d, 1),
                        ArrowUp: addDays(d, -7),
                        ArrowDown: addDays(d, 7),
                        PageUp: addMonths(d, -1),
                        PageDown: addMonths(d, 1),
                      };
                      const next = step[e.key];
                      if (next) {
                        e.preventDefault();
                        const bounded = min && compare(next, min) < 0 ? min : max && compare(next, max) > 0 ? max : next;
                        if (inRange(bounded, min, max)) moveFocus(bounded);
                      }
                    }}
                    className={cn(
                      "grid h-8 w-full place-items-center rounded-full tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      outside ? "text-muted-foreground/45" : "text-foreground",
                      !isSel && !disabled && "hover:bg-muted",
                      isToday && !isSel && "ring-1 ring-foreground/40 ring-inset",
                      inside && !isSel && "bg-muted text-foreground",
                      isSel && "bg-foreground font-medium text-background",
                      disabled && "cursor-not-allowed opacity-35",
                    )}
                  >
                    {d.day}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const formatCalendarDate = (d: CalendarDate) => `${MONTH_NAMES[d.month - 1].slice(0, 3)} ${d.day}, ${d.year}`;

type DatePickerProps = Omit<CalendarProps, "className" | "range"> & {
  placeholder?: string;
  className?: string;
  format?: (d: CalendarDate) => string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function DatePicker({
  selected,
  onSelect,
  placeholder = "Pick a date",
  className,
  format = formatCalendarDate,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...calendar
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          variant="outline"
          className={cn("w-56 justify-start font-normal", !selected && "text-muted-foreground", className)}
        >
          <Icon name="calendar" />
          {selected ? format(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          {...calendar}
          selected={selected}
          onSelect={(d) => {
            onSelect?.(d);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

type DateRangePickerProps = Omit<DatePickerProps, "selected" | "onSelect"> & {
  value: CalendarRange | null;
  onChange: (range: CalendarRange) => void;
  label?: string;
};

export function DateRangePicker({
  value, onChange, label = "Date range", placeholder = "Pick a date range",
  className, format = formatCalendarDate, id,
  "aria-describedby": describedBy, "aria-invalid": invalid, ...calendar
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [start, setStart] = React.useState<CalendarDate | null>(null);
  const summary = value ? `${format(value.start)} – ${format(value.end)}` : placeholder;
  const changeOpen = (next: boolean) => {
    setStart(null);
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" aria-label={`${label}: ${summary}`}
          aria-describedby={describedBy} aria-invalid={invalid}
          className={cn("justify-start font-normal", !value && "text-muted-foreground", className)}>
          <Icon name="calendar" />
          {summary}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={label} className="w-auto p-3">
        <p aria-live="polite" className="mb-2 text-ui text-muted-foreground">
          {start ? `Start: ${format(start)}. Choose an end date.` : "Choose a start date."}
        </p>
        <Calendar
          {...calendar}
          range={start ? { start, end: null } : value}
          onSelect={(day) => {
            if (!start) {
              setStart(day);
              return;
            }
            onChange(compare(day, start) < 0 ? { start: day, end: start } : { start, end: day });
            changeOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
