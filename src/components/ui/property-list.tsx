// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Key/value facts about one thing — the body of an inspector or a details
 * drawer. A `<dl>`, so it reads as pairs to a screen reader. Keys are muted
 * and fixed-width so values align; `mono` sets a value in Geist Mono for ids,
 * hashes and paths.
 */

import type * as React from "react";
import { cn } from "../../lib/utils";

export type Property = { label: string; value: React.ReactNode; mono?: boolean };

export function PropertyList({ items, className }: { items: readonly Property[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] gap-x-6 text-[13px]", className)}>
      {items.map((p) => (
        <div key={p.label} className="contents">
          <dt className="border-b border-border/50 py-2 text-muted-foreground">{p.label}</dt>
          <dd className={cn("min-w-0 truncate border-b border-border/50 py-2 text-right", p.mono && "font-mono text-[12px]")}>
            {p.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
