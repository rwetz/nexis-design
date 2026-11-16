#!/usr/bin/env node
// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [section, command, ...args] = process.argv.slice(2);
if (section !== "theme" || command !== "new") {
  console.error("Usage: nexis-design theme new <id> --hue <degrees> [--help]");
  process.exitCode = section === "--help" ? 0 : 1;
} else {
  const script = fileURLToPath(new URL("./generate-theme-palettes.py", import.meta.url));
  const candidates = process.platform === "win32" ? ["py", "python3", "python"] : ["python3", "python"];
  for (const python of candidates) {
    const flags = python === "py" ? ["-3"] : [];
    const result = spawnSync(python, [...flags, script, ...args], { stdio: "inherit" });
    if (result.error?.code === "ENOENT") continue;
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
  console.error("Theme generation requires Python 3.");
  process.exitCode = 1;
}
