---
name: nexis-scaffold
description: Scaffold and build a Tauri desktop app with @nexis/design (React 19, Tailwind v4). Use when asked to create, start or prototype a Nexis-family desktop app, tool, dashboard, editor, settings window, admin panel, log viewer, installer or wizard, or to add Nexis UI to a Tauri + React app.
---

# Scaffold a Nexis app

@nexis/design is the design system of the Nexis family of Tauri apps.
AGENTS.md (repo root) is the contract; this skill is the procedure.

## 1. Choose a template from the app's shape

| The app is mostly… | Template |
|---|---|
| live numbers, charts, a status table | `dashboard` |
| a tree/list of things + an open document + an inspector | `workbench` |
| labelled options grouped in sections | `settings` |
| records to search, filter, sort, page and inspect | `explorer` |
| a stream of lines and a command prompt | `console` |
| a linear sequence of steps | `wizard` |
| one small screen | `minimal` |

If none fits, pick the closest and use AGENTS.md §1 "Recipes" to adapt it.
Ask the user only if two templates fit equally and the choice changes the
layout substantially.

## 2. Create it

```bash
scripts/new-app.sh nexis-<thing> <template> [dir]
cd <dir> && pnpm install
```

- Name apps `nexis-<thing>`, lowercase.
- Use `NEXIS_PATH=$(pwd)` when this repo's commit is not pushed yet (the git
  pin only resolves for pushed commits).
- `pnpm dev` here and open `#/app/<template>` to see what you are starting
  from.

## 3. Make it the user's app

1. Replace the fixture data at the bottom of `src/App.tsx` with the real
   source. Keep the view a function of state; keep filtering/sorting in one
   `useMemo`.
2. Rename views, sidebar items, palette commands and titles; redraw
   `src/AppLogo.tsx` and replace `src-tauri/icons/icon.png`, then
   `pnpm tauri icon src-tauri/icons/icon.png`.
3. Delete what the app does not need — templates are generous on purpose.
4. Every action goes in the `CommandPalette` too.
5. Copy component usage from AGENTS.md §3 (compile-checked).

## 4. Hold the line on the rules

Colours only from tokens (no hex, no `emerald-500`); one accent (`brand`);
state from `success`/`warning`/`info`/`destructive`; icons only via
`<Icon name>`; no emoji; `font-heading` only for titles; motion only from the
house vocabulary, never on live data; `Panel` for regions; window APIs behind
`IN_TAURI`. Full list: AGENTS.md §2.

## 5. Verify, then report

```bash
pnpm build
```

Then **run it and look**: `pnpm dev` and screenshot it headless (Playwright
against the Vite URL works — Tauri APIs are gated off in a browser), or
`pnpm tauri dev` on a desktop. Check each screen in dark and light, one other
theme and high contrast. Report what you built, what you verified by looking,
and what you could not check (native chrome on macOS/Windows/Linux, the Rust
build if no WebKitGTK was available).
