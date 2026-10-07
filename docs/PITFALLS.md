# Pitfalls — field notes from real scaffolds and from building this package

> Every entry here bit for real while standing up an app in this family
> (first recorded casualty: `nexis-dev-dashboard`, since merged into
> `nexis-atlas`, 2026-07-13, CachyOS + KDE Wayland + NVIDIA RTX 4070 SUPER,
> webkit2gtk 2.52). Read this **before** SCAFFOLDING.md's step list.
>
> Entries marked **✅ handled in the package** are already fixed inside
> `@nexis/design`; they stay here so nobody "simplifies" the fix away.

---

## 1. Linux borderless chrome needs its own platform override (Step 7)

If an app ships only `tauri.windows.conf.json`, on Linux the main window
therefore keeps `decorations: true` and is opaque — while `platform.ts` still
reports `USE_CUSTOM_WINDOW_CONTROLS = true`, so you get **double chrome**
(native titlebar + our controls) and no rounded corners.

**Fix:** also create `src-tauri/tauri.linux.conf.json`, mirroring the Windows
override (`label: "main"`, `decorations: false`, `transparent: true`,
`shadow: false`, `visible: false`) **plus the window size/min-size fields** —
the platform config's `windows` array *replaces* the base one wholesale, it is
not deep-merged per-field.

## 2. NVIDIA + Wayland: WebKitGTK's DMA-BUF renderer crashes the app (Step 7)

On NVIDIA under Wayland (seen: RTX 4070 SUPER, webkit2gtk 2.52, KDE), the app
dies at first paint with:

```
Gdk-Message: Error 71 (Protocol error) dispatching to Wayland display.
```

The tempting workarounds all fail in different ways — **verified empirically,
do not re-litigate**:

