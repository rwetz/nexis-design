/**
 * The interface scale (docs/RULES.md R2): one factor for type, spacing,
 * icons, radii and hit targets, so a 4K monitor gets the same proportions as
 * a laptop instead of the same pixels.
 *
 * It is applied as the root font size (`--ui-scale` in globals.css), not as
 * CSS `zoom`: Tailwind sizes in rem, so everything scales together, portals
 * (menus, dialogs, popovers) included, and the window's CSS width never
 * changes, so following that width can't feed back on itself.
 */

/** The steps, smallest first. Auto and the setting both land on one of these. */
export const INTERFACE_SCALES = [1, 1.125, 1.25, 1.5] as const;
export type InterfaceScale = (typeof INTERFACE_SCALES)[number];

/** The user's choice: follow the window, or one fixed step. */
export type InterfaceSize = "auto" | InterfaceScale;

/** Window widths (CSS px) at which Auto moves up a step: below 1600 is 100%. */
const BREAKS = [1600, 2200, 3000] as const;

/** How far past a boundary the window must go back before Auto steps down. */
export const HYSTERESIS = 64;

/**
 * The step Auto picks for a window `width` CSS px wide. With `previous`, a
 * width just under the boundary `previous` was chosen past keeps it, so
 * dragging a window edge near a boundary doesn't flicker between steps.
 */
export function autoInterfaceScale(width: number, previous?: InterfaceScale): InterfaceScale {
  let i = 0;
  while (i < BREAKS.length && width >= BREAKS[i]) i++;
  if (previous !== undefined) {
    const was = INTERFACE_SCALES.indexOf(previous);
    if (was === i + 1 && width >= BREAKS[i] - HYSTERESIS) return previous;
  }
  return INTERFACE_SCALES[i];
}

/** The size one step bigger (`+1`) or smaller (`-1`) than `scale`, clamped to the steps. */
export function stepInterfaceScale(scale: InterfaceScale, dir: 1 | -1): InterfaceScale {
  const i = INTERFACE_SCALES.indexOf(scale);
  return INTERFACE_SCALES[Math.min(INTERFACE_SCALES.length - 1, Math.max(0, i + dir))];
}

export function isInterfaceSize(v: unknown): v is InterfaceSize {
  return v === "auto" || (INTERFACE_SCALES as readonly unknown[]).includes(v);
}

/** Parses a stored size ("auto" or "1.25"); anything else is Auto. */
export function parseInterfaceSize(v: string | null): InterfaceSize {
  if (v === null || v === "auto") return "auto";
  const n = Number(v);
  return isInterfaceSize(n) ? n : "auto";
}

/** "112%" for 1.125: how the setting labels a step. */
export function interfaceScaleLabel(scale: InterfaceScale): string {
  return `${Math.floor(scale * 100)}%`;
}
