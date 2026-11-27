// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A picture with a designed fallback: when there is no file, or it fails to
 * load, the face is the item's icon and title on `bg-muted`, never a broken
 * image. A new `src` tries again. For `ProductCard media` and `MediaHero
 * art`. From Stipple, whose covers are rendered by each game (RULES R9.1).
 */

import * as React from "react";
import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";

export function CoverArt({
  src,
  title,
  icon = "image",
  className,
}: {
  src: string | null | undefined;
  /** Shown in the fallback; leave it out for a small thumbnail. */
  title?: React.ReactNode;
  icon?: IconName;
  className?: string;
}) {
  const [failed, setFailed] = React.useState<string | null>(null);
  if (!src || failed === src)
    return (
      <div data-slot="cover-art" className={cn("grid size-full place-items-center bg-muted text-muted-foreground", className)}>
        <span className="flex flex-col items-center gap-row px-gutter text-center">
          <Icon name={icon} size="xl" />
          {title && <span className="text-body font-medium text-foreground">{title}</span>}
        </span>
      </div>
    );
  return (
    <img
      data-slot="cover-art"
      src={src}
      alt=""
      draggable={false}
      decoding="async"
      onError={() => setFailed(src)}
      className={cn("size-full object-cover", className)}
    />
  );
}
