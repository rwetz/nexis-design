// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

// Carry the latest release to every app (AGENTS.md §6, "A fix lands
// everywhere"). For each app in scripts/family.json it clones the repo,
// points @nexis/design at `github:rwetz/nexis-design#semver:^<release>`,
// refreshes the lockfile, and opens a PR whose body is the CHANGES.md entries
// the app has not had yet, with their **Apps must** lines as a checklist.
// It never merges. Uses your `gh` login; no tokens to set up.
//
//   pnpm family-sync                    # every app, latest tag
//   pnpm family-sync --apps Nexis,vitrine
//   pnpm family-sync --dry-run          # show what each PR would be

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const only = (() => {
  const i = args.indexOf("--apps");
  return i === -1 ? null : new Set(args[i + 1].split(",").map((s) => s.trim().toLowerCase()));
})();

const sh = (cwd, cmd, ...a) => execFileSync(cmd, a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const tryOut = (cwd, cmd, ...a) => {
  try {
    return sh(cwd, cmd, ...a);
  } catch {
    return null;
  }
};

// ── The release to carry: the newest v* tag on origin. ───────────────────────
sh(HERE, "git", "fetch", "--quiet", "--tags", "origin");
const tag = sh(HERE, "git", "tag", "--list", "v*", "--sort=-v:refname").split("\n")[0];
if (!tag) {
  console.error("family-sync: no v* tag yet. Cut one with `pnpm release minor` first.");
  process.exit(1);
}
const [maj, min] = tag.slice(1).split(".").map(Number);
const range = maj === 0 ? `^0.${min}.0` : `^${maj}.0.0`;
const spec = `github:rwetz/nexis-design#semver:${range}`;
const branch = `nexis-design/${tag}`;

/** The nexis-design commit an app's lockfile resolves to, if it can be read. */
function lockedRev(appDir) {
  for (const f of ["pnpm-lock.yaml", "package-lock.json"]) {
    const p = join(appDir, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, "utf8").match(/nexis-design[^\s"']*?([0-9a-f]{40})/);
    if (m) return m[1];
  }
  return null;
}

/** CHANGES.md entries added between an app's old commit and the release. */
function missedChanges(oldRev) {
  const known = oldRev && tryOut(HERE, "git", "cat-file", "-e", `${oldRev}^{commit}`) !== null;
  const diff = known ? tryOut(HERE, "git", "diff", "--unified=0", `${oldRev}..${tag}`, "--", "docs/CHANGES.md") : null;
  if (diff === null) return { text: readFileSync(join(HERE, "docs/CHANGES.md"), "utf8"), exact: false };
  const added = diff
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .map((l) => l.slice(1));
  return { text: added.join("\n"), exact: true };
}

/** Each "**Apps must**" paragraph, as one checklist item. */
function checklist(text) {
  const items = [];
  for (const para of text.split(/\n\s*\n/)) {
    const p = para.trim();
    if (/^\*\*Apps must/.test(p)) items.push(`- [ ] ${p.replace(/\s*\n\s*/g, " ")}`);
  }
  return items;
}

const { apps } = JSON.parse(readFileSync(join(HERE, "scripts/family.json"), "utf8"));
const work = mkdtempSync(join(tmpdir(), "nexis-family-"));
const results = [];

for (const app of apps) {
  const name = app.repo.split("/")[1];
  if (only && !only.has(name.toLowerCase())) continue;
  const clone = join(work, name);
  const say = (status, extra = "") => {
    results.push({ name, status, extra });
    console.log(`${name.padEnd(14)} ${status}${extra ? `  ${extra}` : ""}`);
  };

  try {
    const open = sh(HERE, "gh", "pr", "list", "-R", app.repo, "--head", branch, "--json", "url", "-q", ".[0].url");
    if (open) {
      say("PR already open", open);
      continue;
    }

    sh(work, "gh", "repo", "clone", app.repo, clone, "--", "--depth", "1", "--quiet");
    const dir = join(clone, app.dir);
    const pkgPath = join(dir, "package.json");
    const pkgText = readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(pkgText);
    const field = pkg.dependencies?.["@nexis/design"] ? "dependencies" : pkg.devDependencies?.["@nexis/design"] ? "devDependencies" : null;
    if (!field) {
      say("skipped", "no @nexis/design dependency");
      continue;
    }
    const oldSpec = pkg[field]["@nexis/design"];
    const oldRev = lockedRev(dir) ?? oldSpec.match(/#([0-9a-f]{7,40})$/)?.[1] ?? null;

    // Replace the spec in place so the file keeps its own formatting.
    const quoted = JSON.stringify(oldSpec);
    writeFileSync(pkgPath, pkgText.replace(`"@nexis/design": ${quoted}`, `"@nexis/design": ${JSON.stringify(spec)}`));

    const npm = existsSync(join(dir, "package-lock.json")) && !existsSync(join(dir, "pnpm-lock.yaml"));
    if (npm) sh(dir, "npm", "install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund");
    else sh(dir, "pnpm", "install", "--lockfile-only", "--ignore-scripts");

    if (!sh(clone, "git", "status", "--porcelain")) {
      say("up to date", `${oldSpec}`);
      continue;
    }

    const missed = missedChanges(oldRev);
    const todo = checklist(missed.text);
    const from = oldRev ? `\`${oldRev.slice(0, 7)}\`` : `\`${oldSpec}\``;
    let body = [
      `Moves \`@nexis/design\` from ${from} to the **${tag}** range: \`${spec}\`.`,
      "",
      "From now on patch releases arrive with `pnpm install`; the next minor comes as another PR like this one.",
      "",
      "After merging, delete `node_modules/.vite` (or run `pnpm dev --force` once) so Vite stops serving the old package (PITFALLS §17).",
      "",
      todo.length ? `### Apps must (${todo.length})\n\n${todo.join("\n")}` : "### Apps must\n\nNothing beyond the reinstall.",
      "",
      `<details><summary>CHANGES.md entries this app ${missed.exact ? "has not had" : "may not have had (old pin unknown, so all of them)"}</summary>\n\n${missed.text.trim()}\n\n</details>`,
      "",
      `Opened by \`pnpm family-sync\` in rwetz/nexis-design. [Compare](https://github.com/rwetz/nexis-design/compare/${oldRev ?? "main"}...${tag})`,
    ].join("\n");
    if (body.length > 60000) body = `${body.slice(0, 60000)}\n\n…(truncated; see docs/CHANGES.md)`;

    if (dry) {
      say("would open PR", `${from} -> ${tag}, ${todo.length} Apps must`);
      continue;
    }

    sh(clone, "git", "switch", "--quiet", "-c", branch);
    sh(clone, "git", "commit", "--quiet", "-am", `Move @nexis/design to ${tag} (${range})`);
    sh(clone, "git", "push", "--quiet", "-u", "origin", branch);
    const bodyFile = join(work, `${name}.md`);
    writeFileSync(bodyFile, body);
    const url = sh(clone, "gh", "pr", "create", "-R", app.repo, "--head", branch, "--title", `Move @nexis/design to ${tag}`, "--body-file", bodyFile);
    say("opened", url);
  } catch (e) {
    say("FAILED", String(e.stderr || e.message).split("\n").filter(Boolean).slice(-2).join(" | "));
  }
}

rmSync(work, { recursive: true, force: true });
const failed = results.filter((r) => r.status === "FAILED").length;
console.log(`\n${results.length} apps, ${failed} failed. Spec: ${spec}`);
process.exit(failed ? 1 : 0);
