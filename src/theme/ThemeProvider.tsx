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
 * interface scale (RULES R2), the palette epoch for canvas readers,
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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { IS_LINUX } from "../lib/platform";
import { applyTheme, clearTheme } from "./applyTheme";
import { autoInterfaceScale, type InterfaceScale, type InterfaceSize, parseInterfaceSize, stepInterfaceScale } from "./interfaceScale";
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
  interfaceSize: InterfaceSize;
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
  /**
   * Ctrl/Cmd += / - / 0 step the interface size and reset it to Auto
   * (RULES R2.3). Turn off only if the app binds those keys to something
   * that must win, and offer the setting anyway.
   */
  interfaceShortcuts?: boolean;
};

export type ThemeProviderState = {
  mode: ThemeModePref;
  resolvedMode: "dark" | "light";
  themeId: string;
  theme: Theme;
  contrast: ContrastPref;
  /** High contrast is in effect (the preference, or the OS under "system"). */
  highContrast: boolean;
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
  /** The user's interface size: Auto (follows the window) or a fixed step. */
  interfaceSize: InterfaceSize;
  /** The scale in effect now, Auto resolved against the window's width. */
  interfaceScale: InterfaceScale;
  setInterfaceSize: (size: InterfaceSize) => void;
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
  interfaceShortcuts = true,
}: ThemeProviderProps) {
  const K = {
    mode: `${storageKey}:mode`,
    theme: `${storageKey}:theme`,
    contrast: `${storageKey}:contrast`,
    size: `${storageKey}:ui-size`,
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
  const [systemHighContrast, setSystemHighContrast] = useState(readSystemHighContrast);
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [paletteEpoch, setPaletteEpoch] = useState(0);
  const [interfaceSize, setInterfaceSizeState] = useState<InterfaceSize>(() => parseInterfaceSize(read(K.size)));
  const [autoScale, setAutoScale] = useState<InterfaceScale>(() =>
    typeof window === "undefined" ? 1 : autoInterfaceScale(window.innerWidth),
  );

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

  // Auto follows the window's CSS width. The scale is the root font size, so
  // applying it never changes innerWidth and can't feed back on itself.
  useEffect(() => {
    if (interfaceSize !== "auto") return undefined;
    const update = () => setAutoScale((prev) => autoInterfaceScale(window.innerWidth, prev));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [interfaceSize]);
  const interfaceScale: InterfaceScale = interfaceSize === "auto" ? autoScale : interfaceSize;
  // Before paint, so a large window never shows one frame at 100%.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--ui-scale", String(interfaceScale));
  }, [interfaceScale]);

  useEffect(() => {
    onChange?.({ mode, themeId, contrast, interfaceSize });
    // onChange is deliberately not a dependency: an inline arrow would fire
    // this on every render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, themeId, contrast, interfaceSize]);

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

  const setInterfaceSize = useCallback(
    (next: InterfaceSize) => {
      setInterfaceSizeState(next);
      write(K.size, String(next));
    },
    [K.size],
  );

  // Ctrl/Cmd += and - step from the scale in effect (so the first press from
  // Auto lands one step from what's on screen); Ctrl/Cmd 0 goes back to Auto.
  const scaleRef = useRef(interfaceScale);
  scaleRef.current = interfaceScale;
  useEffect(() => {
    if (!interfaceShortcuts) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.key === "=" || e.key === "+") setInterfaceSize(stepInterfaceScale(scaleRef.current, 1));
      else if (e.key === "-" || e.key === "_") setInterfaceSize(stepInterfaceScale(scaleRef.current, -1));
      else if (e.key === "0") setInterfaceSize("auto");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interfaceShortcuts, setInterfaceSize]);

  const value = useMemo<ThemeProviderState>(
    () => ({
      mode,
      resolvedMode,
      themeId,
      theme,
      contrast,
      highContrast,
      customThemes,
      paletteEpoch,
      setMode,
      setThemeId,
      setContrast,
      interfaceSize,
      interfaceScale,
      setInterfaceSize,
    }),
    [
      mode,
      resolvedMode,
      themeId,
      theme,
      contrast,
      highContrast,
      customThemes,
      paletteEpoch,
      setMode,
      setThemeId,
      setContrast,
      interfaceSize,
      interfaceScale,
      setInterfaceSize,
    ],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme(): ThemeProviderState {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>");
  return ctx;
}
