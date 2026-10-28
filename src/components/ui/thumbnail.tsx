/**
 * Thumbnail galleries (docs/RULES.md R4.5): a grid that shares the row
 * evenly, and the card that goes in it.
 *
 * The grid fills each row with columns at least `min` wide, but never more
 * than `maxColumns`, so a wide window gets bigger cards rather than twenty
 * small ones. Cards lift 2px on hover (R8.1); a selected card has a neutral
 * ring, never the accent (R6.3). Titles get two lines before truncating.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

export function ThumbnailGrid({
  min = "9rem",
  maxColumns = 6,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  /** The smallest a column may get. 9rem for cards, 6rem for swatches. */
  min?: string;
  /** The most columns a row may have, however wide the window. */
  maxColumns?: number;
}) {
  return (
    <div
      data-slot="thumbnail-grid"
      className={cn("grid gap-group", className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(max(${min}, calc((100% - ${maxColumns - 1} * var(--spacing-group)) / ${maxColumns})), 1fr))`,
        ...style,
      }}
      {...props}
    />
  );
}

export function ThumbnailCard({
  image,
  title,
  meta,
  selected = false,
  loading = false,
  placeholder,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "title"> & {
  /** The picture's URL; leave it out while it's being made. */
  image?: string | null;
  title: React.ReactNode;
  /** A second line: a category, a size, a date. */
  meta?: React.ReactNode;
  selected?: boolean;
  /** Shows a skeleton where the picture goes. */
  loading?: boolean;
  /** What to show with no picture and not loading, e.g. an icon. */
  placeholder?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-slot="thumbnail-card"
      aria-pressed={selected}
      className={cn("group/thumb flex min-w-0 flex-col gap-2 text-left outline-none", className)}
      {...props}
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl bg-muted ring-1 transition-[translate,box-shadow] group-hover/thumb:-translate-y-0.5 group-focus-visible/thumb:ring-2 group-focus-visible/thumb:ring-ring",
          selected ? "ring-2 ring-foreground/60" : "ring-foreground/8 group-hover/thumb:ring-foreground/25",
        )}
      >
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : loading ? (
          <Skeleton className="size-full rounded-none" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">{placeholder}</div>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className={cn("line-clamp-2 text-ui leading-tight", selected ? "font-medium text-foreground" : "text-muted-foreground group-hover/thumb:text-foreground")}>
          {title}
        </span>
        {meta && <span className="truncate text-caption text-muted-foreground">{meta}</span>}
      </div>
    </button>
  );
}