| Attempt | Result |
|---|---|
| `WEBKIT_DISABLE_DMABUF_RENDERER=1` | stable, but **kills window alpha** → black rectangle behind the 12px rounded corners |
| `GDK_BACKEND=x11` + DMA-BUF on | window fully invisible |
| `GDK_BACKEND=x11` + DMA-BUF off | stable but opaque (same black corners) |
| `LIBGL_ALWAYS_SOFTWARE=1` | still crashes (GDK's EGL is still NVIDIA) |
| `HardwareAccelerationPolicy::Never` via `with_webview` | **paints nothing** on webkit 2.52 (CPU path removed) |
| `__EGL_VENDOR_LIBRARY_FILENAMES=<mesa json>` | ✅ stable **and** alpha-correct (llvmpipe) |

**Fix (copy this):** in `lib.rs::run()`, *before* building the Tauri app:

```rust
#[cfg(target_os = "linux")]
fn is_nvidia() -> bool {
    std::path::Path::new("/proc/driver/nvidia/version").exists()
}

// in run(), first thing:
#[cfg(target_os = "linux")]
if is_nvidia() && std::env::var_os("MYAPP_KEEP_HW_ACCEL").is_none() {
    const MESA: &str = "/usr/share/glvnd/egl_vendor.d/50_mesa.json";
    if std::env::var_os("__EGL_VENDOR_LIBRARY_FILENAMES").is_none()
        && std::path::Path::new(MESA).exists()
    {
        std::env::set_var("__EGL_VENDOR_LIBRARY_FILENAMES", MESA);
    } else if std::env::var_os("__EGL_VENDOR_LIBRARY_FILENAMES").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1"); // alive > pretty
    }
}
```

Cost: the webview renders on llvmpipe (CPU) on NVIDIA machines. Fine for
dashboard-class UI; profile before shipping anything animation-heavy, and
leave the `MYAPP_KEEP_HW_ACCEL` escape hatch so users can re-test as
webkit/NVIDIA fix things.

## 3. View Transitions crossfade wedges/crashes WebKitGTK — ✅ handled in the package

`ThemeProvider.withViewTransition` uses `document.startViewTransition` for the
theme crossfade. WebKitGTK 2.52 **exposes the API but cannot survive it** on a
full-window repaint: the web process crashes (user-visible: "app crashes when
I change theme") or wedges into a blank white webview.

**Fix:** gate the crossfade off on Linux — hard cut instead. The package's
`withViewTransition` (`src/theme/ThemeProvider.tsx`) includes `IS_LINUX` in its
early-out condition. macOS/Windows WebViews
keep the crossfade. Re-test on webkit2gtk upgrades.

## 4. Borderless windows have no edge resize cursors — ✅ handled in the package

With `decorations: false` the webview owns every pixel, so hovering a window
edge shows the default arrow — resize affordance is invisible (KWin still
resizes, users just can't discover it).

**Fix:** render an invisible resize-handle overlay: 8 absolutely-positioned
strips (4 edges ~5px, 4 corners ~14px) inside a `pointer-events-none` fixed
wrapper, each `pointer-events-auto` with the matching `.cursor-*-resize`
utility (the custom cursor set already covers them) and
`onMouseDown → getCurrentWindow().startResizeDragging(direction)`.
Requires the `core:window:allow-start-resize-dragging` permission. Hide the
overlay while maximized. This is the package's `<WindowResizeEdges />`
(`src/components/WindowResizeEdges.tsx`; `ResizeHandles` is the 0.1 alias) —
mount it; don't rewrite it.

It is **Linux-only**, and that matters: Windows gives an undecorated window
native `WM_NCHITTEST` resize borders, so 0.1's version (which also ran on
Windows) put a second, competing set of hit strips on top of the OS's own.
It mounts outside any `.zoom-content` (app zoom would scale the strips off
the window edge) and only inside Tauri (`IN_TAURI`).

## 5. White-on-`currentColor` logos vanish in dark mode (Step 8)

The old blueprint's `AppLogo.tsx` filled its tile with `currentColor` (`text-foreground`) and drew
the marks in **hardcoded white**. In dark mode the tile *is* near-white, so
the mark renders as a blank square in the header.

**Fix for new apps:** draw the marks with `fill="var(--background)"` so they
punch through the tile in both modes (colored accents are fine as fixed hex).
When designing a new app's mark, keep the family grammar: 48×48 viewBox,
`rx=12` tile, flat geometric marks.

## 6. pnpm ≥ 11 blocks dependency build scripts (Step 2)

First `pnpm install` ends with `Ignored build scripts: esbuild…` and creates a
`pnpm-workspace.yaml` stub asking for decisions. Until you approve, esbuild's
binary isn't installed and `vite` fails cryptically. The old
`package.json » pnpm.onlyBuiltDependencies` field is **ignored** by pnpm 11.

**Fix:** answer in `pnpm-workspace.yaml` (`scripts/new-app.sh` writes it,
and also sets `onlyBuiltDependencies` for pnpm 10):

```yaml
allowBuilds:
  esbuild: true
```

## 7. `tauri.conf.json` references you must prune (Step 7/8)

Nexis's `bundle.windows.nsis` block references
`"installerHooks": "./installer-hooks.nsh"` — a Nexis-only file. If you copy
that block, Windows builds fail until you delete the line (and point
`headerImage` at your own image, or drop it). Also remember `tauri icon` must run before the first
`cargo check`: `generate_context!` fails if the icon files listed in
`bundle.icon` don't exist yet (as does a missing `../dist` — `mkdir dist`).

## 8. Tailwind does not see the package's classes — ✅ handled in the package

Tailwind v4 scans your project, not `node_modules`. In 0.1 every app had to
add `@source "../../node_modules/@nexis/design/src"` or every package
component rendered unstyled — and the path depended on where the app's
stylesheet sat.

**Fix:** `globals.css` carries `@source "../";` — relative to *itself* — so
importing it is enough wherever it is imported from. Tripwired in
`test/design-rules.test.ts`. Corollary for this repo: the gallery's own
stylesheet adds `@source "../templates"`, because Vite's root is `gallery/`
and templates live outside it; a class used only in a template is otherwise
silently missing (the first template screenshots had no padding).

## 9. Editors under CSS zoom put clicks on the wrong line

CodeMirror and ProseMirror map clicks through caret-from-point APIs that
WebKitGTK does not correct for an ancestor `zoom`: at zoom 1.4 a click on
line 13 lands on ~19. `globals.ide.css` makes `.cm-editor` and `.ProseMirror`
zoom-exempt (net scale 1.0); scale the editor's font size by `--app-zoom`
instead. (Nexis AGENTS.md pitfall 15.)

## 10. `link:` to a local checkout typechecks against two Reacts

`pnpm add link:../nexis-design` symlinks the package, which brings its own
`node_modules` — so the app sees two `@types/react` and `tsc` fails with
"Two different types with this name exist, but they are unrelated."

**Fix:** use `file:` for a local checkout (`NEXIS_PATH=… scripts/new-app.sh`
does), and re-run `pnpm install` after changing the package. Installs from
git are unaffected.

## 11. `color-mix(in oklch, …)` toward a grey swings the hue

Mixing coral (hue 35) into a cool grey (hue ~220) in OKLCH interpolates the
*hue* along the shorter arc — straight through purple. The first heatmap
rendered magenta cells on the default theme.

**Fix:** mix toward greys and other low-chroma colours in **`oklab`**; use
`oklch` only between two saturated colours of similar hue, or toward
`transparent`.

## 12. Tauri APIs throw outside Tauri

`getCurrentWindow()` reads `window.__TAURI_INTERNALS__`, so in a plain browser
(the gallery, a Vite dev server opened without `tauri dev`, a test) any
component that calls it at mount crashes the page with "Cannot read
properties of undefined (reading 'metadata')". The browser can also report
Linux in its user agent, so an `IS_LINUX` guard alone is not enough.

**Fix:** gate every window API on `IN_TAURI` (true only when the OS plugin
answered). `WindowControls`, `WindowResizeEdges`, `TitleBar` and the
scaffold's `main.tsx` all do. `IS_MAC` and friends fall back to the user agent
so key labels are still right in a browser.

## 13. Changing the theme storage keys resets every user

0.1 stored the mode and theme under `atlas-ui-theme-shadow` /
`atlas-ui-theme-id-shadow` (inherited from nexis-atlas). 0.2 stores them
under `<storageKey>:mode` / `<storageKey>:theme`.

**Fix:** `ThemeProvider` reads the 0.1 keys as a fallback (never writes
them), so an upgrading app keeps its users' choice. The app's `index.html`
bootstrap must read the *new* key, or the first launch after the upgrade
flashes the wrong mode.

