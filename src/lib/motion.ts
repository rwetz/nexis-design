// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The JS half of the motion system. The CSS half — the tokens every
 * transition reads — lives in globals.css (`--ease-enter`, `--dur-tap`, …)
 * and is what almost everything should use.
 *
 * `motion` (the library) is for the movement CSS cannot express: a rail that
 * retargets mid-flight, a layout animating from wherever it currently is.
 * Everything a CSS transition can do stays on CSS. See
 * docs/DESIGN_LANGUAGE.md §5.
 *
 * Import `m`, never `motion`, from `motion/react`, and wrap the app in
 * `<LazyMotion features={domAnimation} strict>` — a stray `motion.div` then
 * throws in development instead of silently pulling the full renderer in.
 */
import { useReducedMotion } from "motion/react";

/** The house curves and durations, as numbers, for the rare JS consumer. */
export const ease = {
  /** Arriving: decelerates hard into place. */
  enter: [0.2, 0, 0, 1] as const,
  /** Leaving: accelerates away. Faster than arriving. */
  exit: [0.4, 0, 1, 1] as const,
};

export const dur = {
  tap: 0.09,
  panel: 0.14,
  window: 0.2,
  scene: 0.42,
} as const;

/** The one spring: a selection travelling along a rail. Never overshoots. */
export const railSpring = { type: "spring", stiffness: 520, damping: 40 } as const;

/** `railSpring`, collapsed to an instant move under reduced motion. */
export function useRailTransition() {
  const reduce = useReducedMotion();
  return reduce ? { duration: 0 } : railSpring;
}

export { useReducedMotion };

/**
 * @deprecated 0.1.x's spring presets. Nexis moved to CSS motion tokens plus
 * one rail spring (`railSpring`); these stay so 0.1 consumers keep building.
 * New code: a CSS transition on the house tokens, or `railSpring`.
 */
export const spring = {
  snappy: { type: "spring", stiffness: 480, damping: 36 } as const,
  smooth: { type: "spring", stiffness: 220, damping: 30 } as const,
  gentle: { type: "spring", stiffness: 140, damping: 24 } as const,
};

/** @deprecated See `spring`. Use `dur` + `ease`, or CSS tokens. */
export const tween = {
  fast: { duration: 0.12, ease: ease.enter },
  base: { duration: dur.window, ease: ease.enter },
  slow: { duration: 0.34, ease: ease.enter },
};
