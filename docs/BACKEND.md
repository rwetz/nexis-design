# Backend: the Rust half of a Nexis app

RULES.md is the UI. This is everything behind it: commands, plugins,
capabilities, files, long jobs. Most of what goes wrong end to end goes wrong
here, and it goes wrong at runtime, so `pnpm check` (`nexis-design-check`)
compares the frontend with the Rust and fails on the mismatches below. Rules
are numbered `B1.1` so a review can cite them.

Verified by a script, not by a build: the Rust here could not be compiled in
the environment that wrote it (no WebKitGTK). Run `cargo check` in
`src-tauri/` on a desktop before trusting a new command, and say so in your
report if you could not.

---

## 1. Commands

**B1.1 The frontend reaches Rust through `src/backend.ts`.** `call("name",
args, fallback)` runs `invoke` inside Tauri and returns `fallback` in a
browser, so headless screenshots, `pnpm dev` and tests work without a
backend. Never import `invoke` in a view. Errors arrive as strings from Rust
and leave `call` as `Error`s.

**B1.2 A command is three edits.** The fn with `#[tauri::command]` in
`src-tauri/src/`, its name in `generate_handler![…]` in `lib.rs`, and a typed
wrapper in the frontend. `command-unregistered` and `command-unlisted` fail
the check when one is missing.

**B1.3 Arguments are camelCase from JS.** Tauri converts: Rust
`fn load(project_id: u32)` is called as `call("load", { projectId: 1 })`. A
snake_case key arrives as a missing argument.

**B1.4 Return `Result<T, String>`** (or an error type that implements
`Serialize`, e.g. with `thiserror`). The message is what the user may see: say
what failed and what to do, not the debug dump.

**B1.5 Nothing slow runs on the main thread.** A command without `async`
runs on the main thread and freezes the window. Anything that touches disk,
network or takes more than about 16 ms is `async fn`, and blocking work inside
it goes through `tauri::async_runtime::spawn_blocking`. An async command
cannot borrow its arguments (`&str`): take `String`, and return `Result`.

**B1.6 Keep command bodies thin.** Put the logic in a plain function with no
Tauri types, and unit-test that (`cargo test`). The command only adapts.

**B1.7 Shared state** is `.manage(Mutex<T>)` in `lib.rs` and
`State<'_, Mutex<T>>` in the command. Never hold a `std::sync::MutexGuard`
across an `.await`.

## 2. Browser and Tauri are both first-class

**B2.1 Window APIs behind `IN_TAURI`** (PITFALLS 12). Tripwired
(`tauri-unguarded-window`).

**B2.2 A view never assumes the backend answered.** Every view that loads
data has a loading, an empty and an error state (RULES R7.3), driven by one
`status`:

```tsx
const { state, reload } = useLoad(() => call<Project[]>("list_projects", {}, FIXTURE), []);
if (state.status === "loading") return <ListSkeleton />;
if (state.status === "error") return <Alert variant="destructive">…<Button onClick={reload}>Retry</Button></Alert>;
if (state.data.length === 0) return <Empty>…</Empty>;
```

`useLoad` (exported from the package) runs the call on mount and when `deps`
change, drops a stale answer when the selection moved on, and `reload` is the
Retry. The view maps `loading` to `Skeleton` in the content's shape, `error` to
`Alert variant="destructive"` with a Retry button, and `ready` with no rows to
`Empty` with one action.

## 3. Plugins: four places, every time

A Tauri plugin is wired in four places, and a runtime failure is the only
symptom if one is missing:

| Where | What |
|---|---|
| `package.json` | `@tauri-apps/plugin-<name>` |
| `src-tauri/Cargo.toml` | `tauri-plugin-<name> = "2"` |
| `src-tauri/src/lib.rs` | `.plugin(tauri_plugin_<name>::init())` |
| `src-tauri/capabilities/default.json` | `<name>:default`, or narrower `<name>:allow-*` |

**B3.1** `scripts/new-app.sh <name> <template> --with store,dialog` does all
four for: `store` (settings and small state), `dialog` (open/save pickers),
`fs`, `opener` (open a URL or path in the OS), `notification`,
`clipboard-manager` (read and write text), `process` (exit, restart).
`nexis-design-check` verifies the four for any `@tauri-apps/plugin-*` import,
including ones `--with` does not know.

**B3.2 Plugins `--with` does not wire** need their own reading of the Tauri
docs first, because each has a step the table above does not cover:

| Plugin | The extra step |
|---|---|
| `http` | permissions need a URL scope (`{ "identifier": "http:default", "allow": [{ "url": "https://api.example.com/*" }] }`) |
| `sql` | a Cargo feature for the driver (`sqlite`), and migrations registered in Rust |
| `updater` | a signing key (`pnpm tauri signer generate`), `pubkey` and `endpoints` in `tauri.conf.json`, desktop only |
| `global-shortcut` | registered shortcuts are system wide: ask first, offer to change, never take a common one |
| `autostart`, `single-instance`, `deep-link` | initialised with arguments or before others; follow the plugin's page |

**B3.3 Permissions are the narrowest that work.** `fs:default` is read-only
and limited to the app's own directories. Writing is a separate explicit
permission with a scope. Never widen to `**` or `$HOME/**` to make an error
go away; do file work outside the app directories in a Rust command, which
has no scope.

## 4. Where data lives

| Data | Home |
|---|---|
| Theme, interface size | `ThemeProvider` (already in `localStorage`) |
| Preferences, window layout, recents | `store` plugin: one `settings.json` |
| Documents the user owns | files they choose (`dialog` + a Rust command or `fs`) |
| A lot of rows, queries, relations | SQLite, from Rust (`rusqlite`) behind commands |
| Secrets (tokens, passwords) | the OS keychain (`keyring` crate) behind commands. Never `store`, never `localStorage`, never a file |
| Caches | `app.path().app_cache_dir()` |

**B4.1 The webview's storage is not a database.** `localStorage` and
IndexedDB are cleared by the OS and by "reset app data" and are invisible to
Rust. Only the theme engine's keys live there.

```ts
import { load } from "@tauri-apps/plugin-store";
const store = await load("settings.json", { autoSave: true }); // if tsc says `defaults` is required, pass defaults: {}
const recents = (await store.get<string[]>("recents")) ?? [];
await store.set("recents", [path, ...recents.filter((p) => p !== path)].slice(0, 10));
```

**B4.2 Paths come from `app.path()`** (`app_data_dir`, `app_config_dir`,
`app_cache_dir`), never a hard-coded `~/.myapp`.

**B4.3 A save never loses data.** Write to a temp file and rename; ask before
overwrite; keep the document dirty-marked (a neutral dot, R6.5) until the
write returns.

## 5. Long jobs

A job the user starts (export, index, sync, build) follows one shape:

1. The command validates, starts the work on `spawn_blocking` or a thread,
   and returns a job id at once.
2. Progress goes out as events: `app.emit("job:progress", Progress { id, done,
   total })` (needs `use tauri::Emitter`). The frontend subscribes with
   `listen` from `@tauri-apps/api/event` inside `useEffect` and **returns the
   unlisten** from the cleanup.
3. The UI shows a `CallChip` in the toolbar with a cancel (`onEnd`), a
   `Progress`/`Meter` where the total is known, and a `toast` on finish
   (with an action if it can be undone).
4. Cancel is a command that flips an `AtomicBool` in managed state, which the
   loop checks between steps.

Live progress is the one place the accent animates (R6.2). The numbers do not
tween.

## 6. Windows

**B6.1** A second window (a detached preview) is created with
`WebviewWindow` from the frontend or `WebviewWindowBuilder` in Rust. Its
label must be listed in `windows` in `capabilities/default.json` or every
call from it is denied. It loads the same `index.html`; route on
`location.hash` and mount only that view.

**B6.2** Keep `visible: false` and the show-after-paint in `main.tsx` for any
window you create with the chrome (PITFALLS 1).

## 7. Before you ship

- `pnpm verify` is clean, and `cargo check` in `src-tauri/` is clean on a
  desktop (it needs `pnpm tauri icon` to have run).
- **Set a CSP.** The scaffold ships `"csp": null` so dev works anywhere. For a
  release set `app.security.csp` (and `devCsp` for Vite's HMR) to what the app
  loads: `default-src 'self'; img-src 'self' data: asset:; style-src 'self'
  'unsafe-inline'`, plus `connect-src` for each API you call.
- Capabilities hold only what the app uses (open `default.json` and delete
  what no code calls).
- Identifier is `app.nexis.<name>`, version is set in `tauri.conf.json` and
  `Cargo.toml` together, and the icon is the app's own.
- macOS and Windows builds need signing and notarisation to open without a
  warning; that is a release task, not a scaffold one.
- Linux: NVIDIA + Wayland and double chrome are handled by the scaffold
  (PITFALLS 1 and 2); do not remove `lib.rs`'s guard.
