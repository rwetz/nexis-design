// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const actual = resolve(root, "dist/visual/actual");
const diffs = resolve(root, "dist/visual/diff");
const filter = process.argv[2];
rmSync(actual, { recursive: true, force: true });
rmSync(diffs, { recursive: true, force: true });
const result = spawnSync(process.execPath, ["scripts/screenshots.mjs", ...(filter ? [filter] : [])], {
  cwd: root, env: { ...process.env, SCREENSHOT_DIR: actual }, stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);
mkdirSync(diffs, { recursive: true });
const images = readdirSync(actual).filter((file) => file.endsWith(".png") && (!filter || file.includes(filter)));
if (!images.length) throw new Error("No screenshots matched.");

for (const file of images) {
  const golden = resolve(root, "docs/img", file);
  if (!existsSync(golden)) {
    console.error(`Missing baseline for ${file}`);
    process.exitCode = 1;
    continue;
  }
  const before = PNG.sync.read(readFileSync(golden));
  const after = PNG.sync.read(readFileSync(resolve(actual, file)));
  if (before.width !== after.width || before.height !== after.height) {
    console.error(`Screenshot dimensions changed for ${file}`);
    process.exitCode = 1;
    continue;
  }
  const { width, height } = after;
  const diff = new PNG({ width, height });
  const changed = pixelmatch(before.data, after.data, diff.data, width, height, { threshold: 0.12 });
  const fraction = changed / (width * height);
  // Timing of the illustrative mid-animation shot is browser-scheduled.
  const allowance = file === "motion-midframe.png" ? 0.015 : 0.002;
  if (fraction > allowance) {
    writeFileSync(resolve(diffs, file), PNG.sync.write(diff));
    console.error(`${file} differs by ${(fraction * 100).toFixed(2)}%`);
    process.exitCode = 1;
  }
}
