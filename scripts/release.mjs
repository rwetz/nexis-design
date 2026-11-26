// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

// Cut a release: gather every "## Unreleased" entry at the top of
// docs/CHANGES.md under one "## X.Y.Z · date" heading, bump package.json,
// commit, tag vX.Y.Z, push, and publish a GitHub release with those notes.
// Apps depend on a range (github:rwetz/nexis-design#semver:^0.3.0), so a patch
// reaches them on their next install and a minor arrives through
// `pnpm family-sync`.
//
//   pnpm release patch|minor|major [--dry-run]
//
// 0.x rule: a change that asks anything of apps (an **Apps must** beyond
// "reinstall") is a minor; a fix that asks nothing is a patch.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const level = args.find((a) => !a.startsWith("--"));
if (!["patch", "minor", "major"].includes(level)) {
  console.error("usage: pnpm release patch|minor|major [--dry-run]");
  process.exit(1);
}

const run = (cmd, ...a) => execFileSync(cmd, a, { cwd: HERE, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const fail = (msg) => {
  console.error(`release: ${msg}`);
  process.exit(1);
};

// ── Preconditions: a clean main that matches origin. ─────────────────────────
if (run("git", "branch", "--show-current") !== "main") fail("run it on main");
if (run("git", "status", "--porcelain")) fail("the working tree has changes; commit or stash them first");
run("git", "fetch", "--quiet", "--tags", "origin");
if (run("git", "rev-parse", "HEAD") !== run("git", "rev-parse", "origin/main")) fail("main is not in step with origin/main; pull or push first");

// ── Next version. ────────────────────────────────────────────────────────────
const pkgPath = join(HERE, "package.json");
const pkgText = readFileSync(pkgPath, "utf8");
const current = JSON.parse(pkgText).version;
const [maj, min, pat] = current.split(".").map(Number);
const next = level === "major" ? `${maj + 1}.0.0` : level === "minor" ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;
const tag = `v${next}`;
if (run("git", "tag", "--list", tag)) fail(`${tag} already exists`);

// ── Fold the Unreleased entries into one versioned section. ──────────────────
const changesPath = join(HERE, "docs/CHANGES.md");
const lines = readFileSync(changesPath, "utf8").split("\n");
const firstH2 = lines.findIndex((l) => l.startsWith("## "));
const firstReleased = lines.findIndex((l, i) => i > firstH2 && /^## (\d|v\d)/.test(l));
const end = firstReleased === -1 ? lines.length : firstReleased;
const block = lines.slice(firstH2, end);
if (firstH2 === -1 || !block[0].startsWith("## Unreleased")) fail('no "## Unreleased" entry at the top of docs/CHANGES.md: nothing to release');

const date = new Date().toISOString().slice(0, 10);
const body = block.map((l) => {
  if (!l.startsWith("## Unreleased")) return l;
  // "## Unreleased (detail pass)" -> "### Detail pass"; a bare one -> "### Changes".
  const rest = l.slice("## Unreleased".length).replace(/^\s*[·:-]?\s*/, "").replace(/^\((.*)\)$/, "$1").trim();
  return `### ${rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : "Changes"}`;
});
const section = [`## ${next} · ${date}`, "", ...body];
const out = [...lines.slice(0, firstH2), ...section, ...lines.slice(end)].join("\n");
const [nMaj, nMin] = next.split(".").map(Number);
const range = nMaj === 0 ? `^0.${nMin}.0` : `^${nMaj}.0.0`;
const notes = body.join("\n").trim() + `\n\nApps on \`github:rwetz/nexis-design#semver:${range}\` pick this up with \`pnpm install\`. Run \`pnpm family-sync\` to open the bump PRs for apps on an older range.\n`;

console.log(`release ${current} -> ${next} (${tag})\n`);
console.log(notes);
if (dry) {
  console.log("--dry-run: nothing written");
  process.exit(0);
}

writeFileSync(changesPath, out);
writeFileSync(pkgPath, pkgText.replace(`"version": "${current}"`, `"version": "${next}"`));
run("git", "add", "docs/CHANGES.md", "package.json");
run("git", "commit", "--quiet", "-m", `Release ${tag}`);
run("git", "tag", "-a", tag, "-m", `@nexis/design ${next}`);
run("git", "push", "--quiet", "origin", "main", tag);

const notesFile = join(mkdtempSync(join(tmpdir(), "nexis-release-")), "notes.md");
writeFileSync(notesFile, notes);
run("gh", "release", "create", tag, "--title", `@nexis/design ${next}`, "--notes-file", notesFile, "--verify-tag");
console.log(`published ${tag}. Next: pnpm family-sync`);
