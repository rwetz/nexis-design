import * as React from "react";
import {
  Button,
  cn,
  Glass,
  GLASS_GUIDE,
  GLASS_PRESET_NAMES,
  GLASS_PRESETS,
  glassRefractionSupported,
  GlassTintControl,
  Icon,
  InterfaceSizeControl,
  Kbd,
  Segmented,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  useTheme,
  type GlassBlockPattern,
  type GlassFilm,
  type GlassMaterial,
  type GlassPreset,
  type GlassRimStyle,
  type GlassTexture,
  type GlassTone,
  type IconName,
} from "@nexis/design";
import { SurfaceLayer } from "../../src/surface";
import { Demo, Grid, Page } from "../kit";

/* ── Backdrops: something worth seeing through ────────────────────────── */

type BackdropKind = "bloom" | "type" | "icons" | "stripes" | "mesh" | "garden";

const ICONS: IconName[] = ["rocket", "sparkle", "heart", "star", "brain", "globe", "cpu", "magic", "gamepad", "chart-line", "terminal", "image", "map", "theme", "flash", "layers"];

/** A busy, theme-coloured scene: colour fields, type and icons, so blur, bend and fringe all show. */
function Backdrop({ kind = "bloom", className, children }: { kind?: BackdropKind; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-xl bg-background", className)}>
      <div aria-hidden className="absolute inset-0 -z-10">
        {(kind === "bloom" || kind === "type" || kind === "icons") && (
          <>
            <div className="absolute -top-1/4 -left-1/6 size-[70%] rounded-full opacity-90 blur-2xl" style={{ background: "var(--terminal-ansi-magenta)" }} />
            <div className="absolute top-1/4 left-1/3 size-[55%] rounded-full opacity-80 blur-2xl" style={{ background: "var(--terminal-ansi-blue)" }} />
            <div className="absolute -right-1/6 -bottom-1/3 size-[75%] rounded-full opacity-90 blur-2xl" style={{ background: "var(--terminal-ansi-yellow)" }} />
            <div className="absolute top-0 right-1/6 size-[35%] rounded-full opacity-80 blur-xl" style={{ background: "var(--terminal-ansi-cyan)" }} />
          </>
        )}
        {kind === "mesh" && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(at 15% 20%, var(--terminal-ansi-magenta) 0, transparent 45%), radial-gradient(at 80% 10%, var(--terminal-ansi-cyan) 0, transparent 40%), radial-gradient(at 70% 85%, var(--terminal-ansi-green) 0, transparent 45%), radial-gradient(at 20% 90%, var(--terminal-ansi-blue) 0, transparent 40%), var(--muted)",
            }}
          />
        )}
        {kind === "garden" && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 30% 45% at 18% 30%, var(--terminal-ansi-bright-green) 0, transparent 70%), radial-gradient(ellipse 25% 35% at 62% 22%, var(--terminal-ansi-yellow) 0, transparent 70%), radial-gradient(ellipse 35% 40% at 80% 70%, var(--terminal-ansi-green) 0, transparent 70%), radial-gradient(ellipse 30% 30% at 35% 78%, var(--terminal-ansi-bright-yellow) 0, transparent 70%), repeating-linear-gradient(95deg, transparent 0 46px, var(--terminal-ansi-black) 46px 54px, transparent 54px 130px), linear-gradient(180deg, var(--terminal-ansi-cyan), var(--terminal-ansi-green))",
            }}
          />
        )}
        {kind === "stripes" && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(115deg, var(--terminal-ansi-magenta) 0 14px, var(--background) 14px 22px, var(--terminal-ansi-cyan) 22px 36px, var(--foreground) 36px 40px, var(--terminal-ansi-green) 40px 56px, var(--background) 56px 64px)",
            }}
          />
        )}
        {kind === "type" && (
          <div className="absolute inset-0 flex flex-col justify-center gap-1 px-6 leading-none font-semibold tracking-tight text-foreground select-none">
            <span className="text-display opacity-90">Liquid glass</span>
            <span className="text-2xl opacity-80">bends, blurs and catches the light</span>
            <span className="text-lg text-foreground/70">The quick brown fox jumps over the lazy dog 0123456789</span>
          </div>
        )}
        {kind === "icons" && (
          <div className="absolute inset-0 grid grid-cols-8 place-items-center gap-2 p-4 text-foreground">
            {Array.from({ length: 32 }, (_, i) => (
              <Icon key={i} name={ICONS[i % ICONS.length]} className="size-7 opacity-85" />
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── The playground ───────────────────────────────────────────────────── */

const TONES: { id: GlassTone; label: string }[] = [
  { id: "neutral", label: "Neutral" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "primary", label: "Primary" },
  { id: "brand", label: "Brand" },
  { id: "accent", label: "Accent" },
  { id: "red", label: "Red" },
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "cyan", label: "Cyan" },
  { id: "blue", label: "Blue" },
  { id: "magenta", label: "Magenta" },
  { id: "success", label: "Success" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
  { id: "destructive", label: "Destructive" },
];

function swatch(tone: GlassTone): string {
  if (tone === "neutral") return "var(--background)";
  if (tone === "light") return "var(--glass-light)";
  if (tone === "dark") return "var(--glass-dark)";
  if (["red", "yellow", "green", "cyan", "blue", "magenta"].includes(tone)) return `var(--terminal-ansi-${tone})`;
  return `var(--${tone})`;
}

function ToneSwatches({ value, onChange }: { value: GlassTone; onChange: (t: GlassTone) => void }) {
  return (
    <div role="radiogroup" aria-label="Tone" className="flex flex-wrap gap-1.5">
      {TONES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={value === t.id}
          title={t.label}
          aria-label={t.label}
          onClick={() => onChange(t.id)}
          className={cn(
            "size-6 rounded-full ring-1 ring-border transition-shadow ring-inset",
            value === t.id && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          style={{ background: swatch(t.id) }}
        />
      ))}
    </div>
  );
}

function Knob({ label, value, min = 0, max = 1, step = 0.01, unit = "", guide, onChange }: { label: string; value: number; min?: number; max?: number; step?: number; unit?: string; guide?: { good: readonly [number, number]; note: string }; onChange: (v: number) => void }) {
  const shown = unit === "%" ? `${Math.round(value * 100)}%` : `${Math.round(value * 10) / 10}${unit}`;
  const at = (v: number) => `${((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100}%`;
  const inGood = guide ? value >= guide.good[0] && value <= guide.good[1] : false;
  return (
    <div className="flex flex-col gap-1.5" title={guide?.note}>
      <div className="flex items-center justify-between text-caption">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("tabular-nums", guide && !inGood && "text-muted-foreground")}>{shown}</span>
      </div>
      <div className="relative">
        <Slider thumbLabel={label} valueText={() => shown} min={min} max={max} step={step} value={[value]} onValueChange={([v]) => v !== undefined && onChange(v)} />
        {guide && (
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-1.5 h-0.5 rounded-full bg-success"
            style={{ left: at(guide.good[0]), width: `calc(${at(guide.good[1])} - ${at(guide.good[0])})` }}
          />
        )}
      </div>
      {guide && <span className="pt-1 text-micro text-muted-foreground">{guide.note}</span>}
    </div>
  );
}

type Tweaks = Partial<GlassMaterial>;

function propsSnippet(preset: GlassPreset, t: Tweaks): string {
  const parts = [`preset="${preset}"`];
  for (const [k, v] of Object.entries(t)) {
    if (v === undefined) continue;
    parts.push(typeof v === "string" ? `${k}="${v}"` : typeof v === "boolean" ? (v ? k : `${k}={false}`) : `${k}={${Math.round(v * 100) / 100}}`);
  }
  return `<Glass ${parts.join(" ")}>`;
}

function Playground() {
  const [preset, setPreset] = React.useState<GlassPreset>("clear");
  const [t, setT] = React.useState<Tweaks>({});
  const [backdrop, setBackdrop] = React.useState<BackdropKind>("type");
  const [live, setLive] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0.5, y: 0.5 });
  const stage = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ dx: number; dy: number } | null>(null);
  const m = { ...GLASS_PRESETS[preset] } as Partial<GlassMaterial>;
  const get = <K extends keyof GlassMaterial>(k: K, fallback: GlassMaterial[K]): GlassMaterial[K] => (t[k] ?? m[k] ?? fallback) as GlassMaterial[K];
  const set = <K extends keyof GlassMaterial>(k: K) => (v: GlassMaterial[K]) => setT((p) => ({ ...p, [k]: v }));
  const refractOk = React.useMemo(() => glassRefractionSupported(), []);

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - (r.left + pos.x * r.width), dy: e.clientY - (r.top + pos.y * r.height) };
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = stage.current?.getBoundingClientRect();
    if (!drag.current || !r) return;
    setPos({
      x: Math.min(0.92, Math.max(0.08, (e.clientX - drag.current.dx - r.left) / r.width)),
      y: Math.min(0.88, Math.max(0.12, (e.clientY - drag.current.dy - r.top) / r.height)),
    });
  };
  const onUp = () => (drag.current = null);

  return (
    <Demo
      title="Playground"
      meta="drag the glass · every knob is a prop"
      bodyClassName="gap-4 lg:flex-row"
      actions={
        <Button variant="ghost" size="sm" onClick={() => setT({})}>
          <Icon name="undo" /> Reset knobs
        </Button>
      }
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Backdrop kind={backdrop} className="h-[26rem]">
          {live && <SurfaceLayer kind="aurora" opacity={0.9} className="-z-10" />}
          <div ref={stage} className="absolute inset-0">
            <Glass
              preset={preset}
              {...t}
              className="absolute flex h-40 w-72 cursor-grab touch-none flex-col justify-between rounded-[2rem] p-5 active:cursor-grabbing"
              style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, transform: "translate(-50%, -50%)" }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <div className="flex items-center gap-2">
                <Icon name="sparkle" />
                <span className="text-sm font-medium">{preset[0].toUpperCase() + preset.slice(1)}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold tabular-nums">{Math.round(get("tint", 0.22) * 100)}%</span>
                <span className="text-caption">tint</span>
              </div>
            </Glass>
          </div>
        </Backdrop>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Backdrop"
            size="sm"
            value={backdrop}
            onChange={setBackdrop}
            segments={[
              { id: "type", label: "Type" },
              { id: "icons", label: "Icons" },
              { id: "bloom", label: "Bloom" },
              { id: "mesh", label: "Mesh" },
              { id: "stripes", label: "Stripes" },
            ]}
          />
          <label className="ml-auto flex items-center gap-2 text-ui text-muted-foreground">
            <Switch checked={live} onCheckedChange={setLive} aria-label="Moving backdrop" /> Moving backdrop
          </label>
        </div>
        <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-caption text-muted-foreground">{propsSnippet(preset, t)}</code>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
        <Select value={preset} onValueChange={(v) => { setPreset(v as GlassPreset); setT({}); }}>
          <SelectTrigger aria-label="Preset" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GLASS_PRESET_NAMES.map((p) => (
              <SelectItem key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToneSwatches value={get("tone", "neutral")} onChange={set("tone")} />
        <Knob label="Tint" guide={GLASS_GUIDE.tint} value={get("tint", 0.22)} unit="%" onChange={set("tint")} />
        <Knob label="Blur" guide={GLASS_GUIDE.blur} value={get("blur", 14)} max={64} step={0.5} unit="px" onChange={set("blur")} />
        <Knob label="Saturation" guide={GLASS_GUIDE.saturate} value={get("saturate", 1.7)} max={3} step={0.05} onChange={set("saturate")} />
        <Knob label="Edge blur" guide={GLASS_GUIDE.edge} value={get("edge", 0)} max={64} step={1} unit="px" onChange={set("edge")} />
        <Knob label="Fringe" guide={GLASS_GUIDE.fringe} value={get("fringe", 0)} unit="%" onChange={set("fringe")} />
        <Knob label="Iris" value={get("iris", 0)} unit="%" onChange={set("iris")} />
        <Knob label="Sheen" guide={GLASS_GUIDE.sheen} value={get("sheen", 0)} unit="%" onChange={set("sheen")} />
        <Knob label="Rim" guide={GLASS_GUIDE.rim} value={get("rim", 0.75)} unit="%" onChange={set("rim")} />
        <Knob label={refractOk ? "Refraction" : "Refraction (Chromium only)"} guide={GLASS_GUIDE.refraction} value={get("refraction", 0)} unit="%" onChange={set("refraction")} />
        <Knob label="Dispersion" guide={GLASS_GUIDE.dispersion} value={get("dispersion", 0)} unit="%" onChange={set("dispersion")} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={get("film", "rainbow")} onValueChange={(v) => set("film")(v as GlassFilm)}>
            <SelectTrigger size="sm" aria-label="Film" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rainbow">Rainbow film</SelectItem>
              <SelectItem value="theme">Theme film</SelectItem>
              <SelectItem value="tone">Tone film</SelectItem>
            </SelectContent>
          </Select>
          <Select value={get("rimStyle", "light")} onValueChange={(v) => set("rimStyle")(v as GlassRimStyle)}>
            <SelectTrigger size="sm" aria-label="Rim" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Lit rim</SelectItem>
              <SelectItem value="film">Film rim</SelectItem>
              <SelectItem value="theme">Theme rim</SelectItem>
            </SelectContent>
          </Select>
          <Select value={get("texture", "none")} onValueChange={(v) => set("texture")(v as GlassTexture)}>
            <SelectTrigger size="sm" aria-label="Texture" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Smooth</SelectItem>
              <SelectItem value="reeded">Reeded</SelectItem>
              <SelectItem value="ripple">Ripple</SelectItem>
              <SelectItem value="frost">Frost</SelectItem>
              <SelectItem value="hammered">Hammered</SelectItem>
              <SelectItem value="seeded">Seeded</SelectItem>
              <SelectItem value="block">Glass block</SelectItem>
              <SelectItem value="dither">Dither</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-1.5 text-ui text-muted-foreground">
            <label className="flex items-center gap-2">
              <Switch size="sm" checked={get("specular", false)} onCheckedChange={set("specular")} aria-label="Specular" /> Specular
            </label>
            <label className="flex items-center gap-2">
              <Switch size="sm" checked={get("animate", false)} onCheckedChange={set("animate")} aria-label="Drift" /> Drift
            </label>
          </div>
        </div>
      </div>
    </Demo>
  );
}

