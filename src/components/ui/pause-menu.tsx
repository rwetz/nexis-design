// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A pause menu over a frozen view (RULES R4.10, R5): a short list (Resume,
 * Restart, pages such as Options and Controls, then exits set apart after a
 * gap) and a page beside the list for items that open one. It is the
 * running thing's own place for its options, so none of them sit in the
 * shell's chrome while it runs. Place it inside a `relative` view.
 *
 * Keys: Up and Down move (the highlight glides, R8.2), Enter picks, Esc
 * closes an open page and then resumes. Focus starts on the first item. It
 * handles its own Esc and stops it, so an app's window-level Esc (its pause
 * key) does not fire as well. From Stipple.
 */

import * as React from "react";
import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { SceneEnter } from "../motion";
import { Kbd } from "./kbd";
import { SectionLabel } from "./panel";
import { RailIndicator } from "./rail-indicator";
import { useGlidingRail } from "./use-gliding-rail";

export type PauseItem = {
  id: string;
  label: string;
  icon?: IconName;
  /** Opens a page beside the list instead of acting. */
  page?: React.ReactNode;
  /** A keycap on the right: "Esc", "R". */
  hint?: string;
  /** Leaves the running thing: set apart below a gap. */
  exit?: boolean;
  run?: () => void;
};

/** The next item for Up or Down, wrapping at the ends. */
export function pauseStep(items: readonly { id: string }[], current: string, dir: 1 | -1): string {
  if (items.length === 0) return current;
  const i = Math.max(0, items.findIndex((x) => x.id === current));
  return items[(i + dir + items.length) % items.length].id;
}

export function PauseMenu({
  title,
  subtitle,
  label = "Paused",
  items,
  onResume,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** The overline above the title. */
  label?: string;
  items: PauseItem[];
  onResume: () => void;
  className?: string;
}) {
  const [page, setPage] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState(items[0]?.id ?? "");
  const refs = React.useRef(new Map<string, HTMLButtonElement>());
  const rail = useGlidingRail<string>(page ?? focus, "vertical", items.length);
  const open = items.find((i) => i.id === page && i.page);
  const firstId = items[0]?.id ?? "";

  React.useEffect(() => {
    refs.current.get(firstId)?.focus({ preventScroll: true });
  }, [firstId]);

  const pick = (it: PauseItem) => {
    if (it.page) setPage((p) => (p === it.id ? null : it.id));
    else it.run?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (page) {
        refs.current.get(page)?.focus();
        setPage(null);
      } else onResume();
      return;
    }
    // inside a page, arrows belong to its controls
    if (!(e.target as HTMLElement).closest("[data-pause-list]") || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    refs.current.get(pauseStep(items, focus, e.key === "ArrowDown" ? 1 : -1))?.focus();
  };

  return (
    <div
      data-slot="pause-menu"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("absolute inset-0 z-20 flex items-stretch bg-background/60 backdrop-blur-md", className)}
    >
      <SceneEnter replayKey="pause" className="flex min-h-0 w-full items-stretch">
        <nav className="flex w-72 shrink-0 flex-col justify-center gap-group border-r border-border bg-background/70 p-page">
          <div className="flex flex-col gap-1">
            <SectionLabel>{label}</SectionLabel>
            <span className="text-2xl font-semibold">{title}</span>
            {subtitle && <span className="text-body text-muted-foreground">{subtitle}</span>}
          </div>
          <div ref={rail.setContainer} data-pause-list className="relative flex flex-col gap-0.5">
            {/* bg-muted was too close to the panel to see in dark mode */}
            <RailIndicator rail={rail} rect={rail.activeRect} radius={8} className="inset-x-0 rounded-lg bg-foreground/10" />
            {items.map((it, i) => (
              <React.Fragment key={it.id}>
                {it.exit && !items[i - 1]?.exit && <div className="h-3" aria-hidden />}
                <button
                  ref={(el) => {
                    if (el) refs.current.set(it.id, el);
                    else refs.current.delete(it.id);
                    rail.registerItem(it.id, el);
                  }}
                  type="button"
                  aria-expanded={it.page ? page === it.id : undefined}
                  onFocus={() => setFocus(it.id)}
                  onMouseEnter={() => refs.current.get(it.id)?.focus({ preventScroll: true })}
                  onClick={() => pick(it)}
                  className={cn(
                    "relative flex h-10 items-center gap-row rounded-lg px-3 text-left text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring/60",
                    (page ?? focus) === it.id ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {it.icon && <Icon name={it.icon} active={(page ?? focus) === it.id} />}
                  <span className="flex-1">{it.label}</span>
                  {it.page && <Icon name="chevron-right" size="sm" />}
                  {it.hint && <Kbd>{it.hint}</Kbd>}
                </button>
              </React.Fragment>
            ))}
          </div>
          <span className="text-caption text-muted-foreground">
            <Kbd>Esc</Kbd> {page ? "back" : "resume"}
          </span>
        </nav>
        {open && (
          <div className="flex min-w-0 flex-1 items-center overflow-auto p-page">
            <SceneEnter replayKey={open.id} className="w-full max-w-3xl">
              <div className="rounded-xl border border-border bg-card p-6 shadow-lg">{open.page}</div>
            </SceneEnter>
          </div>
        )}
      </SceneEnter>
    </div>
  );
}
