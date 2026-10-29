#!/usr/bin/env bash
# Scaffold a new Nexis-family app (Tauri v2 + React 19 + Tailwind v4) from
# one of the templates.
#
#   scripts/new-app.sh <name> [template] [dir] [--with plugin,plugin]
#
#   name      package name, e.g. nexis-pulse (family apps are nexis-<thing>)
#   template  dashboard | workbench | settings | explorer | console | wizard | minimal
#             (default: minimal)
#   dir       where to create it (default: ../<name>, next to this checkout)
#   --with    Tauri plugins to wire end to end (npm dep, Cargo dep, lib.rs,
#             capability): store dialog fs opener notification
#             clipboard-manager process. See docs/BACKEND.md.
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
with=""
args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --with) with="${2:-}"; shift 2 ;;
    --with=*) with="${1#--with=}"; shift ;;
    *) args+=("$1"); shift ;;
  esac
done
name="${args[0]:-}"
template="${args[1]:-minimal}"
if [[ -z "$name" ]]; then
  sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
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
# Plugin table: name | cargo features | the .plugin(...) expression | permissions.
# Every entry is wired in four places, and the check script (nexis-design-check)
# fails when any of the four is missing.
plugin_known="store dialog fs opener notification clipboard-manager process"
if [[ -n "$with" ]]; then
  for p in ${with//,/ }; do
    case " $plugin_known " in
      *" $p "*) ;;
      *) echo "error: unknown plugin '$p' (known: $plugin_known)" >&2; exit 1 ;;
    esac
  done
fi
dir="${args[2]:-$here/../$name}"
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
DEP="$dep" NAME="$name" HERE="$here" WITH="${with}" node --input-type=module -e '
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
    // The family rules plus the Tauri wiring (docs/RULES.md R12.1), then the
    // typecheck and bundle. Run it before calling anything done.
    check: "nexis-design-check",
    verify: "nexis-design-check && tsc --noEmit && vite build",
  },
  dependencies: { "@nexis/design": process.env.DEP, ...self.peerDependencies, "@tauri-apps/plugin-os": self.peerDependencies["@tauri-apps/plugin-os"] },
  devDependencies: {
    "@tauri-apps/cli": "^2.12.0",
    ...pick(["@tailwindcss/vite", "@vitejs/plugin-react", "@types/react", "@types/react-dom", "typescript", "vite"]),
  },
  pnpm: { onlyBuiltDependencies: ["esbuild"] },
};
for (const p of (process.env.WITH || "").split(",").filter(Boolean)) pkg.dependencies["@tauri-apps/plugin-" + p] = "^2";
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
import { ErrorBoundary, IN_TAURI, ThemeProvider, Toaster, TooltipProvider, USE_CUSTOM_WINDOW_CONTROLS } from "@nexis/design";
import App from "./App";

// Windows/Linux: the OS hands us a transparent, undecorated window and the
// stylesheet paints 12px corners onto #root under this flag.
if (USE_CUSTOM_WINDOW_CONTROLS) document.documentElement.dataset.chrome = "borderless";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider storageKey="$name">
        <TooltipProvider delayDuration={300}>
          <ErrorBoundary label="The app" className="h-full">
            <App />
          </ErrorBoundary>
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

# The one door to Rust (docs/BACKEND.md). Outside Tauri there is no backend, so
# a browser, a test and the headless screenshots get the fallback instead of a
# crash. Errors from Rust arrive as strings; they leave here as Errors.
cat > "$dir/src/backend.ts" <<'TS'
import { invoke } from "@tauri-apps/api/core";
import { IN_TAURI } from "@nexis/design";

/**
 * Call a Rust command. In a browser (no Tauri) it resolves `fallback` when one
 * is given, and rejects with a plain message when not, so a view can show
 * its error state instead of dying.
 */
export async function call<T>(command: string, args?: Record<string, unknown>, fallback?: T): Promise<T> {
  if (!IN_TAURI) {
    if (fallback !== undefined) return fallback;
    throw new Error(`"${command}" needs the desktop app`);
  }
  try {
    return await invoke<T>(command, args);
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  }
}