/* ── Sections ─────────────────────────────────────────────────────────── */

function Tile({ preset, label, sub, kind = "type", ...rest }: { preset: GlassPreset; label: string; sub?: string; kind?: BackdropKind } & Partial<GlassMaterial>) {
  return (
    <Backdrop kind={kind} className="h-44">
      <Glass preset={preset} {...rest} className="absolute inset-x-5 inset-y-7 flex flex-col justify-end gap-0.5 rounded-3xl p-4">
        <span className="text-sm font-medium">{label}</span>
        {sub && <span className="text-caption">{sub}</span>}
      </Glass>
    </Backdrop>
  );
}

const PRESET_NOTES: Record<GlassPreset, string> = {
  clear: "no tint; only the lit, bent edge",
  regular: "toolbars, sidebars, popovers",
  frosted: "heavier, the edge blurs harder",
  fog: "deepens toward the edge",
  tinted: "mostly colour, depth behind",
  solid: "fully tinted, keeps the light",
  iridescent: "oil-slick rings, rainbow edge",
  oil: "oil on dark water",
  bubble: "no tint, all film",
  prism: "strong bend and split",
  reeded: "fluted ribs",
  ripple: "old window pane",
  frost: "sandblasted grain",
  hammered: "round dimples",
  seeded: "bubbles in the pane",
  cathedral: "rippled and coloured",
  block: "architectural glass block",
  dither: "a Bayer screen of what's behind",
};

