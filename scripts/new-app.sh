#!/usr/bin/env bash
# Scaffold a new Nexis-family app (Tauri v2 + React 19 + Tailwind v4) from
# one of the templates.
#
#   scripts/new-app.sh <name> [template] [dir]
#
#   name      package name, e.g. nexis-pulse (family apps are nexis-<thing>)
#   template  dashboard | workbench | settings | explorer | console | wizard | minimal
#             (default: minimal)
#   dir       where to create it (default: ../<name>, next to this checkout)
#
# The app depends on @nexis/design from git, pinned to the commit this
# checkout is on (override with NEXIS_REV=<rev>, or NEXIS_PATH=<path> to
# depend on a local checkout — installed as a copy, so re-run `pnpm install`
# after changing the checkout; a `link:` would bring a second @types/react
# and fail typechecking).
#
# Afterwards: cd <dir> && pnpm install && pnpm tauri icon src-tauri/icons/icon.png && pnpm tauri dev
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
name="${1:-}"
template="${2:-minimal}"
if [[ -z "$name" ]]; then
  sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi
if [[ ! "$name" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "error: '$name' is not a valid package name (lowercase letters, digits and -)" >&2
  exit 1
fi
case "$template" in
  dashboard|workbench|settings|explorer|console|wizard|minimal) src="$here/templates/$template.tsx" ;;
  *) echo "error: unknown template '$template'" >&2; exit 1 ;;
esac
dir="${3:-$here/../$name}"
if [[ -e "$dir" ]]; then
  echo "error: $dir already exists" >&2
  exit 1
fi

if [[ -n "${NEXIS_PATH:-}" ]]; then
  dep="file:$(cd "$NEXIS_PATH" && pwd)"
else
  rev="${NEXIS_REV:-$(git -C "$here" rev-parse HEAD 2>/dev/null || echo main)}"
  dep="github:rwetz/nexis-design#$rev"
fi
# Display name: nexis-pulse -> Pulse. Identifier: app.nexis.pulse.
short="${name#nexis-}"
display="$(echo "$short" | sed -E 's/-+/ /g; s/(^| )([a-z])/\1\u\2/g')"
ident="app.nexis.$(echo "$short" | tr -d '-')"

mkdir -p "$dir/src" "$dir/src-tauri/src" "$dir/src-tauri/capabilities" "$dir/src-tauri/icons" "$dir/public"

# ── package.json: the design package plus exactly its peers ─────────────────
DEP="$dep" NAME="$name" HERE="$here" node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const self = JSON.parse(readFileSync(process.env.HERE + "/package.json", "utf8"));
const dev = self.devDependencies;
const pick = (ks) => Object.fromEntries(ks.map((k) => [k, dev[k] ?? self.peerDependencies[k]]));
const pkg = {
  name: process.env.NAME,
  private: true,
  version: "0.1.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "tsc --noEmit && vite build",
    preview: "vite preview",
    tauri: "tauri",
    // Cursors are CSS url()s resolved against the document, so the PNGs
    // must be in public/ (docs/ASSETS.md).
    postinstall: "nexis-design-assets",
  },
  dependencies: { "@nexis/design": process.env.DEP, ...self.peerDependencies, "@tauri-apps/plugin-os": self.peerDependencies["@tauri-apps/plugin-os"] },
  devDependencies: {
    "@tauri-apps/cli": "^2.12.0",
    ...pick(["@tailwindcss/vite", "@vitejs/plugin-react", "@types/react", "@types/react-dom", "typescript", "vite"]),
  },
  pnpm: { onlyBuiltDependencies: ["esbuild"] },
};
writeFileSync("'"$dir"'/package.json", JSON.stringify(pkg, null, 2) + "\n");
'

# pnpm >= 11 ignores package.json's onlyBuiltDependencies and asks here
# instead (docs/PITFALLS.md §6); without it esbuild never installs.
cat > "$dir/pnpm-workspace.yaml" <<'YAML'
allowBuilds:
  esbuild: true
YAML

cat > "$dir/.gitignore" <<'IGN'
node_modules/
dist/
public/cursors/
src-tauri/target/
src-tauri/gen/
IGN

cat > "$dir/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
JSON

