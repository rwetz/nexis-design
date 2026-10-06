# Pitfalls — field notes from real scaffolds

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
overlay while maximized. This is the package's `<ResizeHandles />`
(`src/components/ResizeHandles.tsx`) — mount it; don't rewrite it.

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

**Fix:** answer in `pnpm-workspace.yaml`:

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
