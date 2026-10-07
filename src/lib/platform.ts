// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { platform } from "@tauri-apps/plugin-os";

/** The OS according to Tauri, or "" when not running inside Tauri. */
const TAURI_PLATFORM = (() => {
  try {
    return platform();
  } catch {
    return "";
  }
})();

/**
 * True inside a Tauri webview. False in a plain browser — the gallery, a
 * Vite dev server opened without `tauri dev`, a test runner.
 */
export const IN_TAURI = TAURI_PLATFORM !== "";

/**
 * Outside Tauri, fall back to the browser's own report so keyboard labels
 * are still right (⌘ on a Mac running the gallery). Only *labels* use this
 * fallback; window chrome keys off `IN_TAURI`.
 */
const PLATFORM =
  TAURI_PLATFORM ||
  (typeof navigator !== "undefined"
    ? /Mac|iPhone|iPad/.test(navigator.userAgent)
      ? "macos"
      : /Linux/.test(navigator.userAgent)
        ? "linux"
        : /Win/.test(navigator.userAgent)
          ? "windows"
          : ""
    : "");

export const IS_MAC = PLATFORM === "macos";
export const IS_LINUX = PLATFORM === "linux";
export const IS_WINDOWS = PLATFORM === "windows";

/** Custom window controls (min/max/close) are rendered by us only inside
 * Tauri on non-macOS platforms — macOS keeps the native traffic lights via
 * the overlay title bar. */
export const USE_CUSTOM_WINDOW_CONTROLS = IN_TAURI && !IS_MAC;

export const MOD_KEY = IS_MAC ? "⌘" : "Ctrl";
/** KeyBinding property name for the platform's primary modifier. */
export const MOD_PROP: "meta" | "ctrl" = IS_MAC ? "meta" : "ctrl";
export const CTRL_KEY = IS_MAC ? "⌃" : "Ctrl";
export const ALT_KEY = IS_MAC ? "⌥" : "Alt";
export const SHIFT_KEY = IS_MAC ? "⇧" : "Shift";
export const TAB_KEY = IS_MAC ? "⇥" : "Tab";
export const ENTER_KEY = IS_MAC ? "↵" : "Enter";

export const KEY_SEP = IS_MAC ? "" : "+";

export function fmtShortcut(...parts: string[]): string {
  return parts.join(KEY_SEP);
}
