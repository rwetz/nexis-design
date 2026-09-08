# @nexis/design

The design layer shared across the Nexis desktop apps: OKLCH tokens, a runtime
theme engine, borderless window chrome, the bespoke cursor set, and the motion
and platform vocabulary that goes with them.

This replaces the `_design/` copy-paste blueprint that used to live in each app.
That blueprint was explicit that it was "a snapshot + generalized guide, not a
live fork" — and the snapshots drifted exactly as you would expect. By the time
this package was extracted, four apps carried four different `globals.css`, four
different `button.tsx`, and four different `platform.ts`, and the blueprint's own
`ThemeProvider` template had stopped working at all: it imported
`@/modules/settings/store`, `./customThemes` and `./SurfaceLayer` from Nexis, so
no other app could actually use it.

A dependency cannot drift. That is the whole point.

## What's in it

| | |
|---|---|
| `theme/` | `applyTheme` / `clearTheme`, `ThemeProvider` + `useTheme`, the built-in themes, and the `Theme` types. Themes are applied by writing CSS variables and crossfading the window through the View Transitions API. |
| `components/` | `WindowControls` and `ResizeHandles` — the borderless chrome the apps paint themselves on Windows and Linux. |
| `lib/` | `cn`, platform facts (`IS_MAC`, `USE_CUSTOM_WINDOW_CONTROLS`), the keyboard-label vocabulary (`MOD_KEY`, `fmtShortcut`, …), and the shared motion springs. |
| `styles/` | `globals.css`, the `globals.ide.css` variant, `fonts.css`, `code-highlight.css`, and `tokens.ts` for reading resolved token values back out at runtime. |
| `assets/cursors/` | The "Tailless Smooth" cursor set — 29 PNGs plus `hotspots.json`. |
| `docs/` | The design language, the scaffolding guide, the pitfalls, and the asset manifest. |

## Install

It is consumed straight from git — there is no npm publish step:

```jsonc
// package.json
"dependencies": {
  "@nexis/design": "github:rwetz/nexis-design"
}
```

Then three wiring steps, all of which the apps in this family already do:

**1. Import a stylesheet.** Pick one variant — they share an identical core; the
IDE one adds rules for xterm and CodeMirror:

```ts
import "@nexis/design/styles/fonts.css";
import "@nexis/design/styles/globals.css";      // any app
// import "@nexis/design/styles/globals.ide.css";  // if you embed a terminal or editor
```

**2. Copy the cursors into your public dir.** A CSS `cursor: url()` is resolved
by the browser against the document, so it cannot reach into `node_modules` —
the PNGs have to physically land in the served static directory:

```jsonc
"scripts": {
  "postinstall": "nexis-design-assets"   // -> public/cursors/
}
```

**3. Point Tailwind at the package.** Tailwind v4 only generates classes it can
see, and it does not scan dependencies by default. Without this the window
controls and resize handles render unstyled:

```css
@import "tailwindcss";
@source "../node_modules/@nexis/design/src";
```

## Use

```tsx
import { ThemeProvider, useTheme, WindowControls, ResizeHandles, IS_MAC, cn } from "@nexis/design";

export default function App() {
  return (
    <ThemeProvider>
      <header className={cn("flex h-10 items-center", IS_MAC ? "pl-20" : "pl-3")}>
        <WindowControls />
      </header>
      <ResizeHandles />
    </ThemeProvider>
  );
}
```

## Why it ships TypeScript source

Every consumer is Vite + TypeScript, so a build step buys nothing their own
bundler does not already do — and it would add a compile-and-publish pipeline to
a dependency that is otherwise resolved directly from git. The cost is that
consumers must be able to compile TS from a dependency, which all of them can.
Revisit this if something outside the family ever needs it.

## What is deliberately *not* here

**The shadcn/ui components** (`button`, `dropdown-menu`, `tooltip`, `sonner`).
shadcn's model is that you copy a component into your app and own it, so
centralizing them fights the tool: an app could no longer edit a variant without
editing every app. They stay per-app, as the original blueprint had them.

**Nexis's icon layer.** Nexis routes every icon through its own `icon.tsx` choke
point over Phosphor, with a semantic name per idea; the smaller apps use
Hugeicons directly. Unifying those is a real decision about the icon vocabulary,
not a packaging one, and it belongs in its own change.

## Relationship to Nexis

Nexis remains the reference implementation and the source the design language is
extracted *from* — it is not currently a consumer. It carries a substantially
larger surface (a 743-line `globals.css` against this package's 417, a hardened
icon system, terminal and editor theming) plus tripwire tests that enforce its
own invariants. Migrating it is worth doing file by file, starting with
`applyTheme.ts`, which is already byte-identical to the copy here — not as a
single sweep.

## License

[Apache-2.0](LICENSE), matching the rest of the family.