cat > "$dir/vite.config.ts" <<'TS'
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tauri expects a fixed dev port and must not have Vite watching its own
// build output.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: { port: 1420, strictPort: true, watch: { ignored: ["**/src-tauri/**"] } },
});
TS

# ── index.html: paint the right background before the bundle loads ─────────
cat > "$dir/index.html" <<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$display</title>
    <script>
      // No-flash bootstrap (docs/SCAFFOLDING.md step 5). The key is the
      // ThemeProvider's storageKey + ":mode".
      (function () {
        try {
          var m = localStorage.getItem("$name:mode") || "system";
          var dark = m === "dark" || (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
          document.documentElement.classList.add(dark ? "dark" : "light");
          document.documentElement.style.backgroundColor = dark ? "oklch(0.148 0.004 228.8)" : "#fff";
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML

cat > "$dir/src/styles.css" <<'CSS'
/* The design system. It scans its own components (@source inside); your
 * src/ is scanned automatically. Embedding a terminal or editor? Import
 * globals.ide.css instead. */
@import "@nexis/design/styles/globals.css";

/* App-specific rules only below this line. Anything general belongs
 * upstream in @nexis/design. */
CSS

cat > "$dir/src/main.tsx" <<TSX
import "./styles.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { domAnimation, LazyMotion } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IN_TAURI, ThemeProvider, Toaster, TooltipProvider, USE_CUSTOM_WINDOW_CONTROLS } from "@nexis/design";
import App from "./App";

// Windows/Linux: the OS hands us a transparent, undecorated window and the
// stylesheet paints 12px corners onto #root under this flag.
if (USE_CUSTOM_WINDOW_CONTROLS) document.documentElement.dataset.chrome = "borderless";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider storageKey="$name">
        <TooltipProvider delayDuration={300}>
          <App />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </ThemeProvider>
    </LazyMotion>
  </StrictMode>,
);

// The window starts hidden (tauri.conf.json "visible": false) and is shown
// after React has painted — never a blank or white frame. setTimeout, not
// requestAnimationFrame: rAF does not fire in a hidden window.
if (IN_TAURI) {
  const show = () => getCurrentWindow().show().catch(console.error);
  setTimeout(show, 50);
  setTimeout(show, 500);
}
TSX

# The app's own mark, in the family grammar (docs/ASSETS.md): a rounded tile
# in currentColor with the mark knocked out in var(--background).
cat > "$dir/src/AppLogo.tsx" <<'TSX'
export function AppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="currentColor" />
      <path d="M14 34V14h6l8 12V14h6v20h-6l-8-12v12z" fill="var(--background)" />
    </svg>
  );
}
TSX

# The template, with its name, title and logo made this app's.
title="$(grep -o 'title="[^"]*"' "$src" | head -1 | sed 's/title="//; s/"$//')"
sed -e "s#<img src=\"./brand/nexis-logo.png\" alt=\"\" className=\"size-\[18px\]\" />#<AppLogo className=\"size-[18px] text-brand\" />#g" \
    -e "s#<img src=\"./brand/nexis-logo.png\" alt=\"\" className=\"\([^\"]*\)\" />#<AppLogo className=\"\1 text-brand\" />#g" \
    "$src" > "$dir/src/App.tsx"
if [[ -n "$title" ]]; then
  sed -i "s/title=\"$title\"/title=\"$display\"/" "$dir/src/App.tsx"
fi
if grep -q "<AppLogo" "$dir/src/App.tsx"; then
  sed -i '0,/^import /s//import { AppLogo } from ".\/AppLogo";\nimport /' "$dir/src/App.tsx"
fi

# ── src-tauri ───────────────────────────────────────────────────────────────
crate="$(echo "$name" | tr '-' '_')"
cat > "$dir/src-tauri/Cargo.toml" <<TOML
[package]
name = "$name"
version = "0.1.0"
edition = "2021"

[lib]
name = "${crate}_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-os = "2"
TOML

cat > "$dir/src-tauri/build.rs" <<'RS'
fn main() {
    tauri_build::build()
}
RS

cat > "$dir/src-tauri/src/main.rs" <<RS
// Prevents an extra console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ${crate}_lib::run()
}
RS

cat > "$dir/src-tauri/src/lib.rs" <<'RS'
#[cfg(target_os = "linux")]
fn is_nvidia() -> bool {
    std::path::Path::new("/proc/driver/nvidia/version").exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        // NVIDIA + Wayland: WebKitGTK's DMA-BUF renderer crashes at first
        // paint. Forcing Mesa's EGL keeps it alive *and* keeps window alpha
        // (the 12px transparent corners); disabling DMA-BUF is the fallback
        // that keeps it alive but paints the corners black.
        // @nexis/design docs/PITFALLS.md §2 — do not re-litigate.
        if is_nvidia() && std::env::var_os("APP_KEEP_HW_ACCEL").is_none()
            && std::env::var_os("__EGL_VENDOR_LIBRARY_FILENAMES").is_none()
        {
            const MESA: &str = "/usr/share/glvnd/egl_vendor.d/50_mesa.json";
            if std::path::Path::new(MESA).exists() {
                std::env::set_var("__EGL_VENDOR_LIBRARY_FILENAMES", MESA);
            } else {
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1"); // alive > pretty
            }
        }
        // KWin otherwise draws a server-side title bar over our own.
        if std::env::var_os("GTK_CSD").is_none() {
            std::env::set_var("GTK_CSD", "1");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
RS

window_base='"title": "'"$display"'", "width": 1280, "height": 820, "minWidth": 720, "minHeight": 480, "visible": false'
cat > "$dir/src-tauri/tauri.conf.json" <<JSON
{
  "\$schema": "https://schema.tauri.app/config/2",
  "productName": "$display",
  "version": "0.1.0",
  "identifier": "$ident",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{ "label": "main", $window_base, "titleBarStyle": "Overlay", "hiddenTitle": true }],
    "security": { "csp": null }
  },
  "bundle": { "active": true, "targets": "all", "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"] }
}
JSON
# Platform overrides REPLACE the windows array, so each repeats the sizes
# (docs/PITFALLS.md §1).
for os in windows linux; do
  cat > "$dir/src-tauri/tauri.$os.conf.json" <<JSON
{
  "app": {
    "windows": [{ "label": "main", $window_base, "decorations": false, "transparent": true, "shadow": false }]
  }
}
JSON
done

