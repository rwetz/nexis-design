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
# checkout is on (override with NEXIS_REV=<rev>). NEXIS_PATH=<path> depends on
# a local checkout instead, written as a path relative to the new app and
# installed as a copy: re-run `pnpm install` after changing the checkout (a
# `link:` brings a second @types/react and fails typechecking).
#
# The dev port is derived from the name, so two apps can run side by side;
# NEXIS_PORT=<port> overrides it.
#
# Afterwards: cd <dir> && pnpm install && pnpm tauri dev
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
name="${1:-}"
template="${2:-minimal}"
if [[ -z "$name" ]]; then
  sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'
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

# Git Bash paths (/c/Users/...) mean nothing to Windows node and pnpm; hand
# them a mixed path (C:/Users/...) instead. A no-op elsewhere.
native() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi
}

if [[ -n "${NEXIS_PATH:-}" ]]; then
  if [[ ! -f "$NEXIS_PATH/package.json" ]] || ! grep -q '"name": "@nexis/design"' "$NEXIS_PATH/package.json"; then
    echo "error: NEXIS_PATH=$NEXIS_PATH is not a checkout of @nexis/design" >&2
    exit 1
  fi
  nexis_abs="$(native "$(cd "$NEXIS_PATH" && pwd)")"
fi
rev="${NEXIS_REV:-$(git -C "$here" rev-parse HEAD 2>/dev/null || echo main)}"

# Display name: nexis-pulse -> Pulse. Identifier: app.nexis.pulse.
short="${name#nexis-}"
display="$(echo "$short" | sed -E 's/-+/ /g; s/(^| )([a-z])/\1\u\2/g')"
ident="app.nexis.$(echo "$short" | tr -d '-')"
year="$(date +%Y)"
# 1420 is Tauri's default; spread apps over 1420..1819 by name.
port="${NEXIS_PORT:-$((1420 + $(printf '%s' "$name" | cksum | cut -d' ' -f1) % 400))}"

mkdir -p "$dir/src" "$dir/src-tauri/src" "$dir/src-tauri/capabilities" "$dir/src-tauri/icons" "$dir/public" "$dir/docs/brand"
dir="$(cd "$dir" && pwd)"
dir_native="$(native "$dir")"

if [[ -n "${NEXIS_PATH:-}" ]]; then
  # Relative, so the app installs from any shell and on any machine with the
  # same layout (file:../nexis-design).
  dep="file:$(node -e 'const p=require("node:path");console.log(p.relative(process.argv[1],process.argv[2]).split(p.sep).join("/"))' "$dir_native" "$nexis_abs")"
else
  dep="github:rwetz/nexis-design#$rev"
fi

# The workspace's file header for an authored source file.
header() {
  local c="$1" w=38
  printf '%s ╔%s╗\n' "$c" "$(printf '═%.0s' $(seq $w))"
  printf '%s ║  %-*s║\n' "$c" $((w - 2)) "Ryan Wetzstein"
  printf '%s ║  %-*s║\n' "$c" $((w - 2)) "$display"
  printf '%s ║  %-*s║\n' "$c" $((w - 2)) "$year"
  printf '%s ╚%s╝\n' "$c" "$(printf '═%.0s' $(seq $w))"
}

# ── package.json: the design package plus exactly its peers ─────────────────
DEP="$dep" NAME="$name" HERE="$(native "$here")" OUT="$dir_native/package.json" node --input-type=module -e '
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
    // Regenerate the desktop icons from src-tauri/icons/icon.png, without
    // the Android and iOS sets a desktop app does not use.
    icons: "tauri icon src-tauri/icons/icon.png && node -e \"for (const d of [\x27android\x27, \x27ios\x27]) require(\x27fs\x27).rmSync(\x27src-tauri/icons/\x27 + d, { recursive: true, force: true })\"",
    // Cursors are CSS url()s resolved against the document, so the PNGs
    // must be in public/ (docs/ASSETS.md).
    postinstall: "nexis-design-assets",
  },
  dependencies: { "@nexis/design": process.env.DEP, ...self.peerDependencies },
  devDependencies: {
    "@tauri-apps/cli": "^2.12.0",
    ...pick(["@tailwindcss/vite", "@vitejs/plugin-react", "@types/react", "@types/react-dom", "typescript", "vite"]),
  },
};
writeFileSync(process.env.OUT, JSON.stringify(pkg, null, 2) + "\n");
'

