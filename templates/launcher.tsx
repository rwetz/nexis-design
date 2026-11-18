// ╔══════════════════════════════════════╗
// ║  @nexis/design · app template        ║
// ║  launcher                            ║
// ╚══════════════════════════════════════╝
//
// Shape: sidebar of places (Home, Library, Settings at the bottom; never the
// items, R4.11) · home (hero, covers) · library (tabs, search, covers or a
// MediaList) · an item's page (hero, launch button, large tabs) · the running
// item, which owns the body, with a pause menu on Esc · command palette.
// Start here for: game launchers, app or plugin stores with installs, media
// libraries, emulator front ends, model managers: a library of things you
// open, install and run (RULES R4.10). From Stipple.
//
// The running view here is a placeholder: put your canvas or webview in
// <Running>. Its options and controls go in the pause menu and on the item's
// page, never in the shell's toolbar while it runs.

import * as React from "react";
import {
  Button,
  CardBadge,
  CardTilt,
  CommandPalette,
  CoverArt,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  GlidingTabs,
  HeroFact,
  Icon,
  type IconName,
  Input,
  keyActions,
  type KeyBindings,
  KeybindTable,
  LaunchButton,
  MediaList,
  Segmented,
  SettingRow,
  SettingsGroup,
  StatusDot,
  toneText,
  cn,
  type LaunchState,
  MediaHero,
  NexisMark,
  PauseMenu,
  ProductCard,
  PropertyList,
  SceneEnter,
  SidebarNav,
  StatusBar,
  StatusItem,
  ThumbnailGrid,
  TitleBar,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useCommandPaletteShortcut,
  useTheme,
  ViewEnter,
  WindowResizeEdges,
} from "@nexis/design";

type Item = {
  id: string;
  title: string;
  genre: string;
  tagline: string;
  icon: IconName;
  /** A cover picture (portrait, 3:4). `CoverArt` falls back to the icon and title if it fails to load. */
  cover?: string;
  /** Two chart tokens for the sample art drawn when there is no cover. */
  tones: [number, number];
  /** Something to install before the first run. */
  install?: { what: string; estimate: string };
  keys: { label: string; keys: string[] }[];
};

const ITEMS: Item[] = [
  {
    id: "ridge",
    title: "Ridge Runner",
    genre: "Racing",
    tagline: "Lap the mountain road against your own ghost.",
    icon: "rocket",
    tones: [1, 3],
    install: { what: "World data", estimate: "about 30 s" },
    keys: [
      { label: "Gas, brake", keys: ["W", "S"] },
      { label: "Steer", keys: ["A", "D"] },
      { label: "Handbrake", keys: ["Space"] },
      { label: "Change view", keys: ["C"] },
    ],
  },
  { id: "isle", title: "Lantern Isle", genre: "Adventure", tagline: "Light every lantern before the tide comes in.", icon: "map", tones: [2, 4], keys: [{ label: "Move", keys: ["W", "A", "S", "D"] }, { label: "Jump", keys: ["Space"] }, { label: "Look", keys: ["Mouse"] }] },
  { id: "drift", title: "Updrift", genre: "Flying", tagline: "Glide the thermals from island to island.", icon: "globe", tones: [5, 2], keys: [{ label: "Climb, dive", keys: ["W", "S"] }, { label: "Bank", keys: ["A", "D"] }] },
  { id: "viewer", title: "Asset viewer", genre: "Tool", tagline: "Turn a model on a turntable in every look.", icon: "search", tones: [3, 5], keys: [{ label: "Orbit", keys: ["Drag"] }, { label: "Next asset", keys: ["N"] }] },
];

const APP_NAME = "My Launcher";

type Place = "home" | "library" | "settings";
type Route = { page: Place } | { page: "item"; id: string } | { page: "running"; id: string };
const PLACE_TITLE: Record<Place, string> = { home: "Home", library: "Library", settings: "Settings" };
type Install = { kind: "missing" } | { kind: "installing"; frac: number } | { kind: "ready" };

function Art({ item }: { item: Item }) {
  const [a, b] = item.tones;
  return (
    <span
      className="grid size-full place-items-center text-foreground/40"
      style={{ background: `linear-gradient(160deg in oklch, var(--chart-${a}), color-mix(in oklch, var(--chart-${b}) 70%, var(--background)))` }}
    >
      <Icon name={item.icon} size="xl" />
    </span>
  );
}

