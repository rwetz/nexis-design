// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A person: image if there is one, initials if not, and an optional presence
 * dot. Initials sit on a neutral surface — not a per-user hash colour — so a
 * list of people does not turn into confetti competing with the one accent.
 */

import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

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
}: {
  name: string;
  src?: string;
  size?: number;
  presence?: Presence;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <AvatarPrimitive.Root className="inline-flex size-full overflow-hidden rounded-full bg-muted ring-1 ring-foreground/5">
        {src && <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />}
        <AvatarPrimitive.Fallback
          delayMs={src ? 300 : 0}
          className="grid size-full place-items-center font-medium text-muted-foreground"
          style={{ fontSize: Math.max(10, size * 0.36) }}
          aria-label={name}
        >
          {initials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {presence && (
        <span
          role="img"
          aria-label={presence}
          className={cn("absolute right-0 bottom-0 rounded-full ring-2 ring-background", PRESENCE[presence])}
          style={{ width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28) }}
        />
      )}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = 28 }: { names: readonly string[]; max?: number; size?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="flex -space-x-2">
      {shown.map((n) => (
        <Avatar key={n} name={n} size={size} className="rounded-full ring-2 ring-background" />
      ))}
      {rest > 0 && (
        <span
          className="grid place-items-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground ring-2 ring-background"
          style={{ width: size, height: size }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