# pnpm >= 11 reads build approvals here, not from package.json (PITFALLS §6);
# without it esbuild never installs.
cat > "$dir/pnpm-workspace.yaml" <<'YAML'
allowBuilds:
  esbuild: true
YAML

cat > "$dir/.gitignore" <<'IGN'
node_modules/
dist/
*.log
public/cursors/
src-tauri/target/
src-tauri/gen/
src-tauri/icons/android/
src-tauri/icons/ios/
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

{ header "//"; cat <<TS

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tauri expects a fixed dev port (devUrl in src-tauri/tauri.conf.json: change
// both together) and must not have Vite watching its own build output.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: { port: $port, strictPort: true, watch: { ignored: ["**/src-tauri/**"] } },
});
TS
} > "$dir/vite.config.ts"

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

{ header ' *' | sed '1s#^ [*]#/*#'; echo ' */'; cat <<'CSS'

/* The design system. It scans its own components (@source inside); your
 * src/ is scanned automatically. Embedding a terminal or editor? Import
 * globals.ide.css instead. */
@import "@nexis/design/styles/globals.css";

/* App-specific rules only below this line. Anything general belongs
 * upstream in @nexis/design. */
CSS
} > "$dir/src/styles.css"

{ header "//"; cat <<TSX

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
// after React has painted: never a blank or white frame. setTimeout, not
// requestAnimationFrame: rAF does not fire in a hidden window.
if (IN_TAURI) {
  const show = () => getCurrentWindow().show().catch(console.error);
  setTimeout(show, 50);
  setTimeout(show, 500);
}
TSX
} > "$dir/src/main.tsx"

# The app's own mark (RULES §17). It starts as the family's heptagram, in
# currentColor; an app with a mark of its own draws it here.
{ header "//"; cat <<'TSX'

import { NexisMark } from "@nexis/design";

export function AppLogo({ className }: { className?: string }) {
  return <NexisMark className={className} />;
}
TSX
} > "$dir/src/AppLogo.tsx"

# The template, with the workspace header in place of its banner, and its
# name, title and logo made this app's.
title="$(grep -o 'title="[^"]*"' "$src" | head -1 | sed 's/title="//; s/"$//')"
{
  header "//"
  echo "//"
  echo "// Started from the @nexis/design \`$template\` template."
  # Drop the template's own 4-line banner box.
  # The template's Nexis mark becomes this app's own mark (RULES §17).
  tail -n +5 "$src" | sed \
    -e "s#<NexisMark className=\"\([^\"]*\)\" />#<AppLogo className=\"\1\" />#g" \
    -e "/^  NexisMark,\$/d"
} > "$dir/src/App.tsx"
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

{ header "//"; cat <<'RS'

fn main() {
    tauri_build::build()
}
RS
} > "$dir/src-tauri/build.rs"

{ header "//"; cat <<RS

// Prevents an extra console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ${crate}_lib::run()
}
RS
} > "$dir/src-tauri/src/main.rs"

{ header "//"; cat <<'RS'

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
        // @nexis/design docs/PITFALLS.md §2: do not re-litigate.
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
} > "$dir/src-tauri/src/lib.rs"

