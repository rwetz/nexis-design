import type * as React from "react";
import {
  cn,
  DEFAULT_THEME_ID,
  Icon,
  listCommunityThemes,
  listNexisThemes,
  type Theme,
  type ThemeColors,
  useTheme,
  Switch,
  Label,
  Segmented,
} from "@nexis/design";
import { DEFAULT_VARS } from "../default-vars";
import { Demo, Page } from "../kit";

const KEBAB = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const ANSI = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

/** A theme's variables as an inline style, so a swatch can wear a theme the
 * document is not currently using. */
function scopedVars(theme: Theme, mode: "light" | "dark"): React.CSSProperties {
  const out: Record<string, string> = {};
  if (theme.id === DEFAULT_THEME_ID) {
    for (const [k, v] of Object.entries(DEFAULT_VARS[mode])) out[`--${k}`] = v;
  } else {
    const v = theme.variants[mode] ?? theme.variants.dark ?? theme.variants.light;
    const colors: ThemeColors = v?.colors ?? {};
    for (const [k, val] of Object.entries(colors)) if (val && k !== "radius") out[`--${KEBAB(k)}`] = val;
    out["--brand"] = colors.ring ?? colors.primary ?? out["--primary"];
    v?.terminal?.ansi?.forEach((c, i) => {
      out[`--terminal-ansi-${i >= 8 ? "bright-" : ""}${ANSI[i % 8]}`] = c;
    });
  }
  out["--success"] = out["--terminal-ansi-green"];
  out["--warning"] = out["--terminal-ansi-yellow"];
  out["--info"] = out["--terminal-ansi-blue"];
  return out as React.CSSProperties;
}

function Swatch({ theme, mode, active, onPick }: { theme: Theme; mode: "light" | "dark"; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      style={scopedVars(theme, mode)}
      aria-pressed={active}
      data-no-rainbow
      className={cn(
        "group/sw flex flex-col overflow-hidden rounded-2xl bg-background text-left text-foreground ring-1 ring-foreground/10 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "ring-2 ring-brand",
      )}
    >
      <div className="flex h-[92px]">
        <div className="flex w-12 flex-col gap-1.5 bg-sidebar p-2">
          <span className="h-1.5 w-6 rounded-full bg-brand" />
          <span className="h-1.5 w-7 rounded-full bg-sidebar-foreground/25" />
          <span className="h-1.5 w-5 rounded-full bg-sidebar-foreground/25" />
          <span className="h-1.5 w-6 rounded-full bg-sidebar-foreground/25" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-medium text-brand-foreground">Run</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] text-secondary-foreground">Step</span>
            <span className="ml-auto size-1.5 rounded-full bg-success" />
            <span className="size-1.5 rounded-full bg-warning" />
            <span className="size-1.5 rounded-full bg-destructive" />
          </div>
          <div className="flex-1 rounded-lg bg-card p-1.5 ring-1 ring-border">
            <svg viewBox="0 0 100 24" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <path d="M0,18 L12,14 L24,16 L36,8 L48,11 L60,5 L72,9 L84,4 L100,7" fill="none" stroke="var(--brand)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
              <path d="M0,20 L12,18 L24,19 L36,15 L48,16 L60,13 L72,15 L84,12 L100,13" fill="none" stroke="var(--muted-foreground)" strokeOpacity="0.5" strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex h-1.5">
        {ANSI.slice(1, 7).map((c) => (
          <span key={c} className="flex-1" style={{ background: `var(--terminal-ansi-${c})` }} />
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <span className="truncate text-[13px] font-medium">{theme.name}</span>
        {active && <Icon name="check" size="xs" className="text-brand" />}
        <span className="ml-auto truncate text-[10px] text-muted-foreground">{theme.author ?? (mode === "dark" ? "Dark" : "Light")}</span>
      </div>
    </button>
  );
}

export function ThemesPage() {
  const t = useTheme();
  const mode = t.resolvedMode;
  const grid = (list: Theme[]) => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {list.map((th) => (
        <Swatch key={th.id} theme={th} mode={mode} active={t.themeId === th.id} onPick={() => t.setThemeId(th.id)} />
      ))}
    </div>
  );
  return (
    <Page
      title="Themes"
      lede="Twenty-two themes, each a light and a dark variant. The seventeen Nexis themes are generated from one OKLCH lightness ramp, so they share a contrast profile and the test suite holds every one to the same floors. The five community palettes are kept as their authors made them. A theme is data — applyTheme writes it as CSS variables — so everything on this page re-tints when you pick one."
    >
      <Demo title="Appearance" meta="applies to the whole gallery" bodyClassName="flex-row flex-wrap items-center gap-6">
        <Segmented
          label="Mode"
          value={t.mode}
          onChange={t.setMode}
          segments={[
            { id: "light", icon: "theme-light", label: "Light" },
            { id: "dark", icon: "theme-dark", label: "Dark" },
            { id: "system", icon: "computer", label: "System" },
          ]}
        />
        <div className="flex items-center gap-2">
          <Switch id="hc" checked={t.highContrast} onCheckedChange={(on) => t.setContrast(on ? "high" : "standard")} />
          <Label htmlFor="hc">High contrast — on top of any theme</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="rb" checked={t.rainbowAccent} onCheckedChange={t.setRainbowAccent} />
          <Label htmlFor="rb">Rainbow hover (Nexis Default only)</Label>
        </div>
      </Demo>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Nexis</h2>
        {grid(listNexisThemes())}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Community</h2>
        {grid(listCommunityThemes())}
      </section>
    </Page>
  );
}
