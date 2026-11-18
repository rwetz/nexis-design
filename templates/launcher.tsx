// ╔══════════════════════════════════════╗
// ║  @nexis/design · app template        ║
// ║  launcher                            ║
// ╚══════════════════════════════════════╝
//
// Shape: sidebar · library (hero, tabs, search, cover grid) · an item's page
// (hero, launch button, tabs) · the running item, which owns the body, with a
// pause menu on Esc · command palette.
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

type Route = { page: "library" } | { page: "item"; id: string } | { page: "running"; id: string };
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
  const [route, setRoute] = React.useState<Route>({ page: "library" });
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
  const current = route.page === "library" ? null : find(route.id);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <CardTilt />
      <TitleBar
        className="nexis-shell-header"
        brand={<NexisMark className="size-[18px]" />}
        title={`${current ? current.title : "Library"} · ${APP_NAME}`}
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
          <SidebarNav
            value={route.page === "library" ? "library" : route.id}
            onChange={(id) => setRoute(id === "library" ? { page: "library" } : { page: "item", id })}
            sections={[
              { title: "Launcher", items: [{ id: "library", label: "Library", icon: "grid" }] },
              { title: "Installed", items: ITEMS.map((i) => ({ id: i.id, label: i.title, icon: i.icon })) },
            ]}
          />
        )}
        <main className="flex min-w-0 flex-1 flex-col">
          {route.page === "library" && (
            <Library
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
                    { id: "library", label: "Quit to library", icon: "grid", exit: true, run: () => setRoute({ page: "library" }) },
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
          { id: "library", label: "Go to library", group: "Go", icon: "grid", run: () => setRoute({ page: "library" }) },
          ...ITEMS.map((i) => ({ id: `run-${i.id}`, label: `Play ${i.title}`, group: "Play", icon: "play" as const, run: () => run(i.id) })),
          ...(running ? [{ id: "pause", label: paused ? "Resume" : "Pause", group: "Running", icon: "pause" as const, run: () => setPaused((p) => !p) }] : []),
          { id: "mode", label: "Toggle light / dark", group: "View", icon: "contrast", run: () => theme.setMode(theme.resolvedMode === "dark" ? "light" : "dark") },
        ]}
      />
    </div>
  );
}

function Library({
  favourites,
  launchState,
  onOpen,
  onRun,
  onInstall,
  onFavourite,
}: {
  favourites: Set<string>;
  launchState: (i: Item) => LaunchState;
  onOpen: (id: string) => void;
  onRun: (id: string) => void;
  onInstall: (id: string) => void;
  onFavourite: (id: string) => void;
}) {
  const [tab, setTab] = React.useState<"all" | "favourites">("all");
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const shown = ITEMS.filter((i) => (tab === "all" || favourites.has(i.id)) && (!q || `${i.title} ${i.genre}`.toLowerCase().includes(q)));
  const hero = ITEMS[0];
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <ViewEnter replayKey="library" className="flex flex-col gap-section p-page">
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
        <div className="flex items-center gap-row">
          <GlidingTabs label="Library" value={tab} onChange={setTab} tabs={[{ id: "all", label: "All" }, { id: "favourites", label: "Favourites" }]} />
          <div className="relative ml-auto w-56 min-w-28 shrink">
            <Icon name="search" size="sm" className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the library" aria-label="Search the library" className="pl-8" />
          </div>
        </div>
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
        <div className="flex flex-col gap-group px-page pb-page">
          <div className="border-b border-border">
            <GlidingTabs
              label={`${item.title} sections`}
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "overview", label: "Overview", icon: "info" },
                { id: "controls", label: "Controls", icon: "keyboard" },
              ]}
            />
          </div>
          <SceneEnter replayKey={tab} className="max-w-[760px]">
            {tab === "overview" ? (
              <PropertyList
                items={[
                  { label: "Genre", value: item.genre },
                  { label: "Install", value: item.install ? `${item.install.what}, ${item.install.estimate}` : "None needed" },
                ]}
              />
            ) : (
              <KeybindTable actions={keyActions(item.keys)} bindings={bindings} onChange={onBindings} />
            )}
          </SceneEnter>
        </div>
      </ViewEnter>
    </div>
  );
}
