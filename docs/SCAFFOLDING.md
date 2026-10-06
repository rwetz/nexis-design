# Scaffolding a New Nexis-Family App

> Step-by-step to stand up a fresh **Tauri v2 + React 19 + Tailwind v4** desktop
> app on `@nexis/design`. This guide reproduces the family's *design
> foundation*, not any app's features. Assumes `pnpm`, a Rust toolchain, and
> Node ≥ 20.
>
> **Reference consumer:** [`nexis-atlas`](https://github.com/rwetz/nexis-atlas)
> is wired up exactly as described here — when in doubt, diff against it.
>
> Building a native GPUI app instead? That is the
> [Ferrite](https://github.com/rwetz/ferrite-design) family, not this one.

Placeholders: **`myapp`** (kebab id), **`My App`** (display name),
**`app.nexis.myapp`** (reverse-DNS identifier).

> ⚠ **Keep [PITFALLS.md](PITFALLS.md) open while following this guide.** Steps
> marked ⚠ have known real-world traps.

---

## Step 0 — Prerequisites

```bash
rustup update stable
corepack enable && corepack prepare pnpm@latest --activate
```

## Step 1 — Create the Tauri + React (Vite/TS) project

```bash
pnpm create tauri-app@latest myapp --template react-ts --manager pnpm
cd myapp
```

## Step 2 — Install dependencies

```bash
# The design package (from git — there is no npm publish)
pnpm add github:rwetz/nexis-design
# Its peer dependencies
pnpm add react react-dom clsx tailwind-merge motion \
  @hugeicons/react @hugeicons/core-free-icons \
  @tauri-apps/api @tauri-apps/plugin-os
# Tailwind v4 + shadcn tooling
pnpm add -D tailwindcss @tailwindcss/vite tw-animate-css shadcn
# Fonts (Inter is pulled in by the package's fonts.css; add Mono if you show code)
pnpm add @fontsource-variable/inter @fontsource/jetbrains-mono
```

Add the cursor sync to `package.json`:

```jsonc
"scripts": { "postinstall": "nexis-design-assets" }   // copies cursors -> public/cursors/
```

> ⚠ pnpm ≥ 11 refuses to run esbuild's postinstall until you approve it in
> `pnpm-workspace.yaml` (`allowBuilds: { esbuild: true }`). See PITFALLS.md §6.

## Step 3 — Stylesheet entry

Create `src/styles/globals.css`. It must exist in the app (it is Tailwind's
entry point and what shadcn's `components.json` points at), but it should be
almost empty:

```css
@import "@nexis/design/styles/globals.css";       /* or globals.ide.css */
@source "../../node_modules/@nexis/design/src";   /* required — see below */

/* app-specific rules only below this line */
```

- `globals.css` is the generic variant; `globals.ide.css` adds xterm.js,
  CodeMirror and the terminal ANSI palette. Pick one.
- **`@source` is not optional.** Tailwind does not scan dependencies, so without
  it `WindowControls` and `ResizeHandles` render unstyled.
- Anything general enough to share belongs upstream in this package, not here.

## Step 4 — Vite

Add the plugins and alias to `vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
plugins: [react(), tailwindcss()],
resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
```

Keep the Tauri template's dev-server settings (port `1420`, `strictPort`,
`clearScreen: false`, ignore `src-tauri/**`).

## Step 5 — `index.html` anti-flash bootstrap

Before the bundle loads, apply the persisted mode so there is no light/dark
flash. The key **must** match the package's `ThemeProvider`:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("atlas-ui-theme-shadow");
      var resolved = t === "light" || t === "dark" ? t
        : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.classList.add(resolved);
      document.documentElement.style.backgroundColor = resolved === "dark" ? "#0a0a0a" : "#ffffff";
    } catch (e) {}
  })();
</script>
```

(The `atlas-` prefix is historical — see DESIGN_SYSTEM.md §9.)

## Step 6 — `main.tsx`: borderless flag + hidden-window startup

```tsx
import "@fontsource/jetbrains-mono/latin-400.css";
import "./styles/globals.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ReactDOM from "react-dom/client";
import { USE_CUSTOM_WINDOW_CONTROLS } from "@nexis/design";
import App from "./app/App";

