// Finds a Chromium for the headless scripts. A hardcoded Playwright revision
// path rots every time the browser is updated, so look in order: $CHROMIUM,
// the path Playwright itself resolves, /opt/pw-browsers (cloud containers),
// then the usual system names.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

export function chromiumPath() {
  const tried = [];
  const ok = (p) => {
    if (!p) return null;
    tried.push(p);
    try {
      return existsSync(p) && statSync(p).isFile() ? p : null;
    } catch {
      return null;
    }
  };
  const fromEnv = ok(process.env.CHROMIUM);
  if (fromEnv) return fromEnv;
  const own = ok(chromium.executablePath());
  if (own) return own;
  const base = "/opt/pw-browsers";
  const bare = ok(join(base, "chromium"));
  if (bare) return bare;
  if (existsSync(base)) {
    for (const d of readdirSync(base).filter((n) => /^chromium-\d+$/.test(n)).sort().reverse()) {
      for (const sub of ["chrome-linux64/chrome", "chrome-linux/chrome"]) {
        const p = ok(join(base, d, sub));
        if (p) return p;
      }
    }
  }
  for (const dir of (process.env.PATH ?? "").split(":")) {
    for (const name of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
      const p = ok(join(dir, name));
      if (p) return p;
    }
  }
  throw new Error(`no Chromium found (tried ${tried.join(", ")}); set CHROMIUM=/path/to/chrome`);
}
