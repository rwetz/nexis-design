# CLAUDE.md

Read [AGENTS.md](AGENTS.md) — it is the single source of instructions for
this repo, both for building apps with @nexis/design and for working on the
package itself.

To scaffold a new app, use the `nexis-scaffold` skill
(`.claude/skills/nexis-scaffold/SKILL.md`), which drives
`scripts/new-app.sh`.

Before finishing any change here: `pnpm typecheck`, `pnpm test`, and look at
the result in the gallery (`pnpm dev`, or `scripts/shot.mjs` headless). If the
change is visible, regenerate the affected screenshots with
`pnpm screenshots <filter>`.

Nexis (github.com/rwetz/Nexis) is the source of the themes, the stylesheet,
the icon registry and most components. Keep them in step with it.