export default function App() {
  const theme = useTheme();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [route, setRoute] = React.useState<Route>({ page: "home" });
  const [favourites, setFavourites] = React.useState<Set<string>>(() => new Set(["isle"]));
  const [installs, setInstalls] = React.useState<Record<string, Install>>({ ridge: { kind: "missing" } });
  const [bindings, setBindings] = React.useState<Record<string, KeyBindings>>({});
  const [paused, setPaused] = React.useState(false);
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  const find = (id: string) => ITEMS.find((i) => i.id === id) ?? ITEMS[0];
  const launchState = (it: Item): LaunchState => {
    const s = installs[it.id] ?? { kind: "ready" };
    if (s.kind === "missing" && it.install) return { kind: "install", what: it.install.what, estimate: it.install.estimate };
    if (s.kind === "installing") return { kind: "installing", stage: "Unpacking", frac: s.frac };
    return { kind: "play" };
  };
  // a stand-in for real install work: report progress, then a toast (RULES R5)
  const install = (it: Item) => {
    let f = 0;
    const t = setInterval(() => {
      f = Math.min(1, f + 0.08);
      setInstalls((s) => ({ ...s, [it.id]: f >= 1 ? { kind: "ready" } : { kind: "installing", frac: f } }));
      if (f >= 1) {
        clearInterval(t);
        toast.success(`${it.title} is installed`);
      }
    }, 120);
  };
  const run = (id: string) => {
    setPaused(false);
    setRoute({ page: "running", id });
  };
  const toggleFav = (id: string) =>
    setFavourites((f) => {
      const n = new Set(f);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Esc pauses the running item; the pause menu handles its own Esc
  React.useEffect(() => {
    if (route.page !== "running" || paused) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPaused(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [route.page, paused]);

  const running = route.page === "running";
  const current = route.page === "item" || route.page === "running" ? find(route.id) : null;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <CardTilt />
      <TitleBar
        className="nexis-shell-header"
        brand={<NexisMark className="size-[18px]" />}
        title={`${current ? current.title : PLACE_TITLE[route.page as Place]} · ${APP_NAME}`}
        actions={
          running &&
          !paused && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Pause" onClick={() => setPaused(true)}>
                  <Icon name="pause" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pause (Esc)</TooltipContent>
            </Tooltip>
          )
        }
      />
      <div className="nexis-shell-body flex min-h-0 flex-1">
        {!running && (
          <SidebarNav<Place>
            value={route.page === "item" ? "library" : (route.page as Place)}
            onChange={(page) => setRoute({ page })}
            sections={[
              {
                items: [
                  { id: "home", label: "Home", icon: "home" },
                  { id: "library", label: "Library", icon: "gamepad", meta: ITEMS.length },
                ],
              },
              { pin: "end", items: [{ id: "settings", label: "Settings", icon: "settings" }] },
            ]}
          />
        )}
        <main className="flex min-w-0 flex-1 flex-col">
          {route.page === "settings" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <ViewEnter replayKey="settings" className="flex max-w-2xl flex-col gap-section p-page">
                <h1 className="text-lg font-semibold">Settings</h1>
                <SettingsGroup title="Appearance">
                  <SettingRow label="Mode" description="Light, dark, or follow the system.">
                    <Segmented
                      label="Mode"
                      value={theme.mode}
                      onChange={(m) => theme.setMode(m as typeof theme.mode)}
                      segments={[
                        { id: "light", label: "Light" },
                        { id: "dark", label: "Dark" },
                        { id: "system", label: "System" },
                      ]}
                    />
                  </SettingRow>
                </SettingsGroup>
              </ViewEnter>
            </div>
          )}
          {(route.page === "home" || route.page === "library") && (
            <Library
              home={route.page === "home"}
              favourites={favourites}
              launchState={launchState}
              onOpen={(id) => setRoute({ page: "item", id })}
              onRun={run}
              onInstall={(id) => install(find(id))}
              onFavourite={toggleFav}
            />
          )}
          {route.page === "item" && current && (
            <ItemPage
              item={current}
              state={launchState(current)}
              favourite={favourites.has(current.id)}
              bindings={bindings[current.id] ?? {}}
              onBindings={(b) => setBindings((s) => ({ ...s, [current.id]: b }))}
              onBack={() => setRoute({ page: "library" })}
              onRun={() => run(current.id)}
              onInstall={() => install(current)}
              onFavourite={() => toggleFav(current.id)}
            />
          )}
          {running && current && (
            <div className="relative min-h-0 flex-1 overflow-hidden">
              {/* your canvas or webview goes here */}
              <Art item={current} />
              {paused && (
                <PauseMenu
                  title={current.title}
                  subtitle={current.tagline}
                  onResume={() => setPaused(false)}
                  items={[
                    { id: "resume", label: "Resume", icon: "play", hint: "Esc", run: () => setPaused(false) },
                    { id: "restart", label: "Restart", icon: "refresh", run: () => (setPaused(false), toast("Restarted")) },
                    {
                      id: "controls",
                      label: "Controls",
                      icon: "keyboard",
                      page: (
                        <div className="flex flex-col gap-group">
                          <span className="text-lg font-semibold">Controls</span>
                          <KeybindTable
                            actions={keyActions(current.keys)}
                            bindings={bindings[current.id] ?? {}}
                            onChange={(b) => setBindings((s) => ({ ...s, [current.id]: b }))}
                            compact
                          />
                        </div>
                      ),
                    },
                    { id: "quit", label: "Quit to its page", icon: "chevron-left", exit: true, run: () => setRoute({ page: "item", id: current.id }) },
                    { id: "library", label: "Quit to library", icon: "gamepad", exit: true, run: () => setRoute({ page: "library" }) },
                  ]}
                />
              )}
            </div>
          )}
        </main>
      </div>
      {running && <StatusBar className="nexis-shell-status" left={<StatusItem icon="play">Running</StatusItem>} right={<StatusItem live>60 fps</StatusItem>} />}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={[
          { id: "home", label: "Go home", group: "Go", icon: "home", run: () => setRoute({ page: "home" }) },
          { id: "library", label: "Go to library", group: "Go", icon: "gamepad", run: () => setRoute({ page: "library" }) },
          { id: "settings", label: "Open settings", group: "Go", icon: "settings", run: () => setRoute({ page: "settings" }) },
          ...ITEMS.map((i) => ({ id: `run-${i.id}`, label: `Play ${i.title}`, group: "Play", icon: "play" as const, run: () => run(i.id) })),
          ...(running ? [{ id: "pause", label: paused ? "Resume" : "Pause", group: "Running", icon: "pause" as const, run: () => setPaused((p) => !p) }] : []),
          { id: "mode", label: "Toggle light / dark", group: "View", icon: "contrast", run: () => theme.setMode(theme.resolvedMode === "dark" ? "light" : "dark") },
        ]}
      />
    </div>
  );
}

/** Home (a hero, then the covers) and Library (a title, tabs, search, covers or a list) share this. */
function Library({
  home,
  favourites,
  launchState,
  onOpen,
  onRun,
  onInstall,
  onFavourite,
}: {
  home: boolean;
  favourites: Set<string>;
  launchState: (i: Item) => LaunchState;
  onOpen: (id: string) => void;
  onRun: (id: string) => void;
  onInstall: (id: string) => void;
  onFavourite: (id: string) => void;
}) {
  const [tab, setTab] = React.useState<"all" | "favourites">("all");
  const [query, setQuery] = React.useState("");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const q = query.trim().toLowerCase();
  const shown = ITEMS.filter((i) => (tab === "all" || favourites.has(i.id)) && (!q || `${i.title} ${i.genre}`.toLowerCase().includes(q)));
  const hero = ITEMS[0];
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <ViewEnter replayKey={home ? "home" : "library"} className="flex flex-col gap-section p-page">
        {!home && <h1 className="text-lg font-semibold">Library</h1>}
        {home && (
        <MediaHero
          art={<Art item={hero} />}
          eyebrow="Continue playing"
          title={hero.title}
          badges={<CardBadge>{hero.genre}</CardBadge>}
          description={hero.tagline}
          actions={
            <>
              <LaunchButton state={launchState(hero)} onInstall={() => onInstall(hero.id)} onPlay={() => onRun(hero.id)} />
              <Button variant="secondary" size="lg" onClick={() => onOpen(hero.id)}>
                Details
              </Button>
            </>
          }
          meta={<HeroFact label="Last played" value="Yesterday" />}
        />
        )}
        <div className="flex items-center gap-row">
          <GlidingTabs label="Library" value={tab} onChange={setTab} tabs={[{ id: "all", label: "All" }, { id: "favourites", label: "Favourites" }]} />
          <div className="relative ml-auto w-56 min-w-28 shrink">
            <Icon name="search" size="sm" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the library" aria-label="Search the library" className="pl-8" />
          </div>
          <Segmented
            label="Layout"
            value={layout}
            onChange={(v) => setLayout(v as "grid" | "list")}
            segments={[
              { id: "grid", label: "Grid", icon: "grid" },
              { id: "list", label: "List", icon: "list-bullet" },
            ]}
          />
        </div>
        {layout === "list" ? (
          <MediaList
            label="Library"
            rows={shown}
            rowKey={(i) => i.id}
            art={(i) => <Art item={i} />}
            title={(i) => i.title}
            subtitle={(i) => i.tagline}
            columns={[
              { key: "genre", header: "Genre", width: "7rem", hideBelow: "md", cell: (i) => <span className="text-muted-foreground">{i.genre}</span> },
              {
                key: "state",
                header: "Status",
                width: "8rem",
                cell: (i) => {
                  const ready = launchState(i).kind === "play";
                  return (
                    <span className={cn("flex items-center gap-2 font-medium", toneText(ready ? "success" : "neutral"))}>
                      <StatusDot tone={ready ? "success" : "neutral"} /> {ready ? "Ready" : "Not installed"}
                    </span>
                  );
                },
              },
            ]}
            onOpen={(i) => onOpen(i.id)}
            action={(i) => {
              const ready = launchState(i).kind === "play";
              return (
                <Button size="sm" variant={ready ? "brand" : "secondary"} onClick={() => (ready ? onRun(i.id) : onInstall(i.id))}>
                  <Icon name={ready ? "play" : "download"} /> {ready ? "Play" : "Install"}
                </Button>
              );
            }}
          />
        ) : (
        <ThumbnailGrid min="11rem" maxColumns={6}>
          {shown.map((i) => (
            <ProductCard
              key={i.id}
              tilt
              aspect={0.75}
              media={i.cover ? <CoverArt src={i.cover} title={i.title} icon={i.icon} /> : <Art item={i} />}
              title={<span className="font-medium">{i.title}</span>}
              eyebrow={i.genre}
              badges={favourites.has(i.id) ? <CardBadge aria-label="Favourite"><Icon name="heart" size="xs" /></CardBadge> : undefined}
              price={<span className="text-caption text-muted-foreground">{launchState(i).kind === "install" ? "Not installed" : "Ready to play"}</span>}
              onClick={() => onOpen(i.id)}
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon-sm" aria-label={`${i.title} actions`} className="shadow-sm">
                      <Icon name="more" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onRun(i.id)}>
                      <Icon name="play" /> Play
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onOpen(i.id)}>
                      <Icon name="info" /> Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onFavourite(i.id)}>
                      <Icon name="heart" /> {favourites.has(i.id) ? "Remove from favourites" : "Add to favourites"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </ThumbnailGrid>
        )}
      </ViewEnter>
    </div>
  );
}

function ItemPage({
  item,
  state,
  favourite,
  bindings,
  onBindings,
  onBack,
  onRun,
  onInstall,
  onFavourite,
}: {
  item: Item;
  state: LaunchState;
  favourite: boolean;
  bindings: KeyBindings;
  onBindings: (b: KeyBindings) => void;
  onBack: () => void;
  onRun: () => void;
  onInstall: () => void;
  onFavourite: () => void;
}) {
  const [tab, setTab] = React.useState<"overview" | "controls">("overview");
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <ViewEnter replayKey={item.id}>
        <div className="relative">
          <Button variant="secondary" size="sm" className="absolute top-4 left-page z-10 shadow-sm" onClick={onBack}>
            <Icon name="chevron-left" /> Library
          </Button>
          <MediaHero
            variant="page"
            art={<Art item={item} />}
            eyebrow={item.genre}
            title={item.title}
            description={item.tagline}
            actions={
              <>
                <LaunchButton state={state} onInstall={onInstall} onPlay={onRun} />
                <Button variant="secondary" size="icon-lg" aria-label={favourite ? "Remove from favourites" : "Add to favourites"} aria-pressed={favourite} onClick={onFavourite}>
                  <Icon name="heart" swap active={favourite} />
                </Button>
              </>
            }
            meta={
              <>
                <HeroFact label="Last played" value="Yesterday" />
                <HeroFact label="Play time" value="3 h 20 min" />
              </>
            }
          />
        </div>
        <div className="flex flex-col gap-section px-page pt-group pb-page">
          <div className="border-b border-border pb-2">
            <GlidingTabs
              size="lg"
              label={`${item.title} sections`}
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "overview", label: "Overview", icon: "info" },
                { id: "controls", label: "Controls", icon: "keyboard" },
              ]}
            />
          </div>
          <SceneEnter replayKey={tab} className="w-full max-w-6xl">
            {tab === "overview" ? (
              <div className="grid items-start gap-section lg:grid-cols-[minmax(0,40rem)_22rem]">
                <p className="max-w-prose text-sm leading-relaxed text-foreground/90">{item.tagline}</p>
                <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
                  <h2 className="text-sm font-medium">Details</h2>
                  <PropertyList
                    items={[
                      { label: "Genre", value: item.genre },
                      { label: "Install", value: item.install ? `${item.install.what}, ${item.install.estimate}` : "None needed" },
                    ]}
                  />
                </section>
              </div>
            ) : (
              <KeybindTable layout="grid" actions={keyActions(item.keys)} bindings={bindings} onChange={onBindings} />
            )}
          </SceneEnter>
        </div>
      </ViewEnter>
    </div>
  );
}