function ClearToTinted() {
  const steps = [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 1];
  const [tone, setTone] = React.useState<GlassTone>("neutral");
  return (
    <Demo title="Clear to fully tinted" meta="tint 0 → 1 · any tone" actions={<ToneSwatches value={tone} onChange={setTone} />}>
      <Backdrop kind="icons" className="h-40">
        <div className="absolute inset-4 grid grid-cols-8 gap-3">
          {steps.map((s) => (
            <Glass key={s} preset="regular" tint={s} tone={tone} className="flex items-end justify-center rounded-2xl pb-2">
              <span className="text-caption font-medium tabular-nums">{Math.round(s * 100)}%</span>
            </Glass>
          ))}
        </div>
      </Backdrop>
    </Demo>
  );
}

function ColouredGlass() {
  const tones = TONES.filter((t) => !["neutral", "light", "dark"].includes(t.id));
  return (
    <Demo title="Coloured glass" meta="the theme's own colours · switch theme in the title bar">
      <Backdrop kind="type" className="h-auto">
        <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
          {tones.map((t) => (
            <Glass key={t.id} preset="tinted" tone={t.id} tint={0.55} className="flex h-20 flex-col justify-end rounded-2xl p-3">
              <span className="text-ui font-medium">{t.label}</span>
            </Glass>
          ))}
          {tones.slice(0, 6).map((t) => (
            <Glass key={`c-${t.id}`} preset="clear" tone={t.id} tint={0.18} sheen={0.3} film="tone" className="flex h-20 flex-col justify-end rounded-2xl p-3">
              <span className="text-ui font-medium">{t.label}, clear</span>
            </Glass>
          ))}
        </div>
      </Backdrop>
    </Demo>
  );
}

