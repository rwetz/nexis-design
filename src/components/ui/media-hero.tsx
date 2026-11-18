// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A wide picture with an eyebrow, a title, badges, a line, an action row and
 * facts laid over its lower left (RULES R4.10). The scrims are the
 * `background` token, so text reads on any art in any theme; their stops
 * keep the top half of the picture clean in light mode, where a heavier
 * scrim washed the art out. Badges on the art are `CardBadge` (solid),
 * never a tinted `Badge`, which vanished on light art.
 *
 * `variant="feature"` is an inset rounded banner (a library's "continue"
 * hero); `"page"` runs edge to edge at the top of an item's page. From
 * Stipple.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export function MediaHero({
  art,
  eyebrow,
  title,
  badges,
  description,
  actions,
  meta,
  variant = "feature",
  className,
}: {
  /** The picture, filling the hero: a `CoverArt`, an `img`, a live render. */
  art: React.ReactNode;
  /** A short line above the title, sentence case: "Continue playing". */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** `CardBadge`s beside the title. */
  badges?: React.ReactNode;
  description?: React.ReactNode;
  /** The launch row: one brand button (a `LaunchButton`), then quiet ones. */
  actions?: React.ReactNode;
  /** `HeroFact`s right of the actions: last used, time spent. */
  meta?: React.ReactNode;
  variant?: "feature" | "page";
  className?: string;
}) {
  return (
    <section
      data-slot="media-hero"
      className={cn(
        "relative isolate flex w-full flex-col justify-end overflow-hidden",
        variant === "feature" ? "min-h-72 rounded-2xl ring-1 ring-foreground/8 lg:min-h-80" : "min-h-80 lg:min-h-96",
        className,
      )}
    >
      <div className="absolute inset-0 -z-10">{art}</div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/55 via-30% to-transparent to-75%" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-background/70 via-background/10 via-40% to-transparent to-70%" />
      <div className={cn("flex max-w-3xl flex-col gap-row", variant === "feature" ? "p-6" : "px-page pt-24 pb-6")}>
        {eyebrow && <span className="text-ui font-medium text-muted-foreground">{eyebrow}</span>}
        <div className="flex flex-wrap items-center gap-row">
          <h1 className="text-display font-semibold">{title}</h1>
          {badges}
        </div>
        {description && <p className="max-w-xl text-sm text-muted-foreground">{description}</p>}
        {(actions || meta) && (
          <div className="mt-1 flex flex-wrap items-start gap-x-group gap-y-row">
            {actions && <div className="flex items-start gap-inline">{actions}</div>}
            {meta && <div className="flex items-center gap-group pt-1.5">{meta}</div>}
          </div>
        )}
      </div>
    </section>
  );
}

/** A label over a value, for a hero's meta: "Last played / Today". */
export function HeroFact({ label, value, className }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <span data-slot="hero-fact" className={cn("flex flex-col", className)}>
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-body font-medium tabular-nums">{value}</span>
    </span>
  );
}
