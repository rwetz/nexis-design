// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Faceted filtering for catalogues, libraries and inventories, promoted from
 * Vitrine (SCAFFOLD-ISSUES 23, 24):
 *
 *   <FilterPanel facets={facets} value={filters} onChange={setFilters} />
 *   <ActiveFilters facets={facets} value={filters} onChange={setFilters} />
 *
 * A facet is either a list of options with counts (checkboxes) or a numeric
 * range (`RangeInput`, two fields that may each be empty: "no minimum" is a
 * real answer, which `NumberInput` cannot hold). The app derives the facets
 * and their counts from its data; the panel only draws them and reports the
 * new `FilterState`. `filterCount` and `EMPTY_FILTERS` help with the rest.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";

export type FacetOption = { value: string; label?: React.ReactNode; count?: number };

export type Facet =
  | { kind: "options"; key: string; label: string; options: readonly FacetOption[] }
  | { kind: "range"; key: string; label: string; unit?: string; placeholder?: [string, string] };

/** Range bounds are kept as typed text, so an empty field means "no bound". */
export type RangeValue = { min: string; max: string };

export type FilterState = {
  options: Record<string, readonly string[]>;
  ranges: Record<string, RangeValue>;
};

export const EMPTY_FILTERS: FilterState = { options: {}, ranges: {} };

/** How many filters are on. */
export function filterCount(state: FilterState): number {
  let n = 0;
  for (const v of Object.values(state.options)) n += v.length;
  for (const r of Object.values(state.ranges)) n += (r.min.trim() ? 1 : 0) + (r.max.trim() ? 1 : 0);
  return n;
}

/** A range's bounds as numbers, `null` for an empty or unreadable field. */
export function rangeBounds(r: RangeValue | undefined): { min: number | null; max: number | null } {
  const num = (s: string | undefined) => {
    const t = (s ?? "").trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  return { min: num(r?.min), max: num(r?.max) };
}

/** A minimum and a maximum, each optional. */
export function RangeInput({
  value,
  onChange,
  label,
  unit,
  placeholder = ["Min", "Max"],
  className,
}: {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  /** Names the fields for assistive tech: "Minimum price", "Maximum price". */
  label: string;
  /** Shown before each field, e.g. "$". */
  unit?: string;
  placeholder?: [string, string];
  className?: string;
}) {
  const field = (which: "min" | "max", hint: string) => (
    <label className="flex min-w-0 flex-1 items-center gap-1">
      {unit && <span className="text-ui text-muted-foreground">{unit}</span>}
      <Input
        value={value[which]}
        inputMode="decimal"
        placeholder={hint}
        aria-label={`${which === "min" ? "Minimum" : "Maximum"} ${label.toLowerCase()}`}
        className="h-8 tabular-nums"
        onChange={(e) => onChange({ ...value, [which]: e.target.value })}
      />
    </label>
  );
  return (
    <div data-slot="range-input" className={cn("flex items-center gap-2", className)}>
      {field("min", placeholder[0])}
      <span aria-hidden className="text-muted-foreground">
        –
      </span>
      {field("max", placeholder[1])}
    </div>
  );
}

export function FilterPanel({
  facets,
  value,
  onChange,
  defaultOpen,
  className,
}: {
  facets: readonly Facet[];
  value: FilterState;
  onChange: (value: FilterState) => void;
  /** Facet keys open at first. Defaults to the first three. */
  defaultOpen?: string[];
  className?: string;
}) {
  const toggle = (key: string, option: string, on: boolean) => {
    const cur = value.options[key] ?? [];
    onChange({ ...value, options: { ...value.options, [key]: on ? [...cur, option] : cur.filter((v) => v !== option) } });
  };
  const selected = (f: Facet) => {
    if (f.kind === "options") return (value.options[f.key] ?? []).length;
    const r = value.ranges[f.key];
    return r ? (r.min.trim() ? 1 : 0) + (r.max.trim() ? 1 : 0) : 0;
  };
  return (
    <aside aria-label="Filters" data-slot="filter-panel" className={className}>
      <Accordion type="multiple" defaultValue={defaultOpen ?? facets.slice(0, 3).map((f) => f.key)}>
        {facets.map((f) => (
          <AccordionItem key={f.key} value={f.key}>
            <AccordionTrigger meta={selected(f) || undefined}>{f.label}</AccordionTrigger>
            <AccordionContent>
              {f.kind === "range" ? (
                <RangeInput
                  label={f.label}
                  unit={f.unit}
                  placeholder={f.placeholder}
                  value={value.ranges[f.key] ?? { min: "", max: "" }}
                  onChange={(r) => onChange({ ...value, ranges: { ...value.ranges, [f.key]: r } })}
                />
              ) : (
                // Only a long list scrolls; a short one would show a needless
                // scrollbar for the checkboxes' enlarged hit areas.
                <div className={cn("flex flex-col gap-1", f.options.length > 8 && "max-h-56 overflow-y-auto py-1 nexis-scrollbar")}>
                  {f.options.map((o) => (
                    <label key={o.value} className="flex items-center gap-2 py-1 text-ui">
                      <Checkbox checked={(value.options[f.key] ?? []).includes(o.value)} onCheckedChange={(on) => toggle(f.key, o.value, on === true)} />
                      <span className="min-w-0 flex-1 truncate">{o.label ?? o.value}</span>
                      {o.count !== undefined && <span className="text-caption text-muted-foreground tabular-nums">{o.count}</span>}
                    </label>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}

/** One removable chip per filter that is on, and Clear all, so what narrows the results is always in view. */
export function ActiveFilters({
  facets,
  value,
  onChange,
  className,
}: {
  facets: readonly Facet[];
  value: FilterState;
  onChange: (value: FilterState) => void;
  className?: string;
}) {
  if (filterCount(value) === 0) return null;
  const chips: { id: string; label: string; clear: () => void }[] = [];
  for (const f of facets) {
    if (f.kind === "range") {
      const r = value.ranges[f.key];
      if (!r) continue;
      const unit = f.unit ?? "";
      if (r.min.trim()) chips.push({ id: `${f.key}:min`, label: `${f.label} from ${unit}${r.min.trim()}`, clear: () => onChange({ ...value, ranges: { ...value.ranges, [f.key]: { ...r, min: "" } } }) });
      if (r.max.trim()) chips.push({ id: `${f.key}:max`, label: `${f.label} up to ${unit}${r.max.trim()}`, clear: () => onChange({ ...value, ranges: { ...value.ranges, [f.key]: { ...r, max: "" } } }) });
    } else {
      const on = value.options[f.key] ?? [];
      for (const v of on) {
        chips.push({ id: `${f.key}:${v}`, label: v, clear: () => onChange({ ...value, options: { ...value.options, [f.key]: on.filter((x) => x !== v) } }) });
      }
    }
  }
  return (
    <div data-slot="active-filters" className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((c) => (
        <Button key={c.id} variant="secondary" size="xs" className="rounded-full" onClick={c.clear} aria-label={`Remove filter ${c.label}`}>
          {c.label} <Icon name="close" size="xs" />
        </Button>
      ))}
      <Button variant="ghost" size="xs" onClick={() => onChange(EMPTY_FILTERS)}>
        Clear all
      </Button>
    </div>
  );
}
