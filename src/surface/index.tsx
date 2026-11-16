// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { lazy, Suspense, useMemo, useLayoutEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { resolveCssColor } from "../styles/tokens";
import { useTheme } from "../theme";
import { cn } from "../lib/utils";

const Aurora = lazy(() => import("./Aurora").then(({ AuroraBackground }) => ({ default: AuroraBackground })));
const Particles = lazy(() => import("./Particles").then(({ ParticlesBackground }) => ({ default: ParticlesBackground })));
const Threads = lazy(() => import("./Threads").then(({ ThreadsBackground }) => ({ default: ThreadsBackground })));

export type SurfaceKind = "aurora" | "particles" | "threads";

type SurfaceLayerProps = {
  kind: SurfaceKind | null;
  opacity?: number;
  className?: string;
};

/** Place inside a positioned container with an isolated stacking context. */
export function SurfaceLayer({ kind, opacity = 0.25, className }: SurfaceLayerProps) {
  const { highContrast, paletteEpoch } = useTheme();
  const reducedMotion = useReducedMotion();
  const [channels, setChannels] = useState<[number, number, number] | null>(null);

  useLayoutEffect(() => {
    if (!kind || highContrast || reducedMotion) return;
    const match = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(resolveCssColor("var(--brand)"));
    if (match) setChannels([Number(match[1]), Number(match[2]), Number(match[3])]);
  }, [kind, highContrast, reducedMotion, paletteEpoch]);

  const palette = useMemo(() => {
    if (!channels) return null;
    const hex = (lift: number) => `#${channels.map((value) =>
      Math.min(255, value + lift).toString(16).padStart(2, "0"),
    ).join("")}`;
    return {
      aurora: [hex(0), hex(64), hex(16)],
      particles: [hex(0), hex(48), hex(96)] as [string, ...string[]],
      threads: [channels[0] / 255, channels[1] / 255, channels[2] / 255] as [number, number, number],
    };
  }, [channels]);

  if (!kind || highContrast || reducedMotion || !palette || opacity <= 0) return null;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <Suspense fallback={null}>
        {kind === "aurora" && <Aurora colorStops={palette.aurora} opacity={opacity} />}
        {kind === "particles" && <Particles particleColors={palette.particles} opacity={opacity} />}
        {kind === "threads" && <Threads color={palette.threads} opacity={opacity} />}
      </Suspense>
    </div>
  );
}
