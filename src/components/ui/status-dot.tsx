// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A small round state marker. `live` blinks it at the caret cadence
 * (`.nexis-blink`) — the house signal for "this is happening now" — instead
 * of Tailwind's `animate-pulse`, which breathes like every other app.
 */

import { cn } from "../../lib/utils";

export type Tone = "neutral" | "brand" | "success" | "warning" | "info" | "danger";

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-muted-foreground/60",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
};

export function toneText(tone: Tone): string {
  switch (tone) {
    case "brand":
      return "text-brand";
    case "success":
      return "text-success";
    case "warning":
      return "text-warning";
    case "info":
      return "text-info";
    case "danger":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

export function StatusDot({
  tone = "neutral",
  live = false,
  label,
  className,
}: {
  tone?: Tone;
  live?: boolean;
  /** Accessible name; the dot is decorative without one. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      data-slot="status-dot"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("inline-block size-2 shrink-0 rounded-full", TONE_BG[tone], live && "nexis-blink", className)}
    />
  );
}
