# Liquid glass

A glass material for the surfaces that float over content: a toolbar over
a scrolling list, a sidebar over a wallpaper, a now-playing bar, a hero
card. See every preset and effect live in the gallery's **Glass** page
(`pnpm dev`, then `#/glass`). Rules: RULES R6.9.

```tsx
import { Glass } from "@nexis/design";

<Glass preset="regular" className="flex items-center gap-2 rounded-full px-3 py-2">…</Glass>
<Glass preset="tinted" tone="primary" className="rounded-2xl p-4">…</Glass>
<Glass preset="clear" refraction={1} dispersion={1} edge={16}>…</Glass>
<Glass as="button" preset="clear" aria-label="Play" className="grid size-10 place-items-center rounded-full">…</Glass>
```

`<Glass>` renders `as` (a `div` by default) and lays out its children
exactly as that element would; `className` styles it as usual (size,
position, padding, radius, flex). The glass is drawn in layers beside the
children, so nothing else changes.

## Presets

From nearly nothing to fully tinted, then the effects. Every preset takes
any tone, and any prop overrides it.

| Preset | What it is | Use it for |
|---|---|---|
| `clear` | No tint, almost no blur; only the lit, bent edge says it's there | floating controls over media: a player bar, a tab bar, a camera's buttons |
| `regular` | The everyday pane | toolbars over scrolling content, sidebars, popovers |
| `frosted` | More blur and body; the edge blurs harder | a sidebar over a busy wallpaper, a sheet over content |
| `fog` | Heavy blur that deepens toward the edge | a scrim behind a dialog, a privacy pane |
| `tinted` | Mostly colour, depth behind | a coloured toolbar, a primary action surface |
| `solid` | Fully tinted; keeps the lit edge | where glass must read as a solid control |
| `iridescent` | Oil-slick film, a rainbow edge, drifting | one showpiece: a hero, a launch card |
| `oil` | Oil on dark water | a dark hero, a now-playing card |
| `bubble` | No tint, no blur, all film | a playful badge or a floating orb |
| `prism` | A strong bend and rainbow split | an effect, a splash; never under text |
| `reeded` | Fluted glass: vertical ribs | a partition: an inspector, a side panel, a divider between areas |
| `ripple` | An old window pane | a decorative pane over art |
| `frost` | Sandblasted grain | a quiet panel that still says glass |
| `hammered` | Round dimples | a decorative pane, a card back |
| `seeded` | Bubbles caught in the pane | a warm, hand-made surface |
| `cathedral` | Rippled and coloured | a coloured accent pane; give it a hue |
| `block` | Architectural glass block, mortar and bevels | a wall: a launcher's backdrop panel, a hero, a lock screen |
| `dither` | What's behind, ordered through a Bayer screen | a retro or Nexis-art pane over imagery |

## Props

| Prop | Range | What it does |
|---|---|---|
| `tint` | 0 … 1 | How much of the tone covers what's behind. The user's Glass setting pulls it toward 1 |
| `tone` | token, hue or colour | `neutral` (the background), `light`, `dark`, `primary`, `brand`, `accent`, `secondary`, `muted`, `card`, `popover`, `success`, `warning`, `info`, `destructive`, `chart-1`…`5`, the theme's six hues `red` `yellow` `green` `cyan` `blue` `magenta`, or any CSS colour. Once the tint carries the text (0.55+), tones with a foreground token set the text colour |
| `blur` | px | Backdrop blur. Clear glass wants under 1px: a 2.5px blur already smears type |
| `saturate`, `brightness` | × | Of what's behind |
| `edge`, `edgeWidth` | px, rem | Extra blur in a band round the edge, and how far in it reaches |
| `fringe` | 0 … 1 | A band at the edge where what's behind shifts hue: iridescence on the icons and text under it. Every engine |
| `iris` | 0 … 1 | Oil-slick film: soft bands where what's behind shifts hue. Every engine |
| `sheen`, `film`, `sheenFill` | 0 … 1 | Thin-film colour over the pane: `rainbow`, `theme` (its six hues) or `tone`; toward the edges, or over the whole pane |
| `rim`, `rimStyle` | 0 … 1 | The lit edge: `light`, `film` or `theme` |
| `refraction` | 0 … 1 | The edge bends what's behind toward the centre, like a convex rim. Chromium only |
| `dispersion` | 0 … 1 | The bend splits red, green and blue apart: a rainbow at the edge. Chromium only |
| `texture` | | `reeded`, `ripple`, `frost`, `hammered`, `seeded`, `block`, `dither`. Bent through on Chromium, drawn as light elsewhere; block's mortar and seeded's bubbles draw everywhere |
| `blockSize` | px | One glass block (`texture="block"`), 40 to 72 reads as architecture |
| `ditherLevels` | 2 … 8 | Colours per channel for `dither`: 2 is eight colours, 3 is 27 |
| `specular` | | A highlight that follows the pointer |
| `animate` | | The film, fringe and coloured rim drift through their hues (held still under reduced motion) |
| `legible` | | A soft halo of the glass's colour round text, for clear glass over busy content |
| `shadow` | | The drop shadow under the pane |

The pure pieces are exported too: `resolveGlass(preset, overrides)`,
`glassVars(material)`, `glassToneColor`, `glassToneForeground`,
`GLASS_PRESETS`, `GLASS_PRESET_NAMES`, `glassRefractionSupported()`.

## Which settings are good

`GLASS_GUIDE` holds these as numbers (the gallery's playground marks them
on each slider):

