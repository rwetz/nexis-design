---
name: nexis-scaffold
description: Scaffold and build a Tauri desktop app with @nexis/design (React 19, Tailwind v4). Use when asked to create, start or prototype a Nexis-family desktop app, tool, dashboard, editor, settings window, admin panel, log viewer, installer or wizard, or to add Nexis UI to a Tauri + React app.
---

# Scaffold a Nexis app

@nexis/design is the design system of the Nexis family of Tauri apps.
AGENTS.md (repo root) is the contract, docs/RULES.md the numbered rules,
docs/BACKEND.md the Rust half; this skill is the procedure. The scaffold
output is verified: all seven templates build, and `nexis-design-check`
passes on each.

## 1. Choose a template from the app's shape

| The app is mostly… | Template |
|---|---|
| live numbers, charts, a status table | `dashboard` |
| a tree/list of things + an open document + an inspector | `workbench` |
| labelled options grouped in sections | `settings` |
| records to search, filter, sort, page and inspect | `explorer` |
| a stream of lines and a command prompt | `console` |
| a linear sequence of steps | `wizard` |
| one small screen, or a launcher | `minimal` |

If none fits, pick the closest and use AGENTS.md §1 "Recipes" (chat, file
manager, media player, API client, editor, mail reader, calendar, creative
tool, database browser, business forms, installer…) to adapt it. Ask the
user only if two templates fit equally and the choice changes the layout
substantially.

Then choose the plugins from what the app *does*, before scaffolding (they
are four edits each to add later): open/save a file `dialog`, remember
settings or recents `store`, read/write files `fs`, links or reveal in the OS
`opener`, alerts `notification`, copy buttons `clipboard-manager`, restart
`process`. Anything else is BACKEND.md §3.

## 2. Create it

```bash
scripts/new-app.sh nexis-<thing> <template> [dir] [--with store,dialog]
cd <dir> && pnpm install
pnpm verify        # must be clean before you change anything
```

- Name apps `nexis-<thing>`, lowercase.
- Use `NEXIS_PATH=$(pwd)` when this repo's commit is not pushed yet (the git
  pin only resolves for pushed commits).
- `pnpm dev` here and open `#/app/<template>` to see what you are starting
  from.
- `pnpm tauri icon src-tauri/icons/icon.png` before the first `cargo check`.

## 3. Make it the user's app

1. **Contract first.** Define the data types and the Rust commands in
   `src/backend.ts` as typed wrappers over `call(name, args, fallback)` with
   believable fallbacks, so every screen is buildable and viewable in a
   browser.
2. Replace the fixture data at the bottom of `src/App.tsx` with `useLoad(…)`
   over those wrappers. Keep the view a function of state; keep
   filtering/sorting in one `useMemo`. Every data view gets its four states
   (RULES R7.3).
3. Rename views, sidebar items, palette commands and titles; redraw
   `src/AppLogo.tsx` and replace `src-tauri/icons/icon.png`.
4. Delete what the app does not need: templates are generous on purpose.
5. Every action goes in the `CommandPalette` too.
6. Implement the Rust commands in `src-tauri/src/`, register each in
   `generate_handler!` (BACKEND B1.2).
7. Copy component usage from AGENTS.md §3 (compile-checked).

## 4. Hold the line on the rules

Short list in AGENTS.md §2, full ruleset in docs/RULES.md. The ones that
bite: colours only from tokens; one accent (`brand`), selection is neutral;
Inter only, sizes from the type list, numbers `tabular-nums` and never mono;
the 4px grid and the named spaces; the pattern's component (`SettingsLayout`,
`PanelSection`, `ControlRow`); the right overlay for the job (`Combobox` past
12 options); no emoji, no em dashes; window and backend calls only behind
`IN_TAURI`. `pnpm check` enforces what it can: fix what it names, do not
silence it.

## 5. Verify, then report

```bash
pnpm verify        # nexis-design-check (rules + Tauri wiring) + tsc + vite build
```

Then **run it and look**: `pnpm dev` and screenshot it headless (Playwright
against the Vite URL works: Tauri APIs are gated off and `call` returns its
fallbacks), or `pnpm tauri dev` on a desktop. Check each screen in dark and
light, one other theme, high contrast, at 1024x768 and at 1920x1080 or wider.
Report what you built, what `pnpm verify` said, what you verified by looking,
and what you could not check (native chrome on macOS/Windows/Linux, the Rust
build with `cargo check` if no WebKitGTK was available).
