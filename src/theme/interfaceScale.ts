/**
 * The interface scale (docs/RULES.md R2): one factor for type, spacing,
 * icons, radii and hit targets, so a 4K monitor gets the same proportions as
 * a laptop instead of the same pixels.
 *
 * It is applied as the root font size (`--ui-scale` in globals.css), not as
 * CSS `zoom`: Tailwind sizes in rem, so everything scales together, portals
 * (menus, dialogs, popovers) included, and the window's CSS size never
 * changes, so following that size can't feed back on itself.
 *
 * The scale is continuous. Auto fits it to the window (width and height, in
 * CSS pixels, which already include the OS's own scale factor), and the
 * user's adjustment multiplies whatever Auto picks, so a preference for
 * "a bit bigger" carries from a laptop to a 4K monitor instead of being one
 * fixed number tuned for one screen.
 */

/** The window Auto calls 100%: a 13 to 14 inch laptop's usual work area. */
export const REFERENCE_WINDOW = { width: 1440, height: 900 } as const;

/**
 * How strongly Auto follows the window. 1 would make every window show the
 * same content, only bigger; 0 would never scale. At 0.6 a bigger window
 * shows bigger text and more of it.
 */
export const AUTO_EXPONENT = 0.6;

/** The range Auto lands in before the adjustment. */
export const AUTO_RANGE = { min: 0.9, max: 2 } as const;

/** The range of a fixed size, and of the result in Auto after adjusting. */
export const INTERFACE_SCALE_RANGE = { min: 0.75, max: 2.5 } as const;

/** The range of the adjustment Auto is multiplied by. */
export const INTERFACE_ADJUST_RANGE = { min: 0.75, max: 1.5 } as const;

/** The slider's and the keyboard's step: 5%. */
export const INTERFACE_STEP = 0.05;

/** Auto moves in steps this fine (2.5%), so dragging a window edge doesn't reflow every pixel. */
export const AUTO_QUANTUM = 0.025;

/** Quick picks for menus and segmented controls; any value in range works. */
export const INTERFACE_SCALES = [0.9, 1, 1.125, 1.25, 1.5, 1.75, 2] as const;

/** A scale factor: 1 is 100%. Any number in `INTERFACE_SCALE_RANGE`. */
export type InterfaceScale = number;

/** The user's choice: follow the window, or one fixed scale. */
export type InterfaceSize = "auto" | InterfaceScale;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, q: number) => Math.round(v / q) * q;
/** Strips float noise (1.1500000000000001) so stored values read cleanly. */
const tidy = (v: number) => Math.round(v * 1000) / 1000;

/**
 * The scale Auto picks for a window `width` by `height` CSS px. With
 * `previous`, a raw value within a quantum of it keeps it, so a window edge
 * dragged back and forth near a boundary doesn't flicker.
 */
export function autoInterfaceScale(width: number, height: number = width * (REFERENCE_WINDOW.height / REFERENCE_WINDOW.width), previous?: InterfaceScale): InterfaceScale {
  if (!(width > 0) || !(height > 0)) return 1;
  const fit = Math.min(width / REFERENCE_WINDOW.width, height / REFERENCE_WINDOW.height);
  const raw = clamp(fit ** AUTO_EXPONENT, AUTO_RANGE.min, AUTO_RANGE.max);
  if (previous !== undefined && Math.abs(raw - previous) < AUTO_QUANTUM) return previous;
  return tidy(clamp(round(raw, AUTO_QUANTUM), AUTO_RANGE.min, AUTO_RANGE.max));
}

/** The scale in effect: a fixed size as it is, or Auto times the adjustment. */
export function resolveInterfaceScale(size: InterfaceSize, auto: InterfaceScale, adjust = 1): InterfaceScale {
  const v = size === "auto" ? auto * clampInterfaceAdjust(adjust) : size;
  return tidy(clamp(v, INTERFACE_SCALE_RANGE.min, INTERFACE_SCALE_RANGE.max));
}

export function clampInterfaceScale(v: number): InterfaceScale {
  return tidy(clamp(v, INTERFACE_SCALE_RANGE.min, INTERFACE_SCALE_RANGE.max));
}

export function clampInterfaceAdjust(v: number): number {
  return tidy(clamp(Number.isFinite(v) ? v : 1, INTERFACE_ADJUST_RANGE.min, INTERFACE_ADJUST_RANGE.max));
}

/** `scale` one step (5%) bigger (`+1`) or smaller (`-1`), on the 5% grid, clamped. */
export function stepInterfaceScale(scale: InterfaceScale, dir: 1 | -1): InterfaceScale {
  return clampInterfaceScale(round(scale, INTERFACE_STEP) + dir * INTERFACE_STEP);
}

/** The adjustment one step bigger or smaller, clamped. */
export function stepInterfaceAdjust(adjust: number, dir: 1 | -1): number {
  return clampInterfaceAdjust(round(adjust, INTERFACE_STEP) + dir * INTERFACE_STEP);
}

export function isInterfaceSize(v: unknown): v is InterfaceSize {
  return v === "auto" || (typeof v === "number" && v >= INTERFACE_SCALE_RANGE.min && v <= INTERFACE_SCALE_RANGE.max);
}

/** Parses a stored size ("auto" or "1.25"); anything else is Auto. */
export function parseInterfaceSize(v: string | null): InterfaceSize {
  if (v === null || v === "auto" || v.trim() === "") return "auto";
  const n = Number(v);
  return isInterfaceSize(n) ? tidy(n) : "auto";
}

/** Parses a stored adjustment; anything unreadable is 1. */
export function parseInterfaceAdjust(v: string | null): number {
  if (v === null || v.trim() === "") return 1;
  const n = Number(v);
  return Number.isFinite(n) ? clampInterfaceAdjust(n) : 1;
}

/** "113%" for 1.125: how settings label a scale. */
export function interfaceScaleLabel(scale: InterfaceScale): string {
  return `${Math.round(scale * 100)}%`;
}
