#!/usr/bin/env bash
# Scaffold apps from this checkout the way a user would, and prove they work.
# CI runs it on Linux, macOS and Windows; run it locally the same way.
#
#   scripts/ci-scaffold.sh <template> [--cargo] [--smoke]
#
#   --cargo   also `cargo check` the Rust half (needs the Tauri prerequisites:
#             WebKitGTK on Linux, https://tauri.app/start/prerequisites/)
#   --smoke   Linux only: build the app with its frontend embedded (so the
#             release CSP applies) and run it under Xvfb for a few seconds;
#             fails if it exits early (a plugin that panics at startup, a
#             config Tauri rejects)
#
# Every plugin new-app.sh knows is wired in, so one run exercises them all.
# The http scope placeholder is replaced the way an app would.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
template="${1:?usage: ci-scaffold.sh <template> [--cargo] [--smoke]}"
shift
cargo=0; smoke=0
for a in "$@"; do
  case "$a" in
    --cargo) cargo=1 ;;
    --smoke) smoke=1 ;;
    *) echo "unknown option $a" >&2; exit 1 ;;
  esac
done

work="${CI_WORKDIR:-$(mktemp -d)}"
name="nexis-ci-$template"
app="$work/$name"
plugins="store,dialog,fs,opener,notification,clipboard-manager,process,http,sql,global-shortcut"

NEXIS_PATH="$here" bash "$here/scripts/new-app.sh" "$name" "$template" "$app" --with "$plugins" >/dev/null
cd "$app"
# The scope an app would name for itself.
sed -i.bak 's#https://REPLACE_ME.invalid/\*#https://api.example.com/*#' src-tauri/capabilities/default.json && rm -f src-tauri/capabilities/default.json.bak

pnpm install
pnpm tauri icon src-tauri/icons/icon.png >/dev/null
pnpm verify
echo "ok: $template verified"

if [[ $cargo -eq 1 ]]; then
  (cd src-tauri && cargo check)
  echo "ok: $template cargo check"
fi

if [[ $smoke -eq 1 ]]; then
  pnpm tauri build --debug --no-bundle
  bin="src-tauri/target/debug/$name"
  [[ -x "$bin" ]] || { echo "no binary at $bin" >&2; exit 1; }
  # A window that is still alive after 15s got through startup: the plugins
  # initialised, the capability and CSP parsed, the page loaded.
  xvfb-run -a bash -c '"$0" & pid=$!; sleep 15; if kill -0 $pid 2>/dev/null; then kill $pid; echo "ok: $0 ran 15s"; else wait $pid; echo "exited early" >&2; exit 1; fi' "$bin"
fi
