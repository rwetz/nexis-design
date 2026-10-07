#!/usr/bin/env node
// Copy the design system's runtime assets into a consuming app's public dir.
//
// The cursor rules in globals.css reference `/cursors/*.png` as absolute URLs,
// because a CSS `cursor: url()` is resolved by the browser against the document
// — it cannot reach into node_modules. So the PNGs have to physically land in
// the app's served static directory. This copies them there.
//
//   pnpm exec nexis-design-assets            # -> ./public
//   pnpm exec nexis-design-assets dist/web   # -> ./dist/web
//
// Idempotent: re-running overwrites, so it is safe as a postinstall or a
// prebuild step.

import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(pkgRoot, "assets", "cursors");
const dest = resolve(process.cwd(), process.argv[2] ?? "public", "cursors");

if (!existsSync(src)) {
  console.error(`nexis-design: no assets at ${src}`);
  process.exit(1);
}

await mkdir(dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`nexis-design: cursors -> ${dest}`);