| Knob | Good for everyday | Beyond that |
|---|---|---|
| Tint | 15 to 35% | 0 to 5% is clear; 60 to 80% tinted; 100% solid |
| Blur | 8 to 24px | under 1px for clear (2px already smears type); 30+ frosted |
| Saturation | 1.3 to 1.8 | past 2 colours go neon |
| Edge blur | 8 to 32px | 0 for a crisp pane; 40+ is fog |
| Fringe | 20 to 50% | showpieces only |
| Sheen | 30 to 60% | under 30% barely reads; over 70% hides what's behind |
| Iris | 40 to 80% | showpieces only |
| Rim | 50 to 90% | keep it high on clear glass: it's the only thing saying glass |
| Refraction | 30 to 70% | past 80% text behind the edge gets hard to read |
| Dispersion | 20 to 60% | 100% is a prism, for effect only |

Three things decide most of it:

1. **Text on it?** Then tint 15% or more, or `legible`, and no `prism`,
   `ripple`, `hammered`, `block` or `dither` under the text itself (put the
   text on a plain pane beside them).
2. **Over what?** Glass over flat colour shows nothing; it needs something
   behind it (content scrolling under a toolbar, art, a wallpaper,
   `<GlassBackdrop>`).
3. **How many?** One showpiece per screen (`iridescent`, `oil`, `prism`,
   `cathedral`, `block`, a film rim). Everyday chrome is `clear`, `regular`
   or `frosted`.

## Window glass (glass chrome)

The whole window as glass: `useTheme().glassChrome` is `off`, `clear`,
`regular`, `frosted` or `tinted`. On, the shell (the template's root,
marked `data-app-shell`) becomes a translucent sheet over
`<GlassBackdrop>`; the title bar, sidebar and status bar join that sheet
with lit hairlines; and menus, popovers, selects, dialogs and sheets become
real blurred glass over the content. Cards stay solid, so data reads as it
did. Every template carries `data-app-shell` and a `<GlassBackdrop />`
(drawn only while window glass is on).

- **Scaffold with it on:** `scripts/new-app.sh nexis-<thing> <template>
  --glass regular` sets `defaultGlassChrome` on the app's `ThemeProvider`.
  The user can still change or turn it off in Settings, Glass.
- **The backdrop:** `<GlassBackdrop kind="mesh" />` (the theme's six hues,
  soft; the default), `kind="bloom"` (soft blobs), or `kind="image"
  src={…}` (blurred). A `SurfaceLayer` (aurora, particles) behind the shell
  works too.
- **An app shell of your own** marks its root `data-app-shell` and renders
  `<GlassBackdrop />` inside it.
- The shell never takes a `backdrop-filter` (it would blind every glass
  surface inside it); the backdrop is soft already.

| App | Window glass |
|---|---|
| Media, launchers, players, galleries, a creative tool's canvas chrome | `regular` or `frosted` |
| Showcase, onboarding, a wizard, a lock or splash screen | `clear` or `regular`, with one showpiece |
| Dashboards and monitors | `off`, or `tinted` if the user asks for glass |
| Editors, IDEs, consoles, data-dense tables | `off` (dense text wants a still, opaque ground) |

## Engines

| | Windows (WebView2) | macOS (WKWebView) | Linux (WebKitGTK) |
|---|---|---|---|
| Blur, tint, edge blur, fringe, film, rim, specular | yes | yes | no blur; opaque |
| Refraction, dispersion, bent textures | yes | no: straight edge, drawn textures | no |

Refraction is an SVG filter named in `backdrop-filter`, built per surface
at its measured size. WebKit can't take `url()` there, and a declaration it
can't parse would drop the blur as well, so `<Glass>` only adds it where
`glassRefractionSupported()` says so. Linux drops every backdrop filter
(WebKitGTK repaints them on every scroll) and shows glass at 92% tint.

## The Glass setting

`useTheme().glassTint` (0 … 1) moves every glass surface toward fully
tinted, like the OS's own Clear / Tinted choice. Settings shows it as
`<GlassTintControl />` under Appearance, beside Interface size; the
settings template has it. Stored under `<storageKey>:glass-tint`.
Reduced transparency (the OS setting), high contrast and Linux take glass
to opaque whatever it says.

## One-element glass

Where `<Glass>`'s layers can't go (a Radix popover's content, a toast), the
`.glass-surface` class puts the pane and a lit edge on the element itself,
with `.glass-clear`, `.glass-regular`, `.glass-frosted`, `.glass-tinted`
or `.glass-solid` for the strength, and `--glass-color` for the tone. It
has no edge blur, fringe or refraction.

## How it's built

`src/styles/glass.css`. A surface is one element, `.nexis-glass`, with its
decoration in absolutely placed layers beside its content:

| Layer | |
|---|---|
| `.nexis-glass-pane` | The backdrop: blur, saturation, tint, light from above, refraction |
| `.nexis-glass-edge` | More blur in a band round the edge |
| `.nexis-glass-fringe` | A band where what's behind shifts hue |
| `.nexis-glass-sheen` | Thin-film colour |
| `.nexis-glass-specular` | The pointer highlight |
| `.nexis-glass-rim` | The lit edge |

Two things it learned the hard way:

- **Layers are siblings, never nested.** An element with a backdrop filter
  is a backdrop root: a blurred child of a blurred parent would blur the
  parent's own (empty) content, not the page.
- **No `mix-blend-mode` on any layer.** A blending sibling puts the whole
  surface in its own render pass, and Chromium's backdrop filters then see
  nothing behind it: every blur and bend on the surface silently goes.
  Film and highlights are plain alpha. A test checks.

Everything sits in `@layer components`, so Tailwind utilities on a glass
element (`absolute`, `inset-*`, `rounded-*`) win over its defaults.
