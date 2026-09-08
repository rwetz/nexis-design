// @nexis/design — the design layer shared across the Nexis desktop apps.
//
// Ships TypeScript source rather than a build: every consumer is Vite + TS,
// so there is nothing a compile step would buy that the consumer's own
// bundler does not already do, and a build would add a publish pipeline to
// a dependency that is resolved straight from git.
//
// Stylesheets are NOT re-exported here — CSS is imported by path so the
// consumer chooses a variant explicitly:
//
//   import "@nexis/design/styles/globals.css";      // any app
//   import "@nexis/design/styles/globals.ide.css";  // + terminal / editor
//   import "@nexis/design/styles/fonts.css";

export { ThemeProvider, useTheme, applyTheme, clearTheme } from "./theme";
export {
  BUILTIN_THEMES,
  getBuiltinTheme,
  getDefaultTheme,
  DEFAULT_THEME_ID,
} from "./theme";
export type {
  Theme,
  ThemeVariant,
  ThemeColors,
  ThemeMode,
  TerminalPalette,
} from "./theme";

export { WindowControls } from "./components/WindowControls";
export { ResizeHandles } from "./components/ResizeHandles";

// Platform facts and the keyboard-label vocabulary. Re-exported whole on
// purpose: every one of these is something an app would otherwise re-derive
// inline, and three apps deriving "is this Mac" three ways is how the family
// drifted in the first place.
export {
  IS_MAC,
  IS_LINUX,
  IS_WINDOWS,
  USE_CUSTOM_WINDOW_CONTROLS,
  MOD_KEY,
  MOD_PROP,
  CTRL_KEY,
  ALT_KEY,
  SHIFT_KEY,
  TAB_KEY,
  ENTER_KEY,
  KEY_SEP,
  fmtShortcut,
} from "./lib/platform";

export { spring, tween, useReducedMotion } from "./lib/motion";
export { cn } from "./lib/utils";
