// The gallery shell: title bar, nav, the page, status bar. It is itself built
// only from the package — if something here needs a one-off class to look
// right, that is a gap in the package, not a gallery problem.
import * as React from "react";
import {
  Button,
  CommandPalette,
  DEFAULT_THEME_ID,
  fmtShortcut,
  Icon,
  type IconName,
  listBuiltinThemes,
  MOD_KEY,
  type PaletteCommand,
  Segmented,
  SHIFT_KEY,
  SidebarNav,
  StatusBar,
  StatusItem,
  TitleBar,
  useCommandPaletteShortcut,
  useTheme,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  listNexisThemes,
  listCommunityThemes,
} from "@nexis/design";
import { APPS, type AppId } from "./apps";
import { ChartsPage } from "./pages/charts";
import { ChromePage } from "./pages/chrome";
import { ControlsPage } from "./pages/controls";
import { DataPage } from "./pages/data";
import { FeedbackPage } from "./pages/feedback";
import { FormsPage } from "./pages/forms";
import { FoundationsPage } from "./pages/foundations";
import { IconsPage } from "./pages/icons";
import { LayoutPage } from "./pages/layout";
import { MotionPage } from "./pages/motion";
import { NavigationPage } from "./pages/navigation";
import { OverlaysPage } from "./pages/overlays";
import { OverviewPage } from "./pages/overview";
import { ThemesPage } from "./pages/themes";

type PageId =
  | "overview"
  | "foundations"
  | "themes"
  | "controls"
  | "forms"
  | "overlays"
  | "navigation"
  | "data"
  | "charts"
  | "feedback"
  | "layout"
  | "motion"
  | "chrome"
  | "icons"
  | `app-${AppId}`;

const PAGES: Record<Exclude<PageId, `app-${string}`>, { label: string; icon: IconName; render: () => React.ReactNode }> = {
  overview: { label: "Overview", icon: "home", render: () => <OverviewPage /> },
  foundations: { label: "Foundations", icon: "layers", render: () => <FoundationsPage /> },
  themes: { label: "Themes", icon: "theme", render: () => <ThemesPage /> },
  controls: { label: "Controls", icon: "check-box", render: () => <ControlsPage /> },
  forms: { label: "Forms", icon: "text", render: () => <FormsPage /> },
  overlays: { label: "Overlays", icon: "more-circle", render: () => <OverlaysPage /> },
  navigation: { label: "Navigation", icon: "sidebar-left", render: () => <NavigationPage /> },
  data: { label: "Data", icon: "table", render: () => <DataPage /> },
  charts: { label: "Charts", icon: "chart-line", render: () => <ChartsPage /> },
  feedback: { label: "Feedback", icon: "notification", render: () => <FeedbackPage /> },
  layout: { label: "Layout", icon: "grid", render: () => <LayoutPage /> },
  motion: { label: "Motion", icon: "sparkle", render: () => <MotionPage /> },
  chrome: { label: "Window chrome", icon: "computer", render: () => <ChromePage /> },
  icons: { label: "Icons", icon: "star", render: () => <IconsPage /> },
};