function ThemeGlass() {
  const { theme } = useTheme();
  return (
    <Demo title="Glass that follows the theme" meta={`${theme.name} · film and rim from its six hues`}>
      <Grid cols={3}>
        <Tile kind="bloom" preset="iridescent" film="theme" rimStyle="theme" label="Theme film" sub="the theme's hues as thin film" />
        <Tile kind="icons" preset="regular" tone="primary" tint={0.3} rimStyle="theme" fringe={0.4} label="Primary, theme rim" sub="its rim drifts through the theme" animate />
        <Tile kind="mesh" preset="frosted" tone="accent" film="theme" sheen={0.4} label="Accent frost" sub="the accent, frosted, with theme film" />
      </Grid>
    </Demo>
  );
}

function Effects() {
  return (
    <>
      <Demo title="Blur and edge blur" meta="blur px · then extra blur in a band at the edge">
        <Grid cols={4}>
          <Tile kind="type" preset="regular" blur={4} label="4px" sub="barely there" />
          <Tile kind="type" preset="regular" blur={16} label="16px" sub="the default" />
          <Tile kind="type" preset="regular" blur={40} label="40px" sub="more blur" />
          <Tile kind="type" preset="fog" label="Fog" sub="44px, 40px more at the edge" />
          <Tile kind="icons" preset="clear" edge={12} label="Clear + edge 12" sub="crisp centre, soft edge" />
          <Tile kind="icons" preset="clear" edge={28} edgeWidth={2.5} label="Clear + edge 28" sub="a wide soft band" />
          <Tile kind="icons" preset="regular" edge={48} edgeWidth={4} label="Regular + edge 48" sub="vignette of blur" />
          <Tile kind="icons" preset="frosted" edge={64} edgeWidth={3} tone="primary" tint={0.3} label="Primary + edge 64" sub="coloured, deep edge" />
        </Grid>
      </Demo>
      <Demo title="Iridescence on what's behind" meta="fringe: hue shifts on the icons and text under the edge · every engine">
        <Grid cols={4}>
          <Tile kind="icons" preset="clear" fringe={0.3} label="Fringe 30%" />
          <Tile kind="icons" preset="clear" fringe={0.7} label="Fringe 70%" />
          <Tile kind="type" preset="clear" fringe={1} animate label="Fringe 100%, drifting" />
          <Tile kind="type" preset="clear" fringe={0.8} edge={10} rimStyle="film" animate label="Fringe + film rim" />
        </Grid>
      </Demo>
      <Demo title="Refraction and dispersion" meta="the edge bends what's behind and splits it into a rainbow · Chromium (Windows) only; elsewhere the edge stays straight">
        <Grid cols={4}>
          <Tile kind="type" preset="clear" refraction={0.4} dispersion={0} label="Bend 40%" />
          <Tile kind="type" preset="clear" refraction={0.9} dispersion={0} label="Bend 90%" />
          <Tile kind="type" preset="clear" refraction={0.8} dispersion={0.6} label="Bend + split" />
          <Tile kind="stripes" preset="prism" label="Prism" sub="all the way" />
        </Grid>
      </Demo>
      <Demo title="Architectural glass" meta="bent on Chromium, drawn elsewhere · block and seeded draw everywhere">
        <Grid cols={4}>
          <Tile kind="type" preset="reeded" label="Reeded" sub="fluted ribs" />
          <Tile kind="type" preset="ripple" label="Ripple" sub="old window pane" />
          <Tile kind="type" preset="frost" label="Frost" sub="sandblasted" />
          <Tile kind="icons" preset="hammered" label="Hammered" sub="round dimples" />
          <Tile kind="icons" preset="seeded" label="Seeded" sub="bubbles in the pane" />
          <Tile kind="type" preset="cathedral" label="Cathedral" sub="magenta, rippled" />
          <Tile kind="type" preset="cathedral" tone="cyan" label="Cathedral" sub="cyan, rippled" />
          <Tile kind="type" preset="reeded" tone="yellow" tint={0.35} label="Amber reeded" sub="a tone on any texture" />
        </Grid>
      </Demo>
      <BlockWall />
      <Demo title="Dither" meta="what's behind, ordered through a Bayer screen · Chromium; a halftone elsewhere">
        <Grid cols={4}>
          <Tile kind="bloom" preset="dither" label="2 levels" sub="eight colours" />
          <Tile kind="bloom" preset="dither" ditherLevels={3} label="3 levels" sub="27 colours" />
          <Tile kind="type" preset="dither" ditherLevels={2} refraction={0.6} label="Dither + bend" />
          <Tile kind="mesh" preset="dither" tone="magenta" tint={0.3} label="Magenta dither" />
        </Grid>
      </Demo>
      <Demo title="Iridescence" meta="oil-slick film: soft bands shift the hue of what's behind · every engine">
        <Grid cols={4}>
          <Tile kind="icons" preset="iridescent" label="Iridescent" />
          <Tile kind="type" preset="oil" label="Oil" sub="on dark water" />
          <Tile kind="stripes" preset="bubble" label="Bubble" />
          <Tile kind="bloom" preset="clear" iris={0.7} animate label="Clear + iris" />
        </Grid>
      </Demo>
    </>
  );
}

