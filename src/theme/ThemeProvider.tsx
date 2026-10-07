// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The family's theme engine, as a provider.
 *
 * Tracks Nexis's `modules/theme/ThemeProvider.tsx` feature for feature —
 * theme id + light/dark/system mode, high contrast on top of any theme, the
 * default theme's rainbow hover accent, the palette epoch for canvas readers,
 * and the View Transition crossfade — with one difference: Nexis persists
 * through its own settings store, which no other app has. Here persistence is
 * `localStorage` under `storageKey`, and an app that keeps preferences
 * somewhere else passes the values in as props and listens on `onChange`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { IS_LINUX } from "../lib/platform";
import { applyTheme, clearTheme } from "./applyTheme";
import { RainbowDefs } from "./RainbowDefs";
import { installRainbowAccent } from "./rainbowAccent";
import { getBuiltinTheme, getDefaultTheme, migrateThemeId } from "./themes";
import { DEFAULT_THEME_ID, type Theme } from "./types";

export type { Theme };
export type ThemeModePref = "light" | "dark" | "system";
export type ContrastPref = "system" | "standard" | "high";

export function isContrastPref(v: unknown): v is ContrastPref {
  return v === "system" || v === "standard" || v === "high";
}

function isModePref(v: unknown): v is ThemeModePref {
  return v === "light" || v === "dark" || v === "system";
}

/**
 * Run a theme-changing state update inside a View Transition so the whole
 * window crossfades between palettes instead of hard-cutting.
 *
 * Disabled on Linux: WebKitGTK's view-transition path captures a full-page
 * GPU snapshot, which on the NVIDIA proprietary driver kills the web process
 * — the window dies on every theme switch. The crossfade is cosmetic, so
 * Linux gets an instant swap. See docs/PITFALLS.md §3.
 */
function withViewTransition(mutate: () => void): void {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || IS_LINUX || typeof doc.startViewTransition !== "function") {
    mutate();
    return;
  }
  doc.startViewTransition(() => flushSync(mutate));
}

const SYSTEM_CONTRAST_QUERY = "(prefers-contrast: more)";
const SYSTEM_FORCED_QUERY = "(forced-colors: active)";

function readSystemHighContrast(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia(SYSTEM_CONTRAST_QUERY).matches ||
    window.matchMedia(SYSTEM_FORCED_QUERY).matches
  );
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode, quota — the preference just does not persist */
  }
}

export type ThemePrefs = {
  mode: ThemeModePref;
  themeId: string;
  contrast: ContrastPref;
  rainbowAccent: boolean;
};

type ThemeProviderProps = {
  children: React.ReactNode;
  /** Mode on first launch, before anything is stored. */
  defaultMode?: ThemeModePref;
  /** Theme on first launch. */
  defaultThemeId?: string;
  /**
   * Prefix for the localStorage keys. Give each app its own so two apps
   * served from one origin in development do not share a theme.
   */
  storageKey?: string;
  /** User themes (e.g. loaded from `.nexis-theme` files) to resolve ids against. */
  customThemes?: Theme[];
  /** Called after any preference changes, for apps that persist elsewhere. */
  onChange?: (prefs: ThemePrefs) => void;
};

