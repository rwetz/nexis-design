---
name: nexis-scaffold
description: Scaffold and build a Tauri desktop app with @nexis/design (React 19, Tailwind v4). Use when asked to create, start or prototype a Nexis-family desktop app, tool, dashboard, editor, settings window, admin panel, log viewer, installer or wizard, or to add Nexis UI to a Tauri + React app.
---

# Scaffold a Nexis app

@nexis/design is the design system of the Nexis family of Tauri apps.
AGENTS.md (repo root) is the contract, docs/RULES.md the numbered rules,
docs/BACKEND.md the Rust half; this skill is the procedure. The scaffold
output is verified: all eight templates build, and `nexis-design-check`
passes on each.

## 1. Choose a template from the app's shape

| The app is mostly… | Template |
|---|---|
| live numbers, charts, a status table | `dashboard` |
| a tree/list of things + an open document + an inspector | `workbench` |
| labelled options grouped in sections | `settings` |
| Many settings chapters, with search and grouped navigation | `settings-deep` |
| records to search, filter, sort, page and inspect | `explorer` |
| a stream of lines and a command prompt | `console` |
| a linear sequence of steps | `wizard` |
| a library of things you open, install and run (games, plugins, models, media) | `launcher` |
| one small screen, or a quick-action palette | `minimal` |

If a recipe in AGENTS.md §1 "Recipes" covers the app in a sentence or two of
glue (chat, file manager, media player, API client, mail reader…), pick the
closest template and adapt it. **If no template fits the app's shape, stop
and ask the user before scaffolding:** "No template fits a <shape> app. Do
you want me to add a `<shape>` template to nexis-design first (shell,
components, gallery page, rules), then scaffold from it?" Recommend it.
`minimal` is for one-screen utilities, never a fallback for "none of the
above": Stipple started there as a game launcher and grew as a tool, with a
game's options in the toolbar and no library or pause menu. Also ask if two
templates fit equally and the choice changes the layout substantially.

Then choose the plugins from what the app *does*, before scaffolding (they
are four edits each to add later): open/save a file `dialog`, remember
settings or recents `store`, read/write files `fs`, links or reveal in the OS
`opener`, alerts `notification`, copy buttons `clipboard-manager`, restart
`process`, network from Rust `http` (name the origin afterwards), a local
database `sql`, system-wide keys `global-shortcut`. `updater` is manual
(BACKEND.md §3.2).

## 2. Create it

```bash
scripts/new-app.sh nexis-<thing> <template> [dir] [--with store,dialog] [--glass regular]
cd <dir> && pnpm install
pnpm verify        # must be clean before you change anything
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
- `pnpm tauri icon src-tauri/icons/icon.png` before the first `cargo check`.

### Glass

Decide window glass up front (docs/GLASS.md, RULES R6.9 and R6.10), the
way you decide plugins:

- **Media, launchers, players, galleries, showcase or onboarding apps:**
  ask the user whether they want window glass, recommending `--glass
  regular` (or `frosted` over a busy wallpaper, `clear` for a player).
- **Dashboards:** off unless the user asks; then `--glass tinted`.
- **Editors, IDEs, consoles, dense tables:** off. Don't ask.

Then place surfaces by job, not taste: toolbars over scrolling content
`regular`, a sidebar over a wallpaper `frosted`, floating controls over
media `clear`, partitions `reeded` or `frost`, and at most one showpiece
per screen (`iridescent`, `oil`, `prism`, `cathedral`, `block`, `dither`
over art). Text goes on 15%+ tint or `legible`, never on a textured or
prism pane. Keep knobs in `GLASS_GUIDE`'s good ranges, and check the app
on macOS: refraction and bent textures are Windows (Chromium) extras.

## Branding

Read [the branding guide](../../../docs/BRANDING.md) and pick the nearest
product reference. Before finalizing a launcher icon, ask the user for the
background direction and heptagram color. Keep the canonical path and
placement. Use the starter tile for the first build and regenerate the
platform icons from the chosen 1024×1024 composition. Use an image-generated
background in ChatGPT or an SVG-generated background in Claude. Place the
canonical SVG over the background. Generate a README banner with
`nexis-design brand banner` and the same background and mark color. In chrome
keep `AppLogo` as the monochrome heptagram.

## 3. Make it the user's app

1. **Contract first.** Define the data types and the Rust commands in
   `src/backend.ts` as typed wrappers over `call(name, args, fallback)` with
   believable fallbacks, so every screen is buildable and viewable in a
   browser.
2. Replace the fixture data at the bottom of `src/App.tsx` with `useLoad(…)`
   over those wrappers. Keep the view a function of state; keep
   filtering/sorting in one `useMemo`. Every data view gets its four states
   (RULES R7.3).
3. Rename views, sidebar items, palette commands and titles; update
   `assets/logo.svg`, `assets/banner.svg`, and `src-tauri/icons/icon.png`.
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
pnpm verify        # nexis-design-check (rules + Tauri wiring) + tsc + vite build
pnpm dev           # in one shell
pnpm look          # in another: five sizes x dark/light, measured, with screenshots
```

Then **run it and look**: `pnpm dev` and screenshot it headless (Playwright
against the Vite URL works: Tauri APIs are gated off and `call` returns its
fallbacks), or `pnpm tauri dev` on a desktop. Check each screen in dark and
light, one other theme, high contrast, at 1024x768 and at 1920x1080 or wider.
Report what you built, what `pnpm verify` said, what you verified by looking,
and what you could not check (native chrome on macOS/Windows/Linux, the Rust
build with `cargo check` if no WebKitGTK was available).
