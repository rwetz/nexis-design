// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A person: image if there is one, initials if not, and an optional presence
 * dot. Initials sit on a neutral surface — not a per-user hash colour — so a
 * list of people does not turn into confetti competing with the one accent.
 *
 * `size` is in px at 100% and drawn in rem, so avatars, their initials and
 * the presence dot grow with the interface scale (RULES R2.1).
 */

import type * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

/** px at 100% interface scale, as rem, so it scales with everything else. */
const rem = (px: number) => `${px / 16}rem`;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type Presence = "online" | "away" | "busy" | "offline";

const PRESENCE: Record<Presence, string> = {
  online: "bg-success",
  away: "bg-warning",
  busy: "bg-destructive",
  offline: "bg-muted-foreground/50",
};

export function Avatar({
  name,
  src,
  size = 32,
  presence,
  className,
  style,
}: {
  name: string;
  src?: string;
  size?: number;
  presence?: Presence;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span data-slot="avatar" className={cn("relative inline-flex shrink-0", className)} style={{ width: rem(size), height: rem(size), ...style }}>
      <AvatarPrimitive.Root className="inline-flex size-full overflow-hidden rounded-full bg-muted ring-1 ring-foreground/5">
        {src && <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />}
        <AvatarPrimitive.Fallback
          delayMs={src ? 300 : 0}
          className="grid size-full place-items-center font-medium tracking-tight text-muted-foreground select-none"
          style={{ fontSize: rem(Math.max(10, Math.round(size * 0.38))) }}
          aria-label={name}
        >
          {initials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {presence && (
        <span
          role="img"
          aria-label={presence}
          className={cn("absolute -right-px -bottom-px rounded-full ring-2 ring-background", PRESENCE[presence])}
          style={{ width: rem(Math.max(8, Math.round(size * 0.28))), height: rem(Math.max(8, Math.round(size * 0.28))) }}
        />
      )}
    </span>
  );
}

/**
 * Overlapping avatars with a "+N" for the rest. Each overlaps the one before
 * by a fifth of its width: enough to read as a group, little enough that both
 * initials of every avatar stay visible. Every circle, the "+N" included, is
 * positioned, so they stack in reading order and the "+N" is never covered.
 */
export function AvatarStack({ names, max = 4, size = 28, label }: { names: readonly string[]; max?: number; size?: number; label?: string }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  const overlap = rem(Math.round(size * 0.2));
  return (
    <span role="group" aria-label={label ?? `${names.length} people`} data-slot="avatar-stack" className="flex items-center">
      {shown.map((n, i) => (
        <Avatar key={n} name={n} size={size} className="rounded-full ring-2 ring-background" style={{ marginLeft: i ? `-${overlap}` : undefined }} />
      ))}
      {rest > 0 && (
        <span
          className="relative grid place-items-center rounded-full bg-muted font-medium text-muted-foreground tabular-nums ring-2 ring-background"
          style={{ width: rem(size), height: rem(size), marginLeft: `-${overlap}`, fontSize: rem(Math.max(10, Math.round(size * 0.36))) }}
          aria-label={`and ${rest} more`}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