export type ThemeProviderState = {
  mode: ThemeModePref;
  resolvedMode: "dark" | "light";
  themeId: string;
  theme: Theme;
  contrast: ContrastPref;
  /** High contrast is in effect (the preference, or the OS under "system"). */
  highContrast: boolean;
  rainbowAccent: boolean;
  customThemes: Theme[];
  /**
   * Bumped once the theme's CSS variables are actually on the document.
   *
   * Redundant for anything styled in CSS. It exists for consumers that read
   * colours back out through a computed-style probe because their target
   * cannot see custom properties — a `<canvas>`, a WebGL terminal. The theme
   * id changes during the render that requests a new theme, while the
   * variables only land in an effect afterwards; probing on the id reads the
   * previous palette. Key on this instead.
   */
  paletteEpoch: number;
  setMode: (mode: ThemeModePref) => void;
  setThemeId: (id: string) => void;
  setContrast: (contrast: ContrastPref) => void;
  setRainbowAccent: (on: boolean) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

/**
 * The keys 0.1.x used (inherited from nexis-atlas). Read as a fallback so an
 * app upgrading keeps its users' theme; never written.
 */
const LEGACY_MODE_KEY = "atlas-ui-theme-shadow";
const LEGACY_THEME_KEY = "atlas-ui-theme-id-shadow";

export function ThemeProvider({
  children,
  defaultMode = "system",
  defaultThemeId = DEFAULT_THEME_ID,
  storageKey = "nexis-design",
  customThemes = [],
  onChange,
}: ThemeProviderProps) {
  const K = {
    mode: `${storageKey}:mode`,
    theme: `${storageKey}:theme`,
    contrast: `${storageKey}:contrast`,
    rainbow: `${storageKey}:rainbow`,
  };

  const [mode, setModeState] = useState<ThemeModePref>(() => {
    const v = read(K.mode) ?? read(LEGACY_MODE_KEY);
    return isModePref(v) ? v : defaultMode;
  });
  const [themeId, setThemeIdState] = useState<string>(() =>
    migrateThemeId(read(K.theme) ?? read(LEGACY_THEME_KEY) ?? defaultThemeId),
  );
  const [contrast, setContrastState] = useState<ContrastPref>(() => {
    const v = read(K.contrast);
    return isContrastPref(v) ? v : "system";
  });
  const [rainbowAccent, setRainbowState] = useState<boolean>(() => read(K.rainbow) !== "0");
  const [systemHighContrast, setSystemHighContrast] = useState(readSystemHighContrast);
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [paletteEpoch, setPaletteEpoch] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onSystem);
    return () => mq.removeEventListener("change", onSystem);
  }, []);

  // macOS "Increase contrast" and Windows high-contrast themes, live.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const a = window.matchMedia(SYSTEM_CONTRAST_QUERY);
    const b = window.matchMedia(SYSTEM_FORCED_QUERY);
    const update = () => setSystemHighContrast(readSystemHighContrast());
    a.addEventListener("change", update);
    b.addEventListener("change", update);
    return () => {
      a.removeEventListener("change", update);
      b.removeEventListener("change", update);
    };
  }, []);

  const resolvedMode: "dark" | "light" =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  const theme = useMemo(
    () =>
      customThemes.find((t) => t.id === themeId) ??
      getBuiltinTheme(themeId) ??
      getDefaultTheme(),
    [customThemes, themeId],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedMode);
    root.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  useEffect(() => {
    // The default theme has no colours of its own — globals.css supplies
    // them — so it is the absence of a theme, not an application of one.
    if (theme.id === DEFAULT_THEME_ID) clearTheme();
    else applyTheme(theme, resolvedMode);
    document.documentElement.dataset.theme = theme.id;
    // Strictly after applyTheme: the epoch promises the variables are there.
    setPaletteEpoch((n) => n + 1);
  }, [theme, resolvedMode]);

  // High contrast is an attribute, not variables: themes write their palette
  // as *inline* custom properties on <html>, which no stylesheet rule on
  // :root can beat. globals.css re-declares the tokens on <body> under this
  // attribute, and everything (portals included) inherits from <body>.
  const highContrast = contrast === "high" || (contrast === "system" && systemHighContrast);
  useEffect(() => {
    if (!highContrast) return;
    const root = document.documentElement;
    root.setAttribute("data-contrast", "high");
    return () => root.removeAttribute("data-contrast");
  }, [highContrast]);

  // Only the default theme has a rainbow accent — every other theme's accent
  // is its identity — and high contrast turns it off. Gating the install
  // means a disabled setting costs nothing: no listener, no paint servers.
  const rainbowActive = rainbowAccent && theme.id === DEFAULT_THEME_ID && !highContrast;
  useEffect(() => {
    if (!rainbowActive) return;
    const root = document.documentElement;
    root.setAttribute("data-rainbow-accent", "");
    const stop = installRainbowAccent();
    return () => {
      root.removeAttribute("data-rainbow-accent");
      stop();
    };
  }, [rainbowActive]);

  useEffect(() => {
    onChange?.({ mode, themeId, contrast, rainbowAccent });
    // onChange is deliberately not a dependency: an inline arrow would fire
    // this on every render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, themeId, contrast, rainbowAccent]);

  const setMode = useCallback(
    (next: ThemeModePref) => {
      withViewTransition(() => setModeState(next));
      write(K.mode, next);
    },
    [K.mode],
  );

  const setThemeId = useCallback(
    (id: string) => {
      withViewTransition(() => setThemeIdState(id));
      write(K.theme, id);
    },
    [K.theme],
  );

  const setContrast = useCallback(
    (next: ContrastPref) => {
      setContrastState(next);
      write(K.contrast, next);
    },
    [K.contrast],
  );

  const setRainbowAccent = useCallback(
    (on: boolean) => {
      setRainbowState(on);
      write(K.rainbow, on ? "1" : "0");
    },
    [K.rainbow],
  );

  const value = useMemo<ThemeProviderState>(
    () => ({
      mode,
      resolvedMode,
      themeId,
      theme,
      contrast,
      highContrast,
      rainbowAccent,
      customThemes,
      paletteEpoch,
      setMode,
      setThemeId,
      setContrast,
      setRainbowAccent,
    }),
    [
      mode,
      resolvedMode,
      themeId,
      theme,
      contrast,
      highContrast,
      rainbowAccent,
      customThemes,
      paletteEpoch,
      setMode,
      setThemeId,
      setContrast,
      setRainbowAccent,
    ],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {rainbowActive ? <RainbowDefs /> : null}
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme(): ThemeProviderState {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>");
  return ctx;
}
