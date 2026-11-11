// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

// Which apps use @nexis/design, at what pin, how far behind main they are,
// and which package components they still shadow with a copy of their own.
// Read-only: it changes nothing. Run after merging a fix (AGENTS.md §6,
// "A fix lands everywhere") to see which apps still need it.
//
//   pnpm consumers                # scans the Dev workspace this checkout sits in
//   pnpm consumers <dir>          # or another root

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(process.argv[2] ?? join(HERE, "..", ".."));
const SKIP = new Set(["node_modules", ".git", "dist", "target", "_archive", "worktrees", ".worktrees", ".venv"]);

/** package.json files up to four levels down, skipping build output and archives. */
function findPackages(dir, depth = 0, out = []) {
  if (depth > 4) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) findPackages(p, depth + 1, out);
    else if (name === "package.json") out.push(p);
  }
  return out;
}

const git = (...args) => {
  try {
    return execFileSync("git", ["-C", HERE, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};

const head = git("rev-parse", "origin/main") ?? git("rev-parse", "HEAD");
const ui = new Set(readdirSync(join(HERE, "src/components/ui")).filter((f) => f.endsWith(".tsx") && !f.includes(".test.")));

const rows = [];
for (const pkgPath of findPackages(ROOT)) {
  const dir = dirname(pkgPath);
  if (resolve(dir) === HERE) continue;
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    continue;
  }
  const spec = pkg.dependencies?.["@nexis/design"] ?? pkg.devDependencies?.["@nexis/design"];
  if (!spec) continue;

  let pin;
  let behind = "?";
  if (spec.startsWith("file:") || spec.startsWith("link:")) {
    pin = "local checkout";
    behind = "0 (reinstall)";
  } else {
    const rev = spec.split("#")[1];
    if (!rev) {
      pin = "UNPINNED";
      behind = "moves with main";
    } else {
      pin = rev.slice(0, 7);
      const n = head && git("rev-list", "--count", `${rev}..${head}`);
      behind = n ?? "unknown rev";
    }
  }

  // App-local copies of package components: same file name in the app's own ui folder.
  const own = join(dir, "src/components/ui");
  const shadows = existsSync(own) ? readdirSync(own).filter((f) => ui.has(f)) : [];
  rows.push({ app: relative(ROOT, dir).split("\\").join("/") || ".", pin, behind, shadows });
}

rows.sort((a, b) => a.app.localeCompare(b.app));
console.log(`@nexis/design consumers under ${ROOT} (main at ${head?.slice(0, 7) ?? "?"})\n`);
console.log("| App | Pin | Commits behind | Own copies of package components |");
console.log("|---|---|---|---|");
for (const r of rows) {
  const s = r.shadows.length ? `${r.shadows.length}: ${r.shadows.slice(0, 6).join(", ")}${r.shadows.length > 6 ? ", ..." : ""}` : "none";
  console.log(`| ${r.app} | ${r.pin} | ${r.behind} | ${s} |`);
}
const stale = rows.filter((r) => r.pin === "UNPINNED" || (Number(r.behind) > 0));
console.log(`\n${stale.length} of ${rows.length} need a pin bump (or a pin). See docs/CHANGES.md for what each change asks of an app.`);