export type AppInfo = { name: string; version: string };
export const appInfo = () => call<AppInfo>("app_info", undefined, { name: "browser", version: "0.0.0" });
TS

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
serde = { version = "1", features = ["derive"] }
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
mod commands;

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
        // Every #[tauri::command] must be listed here, or invoke() fails at
        // runtime. `nexis-design-check` compares this list with the frontend.
        .invoke_handler(tauri::generate_handler![commands::app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
RS
cat > "$dir/src-tauri/src/commands.rs" <<'RS'
// The app's Rust commands. Each is `#[tauri::command]`, takes owned/serde
// arguments, and returns a serde type or `Result<T, String>` (the Err string
// becomes the Error that src/backend.ts throws). Register it in
// `generate_handler!` in lib.rs and call it with `call("name")` from the
// frontend. Long work belongs on a thread or an async fn, with progress as
// events (docs/BACKEND.md).
use serde::Serialize;

#[derive(Serialize)]
pub struct AppInfo {
    name: String,
    version: String,
}

#[tauri::command]
pub fn app_info() -> AppInfo {
    AppInfo {
        name: env!("CARGO_PKG_NAME").into(),
        version: env!("CARGO_PKG_VERSION").into(),
    }
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

# Wire the requested plugins in all three Rust-side places: Cargo.toml,
# lib.rs and the capability file (the JS dependency is in package.json
# already). One table, so the four never disagree; nexis-design-check fails
# when they do.
WITH="$with" DIR="$dir" node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const wanted = (process.env.WITH || "").split(",").filter(Boolean);
if (wanted.length) {
  const dir = process.env.DIR + "/src-tauri";
  const init = (p) => (p === "store" ? "tauri_plugin_store::Builder::new().build()" : `tauri_plugin_${p.replace(/-/g, "_")}::init()`);
  const perms = (p) => (p === "clipboard-manager" ? ["clipboard-manager:allow-read-text", "clipboard-manager:allow-write-text"] : [`${p}:default`]);

  const cargo = readFileSync(dir + "/Cargo.toml", "utf8").trimEnd();
  writeFileSync(dir + "/Cargo.toml", cargo + "\n" + wanted.map((p) => `tauri-plugin-${p} = "2"`).join("\n") + "\n");

  const lib = readFileSync(dir + "/src/lib.rs", "utf8");
  const anchor = "        .plugin(tauri_plugin_os::init())\n";
  if (!lib.includes(anchor)) throw new Error("new-app.sh: lib.rs anchor moved");
  writeFileSync(dir + "/src/lib.rs", lib.replace(anchor, anchor + wanted.map((p) => `        .plugin(${init(p)})\n`).join("")));

  const capPath = dir + "/capabilities/default.json";
  const cap = JSON.parse(readFileSync(capPath, "utf8"));
  cap.permissions.push(...wanted.flatMap(perms));
  writeFileSync(capPath, JSON.stringify(cap, null, 2) + "\n");
}
'

# A placeholder icon source for `pnpm tauri icon` — replace it.
cp "$here/assets/brand/nexis-logo.png" "$dir/src-tauri/icons/icon.png"

cat > "$dir/AGENTS.md" <<MD
# $display

A Nexis-family desktop app: Tauri v2 + React 19 + Tailwind v4 on
[@nexis/design](https://github.com/rwetz/nexis-design), started from the
\`$template\` template. Plugins wired: ${with:-none}.

Read these before changing UI, in this order. They are in the installed package:

1. \`node_modules/@nexis/design/AGENTS.md\`: the rules (§2) and the API cheat
   sheet (§3, compile-checked: copy prop names from it).
2. \`node_modules/@nexis/design/docs/RULES.md\`: numbered rules, layout
   patterns, which overlay to use, the control for each idea, sizes to check.
3. \`node_modules/@nexis/design/docs/BACKEND.md\`: Rust commands, plugins,
   capabilities, persistence, long jobs.

In short: colours only from tokens, one accent (\`brand\`), icons only via
\`<Icon name>\`, Inter only, sizes from the type list, selection is neutral,
every action in the \`CommandPalette\`, no emoji, no em dashes in text, window
and backend APIs only behind \`IN_TAURI\` (use \`src/backend.ts\`).

## Layout of this app

- \`src/App.tsx\`: the app, from the template. Replace the fixture data at the
  bottom with the real source; keep the shell (title bar, status bar, palette).
- \`src/backend.ts\`: the one door to Rust. \`call("command", args, fallback)\`.
  Works in a browser (returns the fallback) so headless checks still run.
- \`src/AppLogo.tsx\`: this app's mark. Make it yours.
- \`src-tauri/src/commands.rs\`: Rust commands. A new one is three edits: the
  fn with \`#[tauri::command]\`, its name in \`generate_handler![…]\` in
  \`lib.rs\`, and a \`call("name")\` in the frontend.
- \`src-tauri/capabilities/default.json\`: what the window may do. A new
  plugin is four edits (npm dep, Cargo dep, \`.plugin(…)\` in lib.rs, a
  permission here). \`pnpm check\` fails if one is missing.

## Definition of done

\`\`\`bash
pnpm verify      # nexis-design-check (rules + Tauri wiring), tsc, vite build
\`\`\`

Then run it and look: \`pnpm dev\` in a browser (headless screenshots work, the
backend returns its fallbacks) or \`pnpm tauri dev\`. Every screen, dark and
light, one other theme, high contrast, at 1024x768 and 1920x1080 or wider.
Every list has a loading, an empty and an error state. Report what you
verified by looking and what you could not (native chrome per OS, the Rust
build without WebKitGTK).

First run: \`pnpm install && pnpm tauri icon src-tauri/icons/icon.png && pnpm tauri dev\`.
MD

echo "Created $display ($name) from the '$template' template in $dir"
echo
echo "Next:"
echo "  cd $dir"
echo "  pnpm install"
echo "  pnpm tauri icon src-tauri/icons/icon.png   # replace the placeholder first"
echo "  pnpm tauri dev"
