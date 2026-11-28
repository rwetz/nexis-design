// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝


import { cn } from "../../lib/utils";
import { type GlassChrome, useTheme } from "../../theme/ThemeProvider";
import { Glass } from "./glass";
import { Segmented } from "./segmented";
import { Slider } from "./slider";

/** "Clear", "Fully tinted" or the percent between, for screen readers. */
export function glassTintLabel(tint: number): string {
  if (tint <= 0.001) return "Clear";
  if (tint >= 0.999) return "Fully tinted";
  return `${Math.round(tint * 100)}% tinted`;
}

/**
 * Settings' Glass (docs/GLASS.md): window glass (off, or the whole window
 * as clear, regular, frosted or tinted glass), then a slider from clear
 * (every glass surface as designed) to fully tinted, with a live swatch
 * over a stripe so the difference shows where it's set.
 */
export function GlassTintControl({ className, chrome = true }: { className?: string; /** Show the window glass switch (glass chrome). */ chrome?: boolean }) {
  const { glassTint, setGlassTint, glassChrome, setGlassChrome } = useTheme();
  return (
    <div data-slot="glass-tint-control" className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
      {chrome && (
        <Segmented<GlassChrome>
          label="Window glass"
          size="sm"
          value={glassChrome}
          onChange={setGlassChrome}
          segments={[
            { id: "off", label: "Off" },
            { id: "clear", label: "Clear" },
            { id: "regular", label: "Regular" },
            { id: "frosted", label: "Frosted" },
            { id: "tinted", label: "Tinted" },
          ]}
        />
      )}
    <div className="flex w-full min-w-0 items-center gap-3">
      <div
        aria-hidden
        className="relative h-8 w-12 shrink-0 overflow-hidden rounded-lg"
        style={{
          background:
            "repeating-linear-gradient(135deg, var(--terminal-ansi-magenta) 0 6px, var(--terminal-ansi-cyan) 6px 12px, var(--terminal-ansi-yellow) 12px 18px)",
        }}
      >
        <Glass preset="regular" className="absolute inset-1 rounded-md" shadow={false} refraction={0} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Slider
          thumbLabel="Glass"
          valueText={glassTintLabel}
          min={0}
          max={1}
          step={0.01}
          value={[glassTint]}
          onValueChange={([v]) => v !== undefined && setGlassTint(v)}
        />
        <div className="flex justify-between text-caption text-muted-foreground">
          <span>Clear</span>
          <span className="tabular-nums text-foreground">{Math.round(glassTint * 100)}%</span>
          <span>Tinted</span>
        </div>
      </div>
    </div>
    </div>
  );
}
