// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Where you are in a multi-step flow. Done steps get a check and stay
 * clickable (going back is always allowed); the current step is the accent;
 * steps ahead are muted and only reachable through the flow's own Next.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";

export function Steps({
  steps,
  current,
  onSelect,
  className,
}: {
  steps: readonly string[];
  /** 0-based. */
  current: number;
  onSelect?: (index: number) => void;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center gap-2", className)}>
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <li aria-hidden className={cn("h-px w-6 flex-1 sm:w-10", i <= current ? "bg-brand/60" : "bg-border")} />
            )}
            <li className="flex items-center">
              <button
                type="button"
                disabled={state === "todo" || !onSelect}
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => onSelect?.(i)}
                className="group/step flex items-center gap-2 rounded-full pr-1 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default"
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-medium transition-colors",
                    state === "done" && "bg-brand/15 text-brand",
                    state === "current" && "bg-brand text-brand-foreground",
                    state === "todo" && "bg-muted text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Icon name="check" size="xs" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap",
                    state === "todo" ? "text-muted-foreground" : "text-foreground",
                    state === "current" && "font-medium",
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}
