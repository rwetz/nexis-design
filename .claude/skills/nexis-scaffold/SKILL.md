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
  pin only resolves for pushed commits). The script writes it as a relative
  `file:` path, which Windows pnpm can read from any shell.
- The scaffold ships placeholder desktop icons, a `.gitignore`, `CLAUDE.md`,
  a README skeleton with the brand footer, and the workspace file header on
  every source file. The dev port is derived from the app name.
- `pnpm dev` here and open `#/app/<template>` to see what you are starting
  from.

## 3. Make it the user's app

1. Replace the fixture data at the bottom of `src/App.tsx` with the real
   source. Keep the view a function of state; keep filtering/sorting in one
   `useMemo`.
2. Rename views, sidebar items, palette commands and titles; redraw
   `src/AppLogo.tsx` and replace `src-tauri/icons/icon.png`, then
   `pnpm icons`.
3. Delete what the app does not need — templates are generous on purpose.
4. Every action goes in the `CommandPalette` too.
5. Copy component usage from AGENTS.md §3 (compile-checked).

## 4. Hold the line on the rules

Colours only from tokens (no hex, no `emerald-500`); one accent (`brand`);
state from `success`/`warning`/`info`/`destructive`; icons only via
`<Icon name>`; no emoji; no em dashes; one UI face (no `font-heading`); motion only from the
house vocabulary, never on live data; `Panel` for regions; window APIs behind
`IN_TAURI`. Full list: AGENTS.md §2.

## 5. Register it in the workspace

Inside the Dev workspace:

1. Add a row to `Dev/PROJECTS.md`.
2. Add the preview entry `new-app.sh` printed to `Dev/.claude/launch.json`.
3. Run `powershell -File _templates/audit-workspace.ps1` and fix what it
   flags.

Anything in @nexis/design that got in the way goes in this repo's
`docs/SCAFFOLD-ISSUES.md` (scaffolding) or `docs/APP-FINDINGS.md`
(components, rules), not a patch in the app's `node_modules`.

## 6. Verify, then report

```bash
pnpm build
```

Then **run it and look**: `pnpm dev` and screenshot it headless (Playwright
against the Vite URL works — Tauri APIs are gated off in a browser), or
`pnpm tauri dev` on a desktop. Check each screen in dark and light, one other
theme and high contrast. Report what you built, what you verified by looking,
and what you could not check (native chrome on macOS/Windows/Linux, the Rust
build if no WebKitGTK was available).