if (USE_CUSTOM_WINDOW_CONTROLS) document.documentElement.dataset.chrome = "borderless";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// Window starts hidden; show after first paint. setTimeout, not rAF (rAF is
// throttled while hidden). The second call is a safety net.
const show = () => getCurrentWindow().show().catch(console.error);
setTimeout(show, 50);
setTimeout(show, 500);
```

## Step 7 — Tauri window & chrome ⚠

In `src-tauri/tauri.conf.json`:

```jsonc
"app": {
  "windows": [{
    "title": "My App",
    "width": 1280, "height": 800, "minWidth": 640, "minHeight": 420,
    "titleBarStyle": "Overlay",   // macOS overlay traffic lights
    "hiddenTitle": true,
    "visible": false              // start hidden → no pre-paint flash
  }]
}
```

Then **two** platform overrides, each a full copy of the window entry plus
`"label": "main", "decorations": false, "transparent": true, "shadow": false`:

- `src-tauri/tauri.windows.conf.json`
- `src-tauri/tauri.linux.conf.json` — ⚠ without it Linux gets double chrome.
  The platform `windows` array *replaces* the base one, so repeat the size
  fields. See PITFALLS.md §1.

> ⚠ **NVIDIA + Wayland** crashes at first paint unless you force Mesa's EGL —
> copy the `run()` snippet from PITFALLS.md §2 into `lib.rs`.

Capabilities (`src-tauri/capabilities/default.json`) — the chrome needs:

```
core:window:allow-start-dragging        core:window:allow-start-resize-dragging
core:window:allow-minimize              core:window:allow-toggle-maximize
core:window:allow-internal-toggle-maximize
core:window:allow-is-maximized          core:window:allow-close
core:window:allow-show                  core:window:allow-set-focus
core:event:allow-listen                 core:event:allow-unlisten
os:default
```

Register `tauri_plugin_os::init()` in `lib.rs` and add the crate to
`Cargo.toml`.

## Step 8 — Icons and logo

Each app owns its mark (see ASSETS.md):

```bash
pnpm tauri icon path/to/icon-source.png   # writes src-tauri/icons/*
mkdir dist                                 # generate_context! needs it to exist
```

⚠ Both must exist before the first `cargo check`. If you copied an NSIS block
from another app, delete any `installerHooks` line — see PITFALLS.md §7.

## Step 9 — Compose the root

```tsx
import { MotionConfig } from "motion/react";
import { ThemeProvider, WindowControls, ResizeHandles, IS_MAC, cn } from "@nexis/design";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.2 }}>
        <TooltipProvider>
          <div className="flex h-full flex-col">
            <header data-tauri-drag-region
              className={cn("flex h-10 items-center gap-2 border-b border-border/60 bg-card select-none",
                IS_MAC ? "pl-20" : "pl-3")}>
              {/* <AppLogo className="size-5" /> + title/tabs */}
              <div data-tauri-drag-region className="flex-1" />
              <WindowControls />
            </header>
            <main className="zoom-content flex-1 min-h-0">{/* content */}</main>
          </div>
          <ResizeHandles />
          <Toaster />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
```

`ResizeHandles` and the Linux View-Transition gate (PITFALLS.md §3–4) are
already handled inside the package — just mount it.

## Step 10 — shadcn components

shadcn components are **per-app** by design (you own the copy). Initialise
shadcn pointing at `src/styles/globals.css`, then:

```bash
pnpm dlx shadcn@latest add button dropdown-menu tooltip sonner scroll-area
```

Follow DESIGN_SYSTEM.md §8 for variant conventions.

## Step 11 — Run it

```bash
pnpm tauri dev
pnpm tauri build
```

---

## Reference project layout

```
myapp/
├─ index.html                  # anti-flash theme bootstrap
├─ vite.config.ts              # react + tailwind, @ alias
├─ components.json             # shadcn config → src/styles/globals.css
├─ package.json                # @nexis/design + postinstall: nexis-design-assets
├─ public/
│  ├─ logo.png
│  └─ cursors/                 # synced from the package — gitignore it
├─ src/
│  ├─ main.tsx                 # fonts, borderless flag, hidden-window startup
│  ├─ app/App.tsx              # provider stack + shell
│  ├─ components/
│  │  ├─ ui/                   # shadcn components (per-app)
│  │  └─ AppLogo.tsx
│  ├─ modules/<feature>/       # components + Zustand store + index.ts barrel
│  └─ styles/globals.css       # @import the package + @source
└─ src-tauri/
   ├─ tauri.conf.json          # overlay title, hidden window
   ├─ tauri.windows.conf.json  # decorations:false, transparent:true
   ├─ tauri.linux.conf.json    # same, plus size fields
   ├─ capabilities/default.json
   ├─ icons/                   # generated by `tauri icon`
   └─ src/lib.rs               # os plugin + NVIDIA EGL guard
```

---

## Design "definition of done"

- [ ] Light/dark toggle crossfades on macOS/Windows, hard-cuts on Linux, and
      **does not crash**; no flash on launch.
- [ ] Borderless rounded window on Win/Linux; native on macOS; drag works.
- [ ] Corners are actually **transparent** — check on NVIDIA/Wayland.
- [ ] Window edges show resize cursors and drag-resize.
- [ ] Custom cursors visible (arrow, pointer on buttons, resize on splitters).
- [ ] Inter for UI; JetBrains Mono for any mono text.
- [ ] `--brand` coral on the primary CTA / active state only.
- [ ] `pnpm tauri build` produces a bundle with correct icons + identifier.
- [ ] Reduced-motion OS setting disables animations.