const BLOCK_PATTERNS: { id: GlassBlockPattern; label: string }[] = [
  { id: "cloud", label: "Cloud" },
  { id: "wave", label: "Wave" },
  { id: "clear", label: "Clear" },
  { id: "diamond", label: "Diamond" },
];

function BlockWall() {
  const [pattern, setPattern] = React.useState<GlassBlockPattern>("cloud");
  const [size, setSize] = React.useState(88);
  const [grout, setGrout] = React.useState(6);
  const [tone, setTone] = React.useState<GlassTone>("neutral");
  const [tint, setTint] = React.useState(0.1);
  const [kind, setKind] = React.useState<BackdropKind>("garden");
  return (
    <Demo title="Glass block" meta="stepped frames, wavy faces, lit relief and mortar · each face bends what's behind on Chromium" bodyClassName="gap-4 lg:flex-row">
      <Backdrop kind={kind} className="h-[30rem] min-w-0 flex-1">
        <Glass preset="block" blockPattern={pattern} blockSize={size} grout={grout} tone={tone} tint={tint} className="absolute inset-0 rounded-xl" />
      </Backdrop>
      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-64">
        <Segmented label="Pattern" size="sm" value={pattern} onChange={setPattern} segments={BLOCK_PATTERNS} />
        <Knob label="Block" value={size} min={32} max={160} step={4} unit="px" onChange={setSize} />
        <Knob label="Mortar" value={grout} min={0} max={16} step={1} unit="px" onChange={setGrout} />
        <Knob label="Tint" value={tint} unit="%" onChange={setTint} />
        <ToneSwatches value={tone} onChange={setTone} />
        <Segmented
          label="Behind"
          size="sm"
          value={kind}
          onChange={setKind}
          segments={[
            { id: "garden", label: "Garden" },
            { id: "type", label: "Type" },
            { id: "icons", label: "Icons" },
            { id: "bloom", label: "Bloom" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_PATTERNS.map((p) => (
            <Backdrop key={p.id} kind="garden" className="h-24">
              <Glass preset="block" blockPattern={p.id} blockSize={44} grout={3} className="absolute inset-0 rounded-xl" />
            </Backdrop>
          ))}
        </div>
      </div>
    </Demo>
  );
}

function InContext() {
  const rows = Array.from({ length: 24 }, (_, i) => i);
  return (
    <Demo title="In an app" meta="a glass sidebar, toolbar and tab bar over scrolling content" flush>
      <Backdrop kind="mesh" className="h-[30rem] rounded-none">
        <SurfaceLayer kind="aurora" opacity={0.5} className="-z-10" />
        <div className="absolute inset-0 flex gap-3 p-3">
          <Glass as="nav" preset="regular" className="flex w-52 shrink-0 flex-col gap-1 rounded-3xl p-2" aria-label="Sidebar">
            {(["home", "library", "image", "chart-line", "settings"] as IconName[]).map((n, i) => (
              <span key={n} className={cn("flex items-center gap-2 rounded-2xl px-3 py-2 text-ui", i === 1 && "bg-foreground/10 font-medium")}>
                <Icon name={n} /> {["Home", "Library", "Pictures", "Activity", "Settings"][i]}
              </span>
            ))}
          </Glass>
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-3xl">
            <div tabIndex={0} aria-label="Library" className="absolute inset-0 overflow-y-auto px-4 pt-20 pb-24">
              <div className="grid grid-cols-3 gap-3">
                {rows.map((i) => (
                  <div key={i} className="flex h-28 flex-col justify-end rounded-2xl p-3 text-ui font-medium text-primary-foreground" style={{ background: `var(--terminal-ansi-${(["magenta", "blue", "cyan", "green", "yellow", "red"] as const)[i % 6]})` }}>
                    Item {i + 1}
                  </div>
                ))}
              </div>
            </div>
            <Glass as="header" preset="regular" edge={10} className="absolute inset-x-3 top-3 flex items-center gap-2 rounded-full px-3 py-2">
              <Icon name="search" className="text-muted-foreground" />
              <span className="flex-1 text-ui text-muted-foreground">Search the library</span>
              <Kbd>⌘K</Kbd>
            </Glass>
            <Glass preset="clear" fringe={0.35} className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5">
              {(["play", "pause", "heart", "more"] as IconName[]).map((n, i) => (
                <Glass key={n} as="button" preset={i === 0 ? "tinted" : "clear"} tone={i === 0 ? "primary" : "neutral"} shadow={false} className="grid size-10 place-items-center rounded-full" aria-label={n}>
                  <Icon name={n} />
                </Glass>
              ))}
            </Glass>
          </div>
        </div>
      </Backdrop>
    </Demo>
  );
}

function Settings() {
  return (
    <Grid cols={2}>
      <Demo title="Interface size" meta="continuous">
        <InterfaceSizeControl />
        <p className="text-caption text-muted-foreground">
          Drag it: the whole gallery scales. Resize the window in Auto and it refits. <Kbd>⌘=</Kbd> <Kbd>⌘-</Kbd> adjust, <Kbd>⌘0</Kbd> resets.
        </p>
      </Demo>
      <Demo title="Glass" meta="window glass · clear to tinted">
        <GlassTintControl />
        <p className="text-caption text-muted-foreground">Window glass turns this whole gallery (and every template) into glass over the theme's backdrop. The slider is the OS's Clear / Tinted choice. Reduced transparency, high contrast and Linux take it to opaque.</p>
      </Demo>
    </Grid>
  );
}

export function GlassPage() {
  return (
    <Page
      title="Glass"
      lede="Liquid glass in every strength, from almost nothing to fully tinted, in any of the theme's colours. Blur and edge blur, a lit rim, thin-film colour, a hue-shifting fringe on whatever sits behind the edge, and, on Chromium, real refraction that bends and splits it. One <Glass> surface, a preset and props; the user's Glass setting tints it all."
    >
      <Settings />
      <Playground />
      <Demo title="Presets" meta={`${GLASS_PRESET_NAMES.length} materials · each takes any tone`}>
        <Grid cols={4}>
          {GLASS_PRESET_NAMES.map((p, i) => (
            <Tile key={p} preset={p} label={p[0].toUpperCase() + p.slice(1)} sub={PRESET_NOTES[p]} kind={(["type", "icons", "bloom", "stripes"] as BackdropKind[])[i % 4]} />
          ))}
        </Grid>
      </Demo>
      <ClearToTinted />
      <ColouredGlass />
      <ThemeGlass />
      <Effects />
      <InContext />
    </Page>
  );
}
