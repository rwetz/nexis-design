// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Page buttons with ellipses. `pageWindow` decides which numbers show: always
 * the first and last, the current page and its neighbours, and an ellipsis
 * only where it hides two or more pages (an ellipsis standing in for one
 * page is just a worse button).
 */

import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Button } from "./button";

/** 1-based pages; `null` is an ellipsis. */
export function pageWindow(total: number, current: number, siblings = 1): (number | null)[] {
  if (total <= 0) return [];
  const want = new Set<number>([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= total) want.add(p);
  const pages = [...want].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      const gap = pages[i] - pages[i - 1];
      if (gap === 2) out.push(pages[i] - 1);
      else if (gap > 2) out.push(null);
    }
    out.push(pages[i]);
  }
  return out;
}

export function Pagination({
  total,
  page,
  onChange,
  className,
}: {
  total: number;
  /** 1-based. */
  page: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <Icon name="chevron-left" />
      </Button>
      {pageWindow(total, page).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="w-6 text-center text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "secondary" : "ghost"}
            size="icon-sm"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cn("font-mono text-xs tabular-nums", p === page && "text-foreground")}
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={page >= total} onClick={() => onChange(page + 1)}>
        <Icon name="chevron-right" />
      </Button>
    </nav>
  );
}