cat > "$dir/src-tauri/capabilities/default.json" <<'JSON'
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "What the window chrome needs, and nothing else yet.",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "core:window:allow-start-resize-dragging",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-internal-toggle-maximize",
    "core:window:allow-is-maximized",
    "core:window:allow-is-fullscreen",
    "core:window:allow-close",
    "core:window:allow-show",
    "core:window:allow-set-focus",
    "os:default"
  ]
}
JSON

# A placeholder icon source for `pnpm tauri icon` — replace it.
cp "$here/assets/brand/nexis-logo.png" "$dir/src-tauri/icons/icon.png"

cat > "$dir/AGENTS.md" <<MD
# $display

A Nexis-family desktop app: Tauri v2 + React 19 + Tailwind v4 on
[@nexis/design](https://github.com/rwetz/nexis-design), started from the
\`$template\` template.

Read @nexis/design's AGENTS.md (node_modules/@nexis/design/AGENTS.md) — the
rules (§2) and the API cheat sheet (§3) apply here unchanged. In short:
colours only from tokens (\`bg-card\`, \`text-muted-foreground\`, \`bg-brand\`),
one accent, icons only via \`<Icon name="…" />\`, motion only from the house
tokens, every action in the \`CommandPalette\`, no emoji.

- \`src/App.tsx\` — the app (from the template). Replace the fixture data at the
  bottom with the real source; keep the shell.
- \`src/AppLogo.tsx\` — this app's mark. Make it yours.
- \`src-tauri/\` — window chrome config; see @nexis/design docs/SCAFFOLDING.md.

Verify: \`pnpm build\` (typecheck + bundle), then \`pnpm tauri dev\` and look at
every screen in light and dark and one other theme.
MD

echo "Created $display ($name) from the '$template' template in $dir"
echo
echo "Next:"
echo "  cd $dir"
echo "  pnpm install"
echo "  pnpm tauri icon src-tauri/icons/icon.png   # replace the placeholder first"
echo "  pnpm tauri dev"