function readRoute(): PageId {
  const h = location.hash.replace(/^#\/?/, "");
  if (h.startsWith("app/")) {
    const id = h.slice(4) as AppId;
    if (id in APPS) return `app-${id}`;
  }
  return (h in PAGES ? h : "overview") as PageId;
}

function useRoute(): [PageId, (p: PageId) => void] {
  const [route, setRoute] = React.useState<PageId>(readRoute);
  React.useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = React.useCallback((p: PageId) => {
    location.hash = p.startsWith("app-") ? `/app/${p.slice(4)}` : `/${p}`;
  }, []);
  return [route, go];
}

export function ThemePicker({ className }: { className?: string }) {
  const { themeId, setThemeId } = useTheme();
  return (
    <Select value={themeId} onValueChange={setThemeId}>
      <SelectTrigger size="sm" className={className} aria-label="Theme">
        <Icon name="theme" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Nexis</SelectLabel>
          {listNexisThemes().map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Community</SelectLabel>
          {listCommunityThemes().map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ModeSwitch() {
  const { mode, setMode } = useTheme();
  return (
    <Segmented
      label="Appearance"
      size="sm"
      value={mode}
      onChange={setMode}
      segments={[
        { id: "light", icon: "theme-light", title: "Light" },
        { id: "dark", icon: "theme-dark", title: "Dark" },
        { id: "system", icon: "computer", title: "System" },
      ]}
    />
  );
}

export function Gallery() {
  const [route, go] = useRoute();
  const theme = useTheme();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  React.useEffect(() => {
    document.querySelector("[data-gallery-scroll]")?.scrollTo({ top: 0 });
  }, [route]);

  const commands = React.useMemo<PaletteCommand[]>(() => {
    const pages = Object.entries(PAGES).map(([id, p]) => ({
      id: `go-${id}`,
      label: `Go to ${p.label}`,
      group: "Navigate",
      icon: p.icon,
      run: () => go(id as PageId),
    }));
    const apps = (Object.keys(APPS) as AppId[]).map((id) => ({
      id: `app-${id}`,
      label: `Open template: ${APPS[id].label}`,
      group: "Templates",
      icon: APPS[id].icon,
      run: () => go(`app-${id}`),
    }));
    const themes = listBuiltinThemes().map((t) => ({
      id: `theme-${t.id}`,
      label: `Theme: ${t.name}`,
      group: "Theme",
      icon: "theme" as const,
      keywords: [t.description ?? ""],
      run: () => theme.setThemeId(t.id),
    }));
    return [
      ...pages,
      ...apps,
      {
        id: "mode-toggle",
        label: "Toggle light / dark",
        group: "Theme",
        icon: "contrast",
        shortcut: fmtShortcut(MOD_KEY, SHIFT_KEY, "L"),
        run: () => theme.setMode(theme.resolvedMode === "dark" ? "light" : "dark"),
      },
      {
        id: "contrast",
        label: theme.highContrast ? "Turn high contrast off" : "Turn high contrast on",
        group: "Theme",
        icon: "contrast",
        run: () => theme.setContrast(theme.highContrast ? "standard" : "high"),
      },
      ...themes,
    ];
  }, [go, theme]);

  if (route.startsWith("app-")) {
    const id = route.slice(4) as AppId;
    const App = APPS[id].component;
    return (
      <div className="relative h-full">
        <App />
        {!new URLSearchParams(location.search).has("shot") && (
          <Button
            variant="secondary"
            size="xs"
            className="fixed right-40 bottom-10 z-50 shadow-lg"
            onClick={() => go("overview")}
          >
            <Icon name="arrow-right" className="rotate-180" />
            Gallery
          </Button>
        )}
      </div>
    );
  }

  const page = PAGES[route as keyof typeof PAGES];
  const themeName = listBuiltinThemes().find((t) => t.id === theme.themeId)?.name ?? "Nexis Default";

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <TitleBar
        controls="preview"
        brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />}
        title={
          <span>
            Nexis Design <span className="text-muted-foreground">· {page.label}</span>
          </span>
        }
        center={
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-7 w-full max-w-sm items-center gap-2 rounded-full bg-muted/70 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon name="search" size="xs" />
            <span className="flex-1 text-left">Search components, themes, templates…</span>
            <kbd className="font-mono text-[10px]">{fmtShortcut(MOD_KEY, SHIFT_KEY, "P")}</kbd>
          </button>
        }
        actions={
          <>
            <ThemePicker className="w-40" />
            <ModeSwitch />
          </>
        }
      />
      <div className="flex min-h-0 flex-1">
        <SidebarNav
          value={route}
          onChange={go}
          sections={[
            {
              title: "Design system",
              items: (["overview", "foundations", "themes", "icons", "motion", "chrome"] as const).map((id) => ({
                id,
                label: PAGES[id].label,
                icon: PAGES[id].icon,
                meta: id === "themes" ? listBuiltinThemes().length : undefined,
              })),
            },
            {
              title: "Components",
              items: (["controls", "forms", "overlays", "navigation", "data", "charts", "feedback", "layout"] as const).map((id) => ({
                id,
                label: PAGES[id].label,
                icon: PAGES[id].icon,
              })),
            },
            {
              title: "App templates",
              items: (Object.keys(APPS) as AppId[]).map((id) => ({
                id: `app-${id}` as PageId,
                label: APPS[id].label,
                icon: APPS[id].icon,
              })),
            },
          ]}
          footer={
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground">
              <span className="font-mono">@nexis/design</span>
              <span className="flex-1" />
              <span className="font-mono">0.2.0</span>
            </div>
          }
        />
        <main data-gallery-scroll className="min-w-0 flex-1 overflow-y-auto nexis-scrollbar">
          <div key={route} className="nexis-scene-enter">
            {page.render()}
          </div>
        </main>
      </div>
      <StatusBar
        left={
          <>
            <StatusItem icon="theme">{themeName}</StatusItem>
            <StatusItem icon={theme.resolvedMode === "dark" ? "theme-dark" : "theme-light"}>
              {theme.resolvedMode === "dark" ? "Dark" : "Light"}
            </StatusItem>
            {theme.highContrast && <StatusItem icon="contrast">High contrast</StatusItem>}
            {theme.themeId === DEFAULT_THEME_ID && theme.rainbowAccent && !theme.highContrast && (
              <StatusItem icon="sparkle">Rainbow hover</StatusItem>
            )}
          </>
        }
        right={
          <>
            <StatusItem icon="keyboard" onClick={() => setPaletteOpen(true)}>
              {fmtShortcut(MOD_KEY, SHIFT_KEY, "P")} commands
            </StatusItem>
            <StatusItem>Tauri v2 · React 19 · Tailwind v4</StatusItem>
          </>
        }
      />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </div>
  );
}
