// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import * as React from "react";
import {
  Button,
  CardBadge,
  CoverArt,
  HeroFact,
  Icon,
  keyActions,
  type KeyBindings,
  KeybindTable,
  keyRemap,
  LaunchButton,
  type LaunchState,
  MediaHero,
  PauseMenu,
  PropertyList,
} from "@nexis/design";
import { Demo, Grid, Page } from "../kit";

function Art({ a, b }: { a: number; b: number }) {
  return <span className="block size-full" style={{ background: `linear-gradient(160deg in oklch, var(--chart-${a}), color-mix(in oklch, var(--chart-${b}) 70%, var(--background)))` }} />;
}

const KEYS = keyActions([
  { label: "Gas, brake", keys: ["W", "S"] },
  { label: "Steer", keys: ["A", "D"] },
  { label: "Handbrake", keys: ["Space"] },
  { label: "Look", keys: ["Mouse"] },
]);

export function LauncherPage() {
  const [state, setState] = React.useState<LaunchState>({ kind: "install", what: "World data", estimate: "about 30 s" });
  const [keys, setKeys] = React.useState<KeyBindings>({});
  const [paused, setPaused] = React.useState(true);
  const remap = keyRemap(keys);

  const install = () => {
    let f = 0;
    const t = setInterval(() => {
      f = Math.min(1, f + 0.07);
      setState(f >= 1 ? { kind: "play" } : { kind: "installing", stage: f < 0.5 ? "Downloading" : "Unpacking", frac: f });
      if (f >= 1) clearInterval(t);
    }, 120);
  };

  return (
    <Page
      title="Launcher"
      lede="For a library of things you open, install and run: games, plugins, models, media (RULES R4.10, the launcher template). The running thing owns the body; its options and controls live in a pause menu on Esc and on its page, never in the shell's toolbar. From Stipple."
    >
      <Demo title="MediaHero" meta="feature · CardBadge on art · LaunchButton · HeroFact" flush>
        <div className="p-4">
          <MediaHero
            art={<Art a={1} b={3} />}
            eyebrow="Continue playing"
            title="Ridge Runner"
            badges={<CardBadge>Racing</CardBadge>}
            description="Lap the mountain road against your own ghost."
            actions={
              <>
                <LaunchButton state={state} onInstall={install} onPlay={() => setState({ kind: "resume" })} />
                <Button variant="secondary" size="lg">
                  Details
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
      </Demo>
      <Grid cols={2}>
        <Demo title="LaunchButton" meta="one width through every state">
          <div className="flex flex-col gap-row">
            <LaunchButton state={{ kind: "install", what: "World data", estimate: "about 30 s" }} onInstall={() => {}} onPlay={() => {}} />
            <LaunchButton state={{ kind: "installing", stage: "Unpacking", frac: 0.42 }} onInstall={() => {}} onPlay={() => {}} />
            <LaunchButton state={{ kind: "play" }} onInstall={() => {}} onPlay={() => {}} />
            <LaunchButton state={{ kind: "resume" }} onInstall={() => {}} onPlay={() => {}} />
          </div>
        </Demo>
        <Demo title="CoverArt" meta="a picture, or its icon and title when there is none">
          <div className="grid grid-cols-3 gap-row">
            {[
              { src: null, title: "Lantern Isle", icon: "map" as const },
              { src: "/missing-cover.webp", title: "Updrift", icon: "globe" as const },
              { src: null, title: "", icon: "search" as const },
            ].map((c, i) => (
              <span key={i} className="aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-foreground/8">
                <CoverArt src={c.src} title={c.title} icon={c.icon} />
              </span>
            ))}
          </div>
        </Demo>
      </Grid>
      <Grid cols={2}>
        <Demo title="KeybindTable" meta="click a key, press another · conflicts · mouse rows fixed">
          <KeybindTable actions={KEYS} bindings={keys} onChange={setKeys} />
          <PropertyList
            items={[
              { label: "keyRemap(b).map", value: JSON.stringify(remap.map), mono: true },
              { label: "blocked", value: JSON.stringify([...remap.blocked]), mono: true },
            ]}
          />
        </Demo>
        <Demo title="PauseMenu" meta="Esc · arrows glide · pages beside the list" flush>
          <div className="relative h-[28rem] overflow-hidden rounded-b-xl">
            <Art a={2} b={4} />
            {paused ? (
              <PauseMenu
                title="Ridge Runner"
                subtitle="Seed 11"
                onResume={() => setPaused(false)}
                items={[
                  { id: "resume", label: "Resume", icon: "play", hint: "Esc", run: () => setPaused(false) },
                  { id: "restart", label: "Restart", icon: "refresh", run: () => setPaused(false) },
                  { id: "controls", label: "Controls", icon: "keyboard", page: <KeybindTable actions={KEYS} bindings={keys} onChange={setKeys} compact /> },
                  { id: "quit", label: "Quit to library", icon: "grid", exit: true, run: () => setPaused(false) },
                ]}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <Button variant="secondary" onClick={() => setPaused(true)}>
                  <Icon name="pause" /> Pause
                </Button>
              </div>
            )}
          </div>
        </Demo>
      </Grid>
    </Page>
  );
}
