// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Ten thousand rows at the cost of thirty. `@tanstack/react-virtual` does the
 * windowing; this fixes the two things every hand-wired use of it gets
 * wrong: rows are full-width (so a click past the end of the text still
 * lands), and `follow` keeps the view pinned to the bottom while new rows
 * arrive *only if* it was already at the bottom — scrolling up to read
 * releases it, the way every terminal behaves.
 */

import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";
import { cn } from "../../lib/utils";

type VirtualListProps = {
  count: number;
  /** Fixed row height in px. */
  rowHeight?: number;
  renderRow: (index: number) => React.ReactNode;
  /** Stick to the bottom as rows are appended (logs, consoles). */
  follow?: boolean;
  overscan?: number;
  className?: string;
  label?: string;
};

export function VirtualList({
  count,
  rowHeight = 28,
  renderRow,
  follow = false,
  overscan = 12,
  className,
  label,
}: VirtualListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const pinned = React.useRef(true);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  React.useLayoutEffect(() => {
    if (follow && pinned.current && count > 0) virtualizer.scrollToIndex(count - 1, { align: "end" });
  }, [count, follow, virtualizer]);

  return (
    <div
      ref={parentRef}
      role="list"
      aria-label={label}
      onScroll={(e) => {
        const el = e.currentTarget;
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < rowHeight * 1.5;
      }}
      className={cn("relative min-h-0 overflow-auto nexis-scrollbar", className)}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            role="listitem"
            className="absolute left-0 w-full"
            style={{ top: 0, height: item.size, transform: `translateY(${item.start}px)` }}
          >
            {renderRow(item.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