window_base='"title": "'"$display"'", "width": 1280, "height": 820, "minWidth": 720, "minHeight": 480, "visible": false'
cat > "$dir/src-tauri/tauri.conf.json" <<JSON
{
  "\$schema": "https://schema.tauri.app/config/2",
  "productName": "$display",
  "version": "0.1.0",
  "identifier": "$ident",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:$port",
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

# Placeholder icons, the full desktop set, so `pnpm tauri dev` builds on the
# first try (Windows needs icon.ico before it compiles anything). Replace
# icon.png and run `pnpm icons`.
cp "$here/assets/brand/nexis-logo.png" "$dir/src-tauri/icons/icon.png"
mkdir -p "$dir/assets" && cp "$here/assets/brand/nexis-logo.svg" "$dir/assets/logo.svg"
cp "$here/templates/icons/"* "$dir/src-tauri/icons/"

# The workspace's brand mark, for the README footer.
cp "$here/docs/brand/heptagram-white.svg" "$here/docs/brand/heptagram-black.svg" "$dir/docs/brand/"

cat > "$dir/AGENTS.md" <<MD
# $display

A Nexis-family desktop app: Tauri v2 + React 19 + Tailwind v4 on
[@nexis/design](https://github.com/rwetz/nexis-design), started from the
\`$template\` template.

Read @nexis/design's AGENTS.md (node_modules/@nexis/design/AGENTS.md): the
rules (§2) and the API cheat sheet (§3) apply here unchanged. In short:
colours only from tokens (\`bg-card\`, \`text-muted-foreground\`, \`bg-brand\`),
one accent, icons only via \`<Icon name="..." />\`, motion only from the house
tokens, every action in the \`CommandPalette\`, no emoji, no em dashes.

- \`src/App.tsx\`: the app (from the template). Replace the fixture data at the
  bottom with the real source; keep the shell.
- \`src/AppLogo.tsx\`: this app's mark. Make it yours.
- \`src-tauri/\`: window chrome config; see @nexis/design docs/SCAFFOLDING.md.
  Replace \`src-tauri/icons/icon.png\` and run \`pnpm icons\`.
- Dev server: port $port (\`vite.config.ts\` and \`devUrl\` in
  \`src-tauri/tauri.conf.json\`; change both together).

Something in @nexis/design missing or wrong? Log it in nexis-design's
\`docs/SCAFFOLD-ISSUES.md\` (scaffolding) or \`docs/APP-FINDINGS.md\` (components
and rules) instead of patching \`node_modules\`.

Verify: \`pnpm build\` (typecheck + bundle), then \`pnpm tauri dev\` and look at
every screen in light and dark and one other theme.
MD

printf '@AGENTS.md\n' > "$dir/CLAUDE.md"

cat > "$dir/README.md" <<MD
<p align="center">
  <img src="assets/logo.svg" alt="$display logo" width="128">
</p>

<h1 align="center">$display</h1>

<p align="center">One sentence on what $display does. Part of the <a href="https://github.com/rwetz/nexis-design">Nexis</a> family.</p>

<p align="center">
  <img src="docs/main.png" alt="$display's main screen">
</p>

## Features

-

## Install

### Download

Not released yet.

### From source

\`\`\`bash
pnpm install
pnpm tauri dev
\`\`\`

## Development

| Command | |
|---|---|
| \`pnpm dev\` | The UI in a browser at http://localhost:$port (Tauri APIs off) |
| \`pnpm tauri dev\` | The desktop app |
| \`pnpm build\` | Typecheck and bundle |
| \`pnpm icons\` | Regenerate the app icons from \`src-tauri/icons/icon.png\` |

## Keys

| Keys | |
|---|---|
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> | Command palette |

## License

Choose one.

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/heptagram-white.svg">
    <img src="docs/brand/heptagram-black.svg" alt="heptagram" width="48">
  </picture>
</p>
MD

echo "Created $display ($name) from the '$template' template in $dir"
echo
echo "Next:"
echo "  cd $dir"
echo "  pnpm install"
echo "  pnpm tauri dev"
echo
echo "Still to do: draw src/AppLogo.tsx and assets/logo.svg, replace"
echo "src-tauri/icons/icon.png and run 'pnpm icons', take docs/main.png."
echo
echo "Preview entry for a .claude/launch.json:"
echo "  { \"name\": \"$short\", \"runtimeExecutable\": \"pnpm\", \"runtimeArgs\": [\"--dir\", \"$dir_native\", \"dev\"], \"port\": $port }"
