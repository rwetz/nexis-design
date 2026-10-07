# Scaffolding a New Nexis-Family App

> A fresh **Tauri v2 + React 19 + Tailwind v4** desktop app on
> `@nexis/design`. The fast path is one command; the steps below are what it
> does, for when you are wiring an existing app or need to know why.
>
> Building a native GPUI app instead? That is
> [Ferrite](https://github.com/rwetz/ferrite-design), not this family.

> ⚠ **Keep [PITFALLS.md](PITFALLS.md) open.** Steps marked ⚠ have known
> real-world traps.

---

## The fast path

```bash
# from a checkout of nexis-design
scripts/new-app.sh nexis-<thing> <template> [dir]
cd ../nexis-<thing>
pnpm install
pnpm tauri icon src-tauri/icons/icon.png     # replace the placeholder first
pnpm tauri dev
```

Templates: `dashboard`, `workbench`, `settings`, `explorer`, `console`,
`wizard`, `minimal` — see them all with `pnpm dev` in this repo, and pick by
the shape of the app ([AGENTS.md §1](../AGENTS.md#1-start-an-app)).

The script pins `@nexis/design` to the commit your checkout is on
(`github:rwetz/nexis-design#<rev>`) — the rev must be pushed for the install
to resolve. `NEXIS_PATH=$(pwd)` installs from the local checkout instead
(as a copy — PITFALLS §10).

What you get:

```
nexis-<thing>/
├─ index.html                  # no-flash mode bootstrap
├─ package.json                # @nexis/design + its peers; postinstall syncs cursors
├─ pnpm-workspace.yaml         # pnpm 11 build approval (PITFALLS §6)
├─ vite.config.ts              # react + tailwind; Tauri's fixed port
├─ AGENTS.md                   # points coding agents at this package's rules
├─ public/cursors/             # synced by postinstall — gitignored
├─ src/
│  ├─ main.tsx                 # providers, borderless flag, show-after-paint
│  ├─ App.tsx                  # the template
│  ├─ AppLogo.tsx              # your mark — make it yours
│  └─ styles.css               # @import "@nexis/design/styles/globals.css"
└─ src-tauri/
   ├─ tauri.conf.json          # overlay title bar (macOS), hidden window
   ├─ tauri.windows.conf.json  # undecorated + transparent
   ├─ tauri.linux.conf.json    # same, sizes repeated (PITFALLS §1)
   ├─ capabilities/default.json
   ├─ icons/icon.png           # placeholder source for `tauri icon`
   └─ src/lib.rs               # os plugin, NVIDIA/Wayland guard, GTK_CSD
```

---

## Step 0 — Prerequisites

```bash
rustup update stable
corepack enable && corepack prepare pnpm@latest --activate
```

Plus the [Tauri platform prerequisites](https://tauri.app/start/prerequisites/)
(WebKitGTK on Linux, WebView2 on Windows).

## Step 1 — The project

`pnpm create tauri-app@latest myapp --template react-ts --manager pnpm` gives
you a working Tauri app to wire by hand, or start from `new-app.sh`.

## Step 2 — Dependencies ⚠

```bash
pnpm add github:rwetz/nexis-design#<rev>
# its peers (see package.json "peerDependencies" for versions)
pnpm add react react-dom radix-ui class-variance-authority clsx tailwind-merge \
  @phosphor-icons/react motion cmdk sonner react-resizable-panels @tanstack/react-virtual \
  @fontsource-variable/geist @fontsource-variable/geist-mono @fontsource-variable/space-grotesk \
  @tauri-apps/api @tauri-apps/plugin-os tailwindcss tw-animate-css shadcn
pnpm add -D @tailwindcss/vite @vitejs/plugin-react
```

```jsonc
"scripts": { "postinstall": "nexis-design-assets" }   // cursors -> public/cursors/
```

⚠ pnpm ≥ 11 needs `allowBuilds: { esbuild: true }` in `pnpm-workspace.yaml`
(PITFALLS §6). **Pin a rev** — an unpinned `github:` dependency moves when
this repo's `main` does.

## Step 3 — Stylesheet

```css
/* src/styles.css */
@import "@nexis/design/styles/globals.css";   /* or globals.ide.css with a terminal/editor */
```

That is all. The package's stylesheet scans its own components (PITFALLS §8)
and loads the fonts; Tailwind scans your `src/` itself.

## Step 4 — Vite

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: { port: 1420, strictPort: true, watch: { ignored: ["**/src-tauri/**"] } },
});
```

## Step 5 — `index.html` no-flash bootstrap

Before the bundle loads, put the right mode class on `<html>`. The key is
`ThemeProvider`'s `storageKey` + `":mode"`:

```html
<script>
  (function () {
    try {
      var m = localStorage.getItem("myapp:mode") || "system";
      var dark = m === "dark" || (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.add(dark ? "dark" : "light");
    } catch (e) {}
  })();
</script>
```

## Step 6 — `main.tsx`

```tsx
import "./styles.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { domAnimation, LazyMotion } from "motion/react";
import { createRoot } from "react-dom/client";
import { IN_TAURI, ThemeProvider, Toaster, TooltipProvider, USE_CUSTOM_WINDOW_CONTROLS } from "@nexis/design";
import App from "./App";

if (USE_CUSTOM_WINDOW_CONTROLS) document.documentElement.dataset.chrome = "borderless";

createRoot(document.getElementById("root")!).render(
  <LazyMotion features={domAnimation} strict>
    <ThemeProvider storageKey="myapp">
      <TooltipProvider delayDuration={300}>
        <App />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  </LazyMotion>,
);

// Hidden until painted. setTimeout, not rAF — rAF does not fire while hidden.
if (IN_TAURI) {
  const show = () => getCurrentWindow().show().catch(console.error);
  setTimeout(show, 50);
  setTimeout(show, 500);
}
```

`LazyMotion strict` makes a stray `motion.div` throw in development; the
package uses `m` only.

## Step 7 — Tauri window & chrome ⚠

`tauri.conf.json` — the base (macOS) window:

```jsonc
"windows": [{ "label": "main", "title": "My App", "width": 1280, "height": 820,
  "minWidth": 720, "minHeight": 480, "visible": false,
  "titleBarStyle": "Overlay", "hiddenTitle": true }]
```

`tauri.windows.conf.json` **and** `tauri.linux.conf.json` — each a full copy
of the window entry plus `"decorations": false, "transparent": true,
"shadow": false`. ⚠ The platform `windows` array *replaces* the base one; repeat
the sizes. Without the Linux file you get double chrome (PITFALLS §1).

⚠ NVIDIA + Wayland crashes at first paint unless Mesa's EGL is forced —
the `lib.rs` from `new-app.sh` does it (PITFALLS §2). It also sets `GTK_CSD=1`
so KWin does not draw a second title bar.

Capabilities — what the chrome needs:

```
core:default
core:window:allow-start-dragging        core:window:allow-start-resize-dragging
core:window:allow-minimize              core:window:allow-toggle-maximize
core:window:allow-internal-toggle-maximize
core:window:allow-is-maximized          core:window:allow-is-fullscreen
core:window:allow-close                 core:window:allow-show
core:window:allow-set-focus             os:default
```

Register `tauri_plugin_os::init()` — `IN_TAURI`, `IS_MAC` and
`USE_CUSTOM_WINDOW_CONTROLS` come from it.

## Step 8 — Icons and logo ⚠

```bash
pnpm tauri icon path/to/your-1024.png
```

⚠ Before the first `cargo check`: `generate_context!` fails if the files in
`bundle.icon` (or `../dist`) do not exist (PITFALLS §7). Draw `AppLogo.tsx` in
the family grammar — 48×48, `rx=12` tile in `currentColor`, the mark in
`var(--background)` (PITFALLS §5).

## Step 9 — Compose the root

```tsx
import { CommandPalette, SidebarNav, StatusBar, StatusItem, TitleBar,
         useCommandPaletteShortcut, WindowResizeEdges } from "@nexis/design";
import { AppLogo } from "./AppLogo";

export default function App() {
  const [palette, setPalette] = useState(false);
  useCommandPaletteShortcut(() => setPalette((o) => !o));   // Mod+Shift+P
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />                                    {/* Linux only, self-gating */}
      <TitleBar brand={<AppLogo className="size-[18px] text-brand" />} title="My App" />
      <div className="flex min-h-0 flex-1">
        <SidebarNav … />
        <main className="zoom-content min-w-0 flex-1">…</main>
      </div>
      <StatusBar left={<StatusItem>Ready</StatusItem>} />
      <CommandPalette open={palette} onOpenChange={setPalette} commands={[…]} />
    </div>
  );
}
```

## Step 10 — Components

Import them from the package. Since 0.2 the shared components live here, so
a fix lands in every app at once (the 0.1 reasoning, "shadcn wants you to own
the copy", lost to four apps drifting four ways). When an app genuinely needs
a variant nobody else does, wrap the package component in the app — do not
copy it. If two apps need it, it belongs upstream.

## Step 11 — Run it

```bash
pnpm tauri dev
pnpm tauri build
```

---

## Definition of done

- [ ] Every screen checked in light **and** dark, one other theme, and high
      contrast.
- [ ] Light/dark switch crossfades on macOS/Windows, hard-cuts on Linux, and
      does not crash; no flash on launch.
- [ ] Borderless rounded window on Windows/Linux, native on macOS; drag works;
      corners actually transparent (check NVIDIA/Wayland).
- [ ] Linux edges show resize cursors and resize.
- [ ] Custom cursors visible (arrow, pointer on buttons, resize on splitters).
- [ ] `--brand` only on the primary action, the selection and live progress.
- [ ] Every action in the command palette.
- [ ] No raw colours, no emoji, no direct icon-vendor import.
- [ ] Reduced-motion OS setting stops the motion.
- [ ] `pnpm tauri build` produces a bundle with your icons and identifier.
