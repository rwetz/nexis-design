// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import axe from "axe-core";
import { chromium } from "playwright-core";
import { createServer } from "vite";

const configFile = fileURLToPath(new URL("../vite.config.ts", import.meta.url));
const baselineFile = new URL("./a11y-baseline.json", import.meta.url);
const record = process.env.AXE_RECORD;
const baseline = record ? {} : JSON.parse(readFileSync(baselineFile, "utf8"));
const observed = {};
const server = await createServer({ configFile, logLevel: "error" });
let browser;
try {
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const open = async (route, mode, contrast) => {
    // Reload to reinitialize the provider even when only hash or theme changes.
    await page.goto(`${base}?shot=1&still=1&mode=${mode}&contrast=${contrast}#/${route}`, { waitUntil: "domcontentloaded" });
    await page.locator("#root > *").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
  };
  await open("overview", "dark", "standard");
  const routeList = process.env.AXE_ROUTES ?? await page.locator("[data-gallery-routes]").getAttribute("data-gallery-routes");
  const routes = routeList.split(" ");
  const filter = process.argv[2];
  const selected = routes.filter((route) => !filter || route.includes(filter));
  if (!selected.length) throw new Error(`No gallery routes match ${filter}`);
  let failed = 0;
  let known = 0;
  const errors = new Set();
  page.on("pageerror", (e) => errors.add(e.message));
  for (const route of selected) {
    for (const mode of ["dark", "light"]) {
      for (const contrast of ["standard", "high"]) {
        await open(route, mode, contrast);
        await page.addScriptTag({ content: axe.source });
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run({
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
          });
          return result.violations.map(({ id, nodes }) => ({
            id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
          }));
        });
        for (const { id, nodes } of violations) {
          for (const node of nodes) {
            const target = node.target.join(" > ");
            // Page order and identical siblings can change axe's selector prefix.
            let element = target.split(" > ").at(-1).replace(/:nth-child\(\d+\)/g, "");
            // Both settings views share the same Save control. Match its
            // alternate axe selector to the finding from the original view.
            if (route === "app/settings-deep" && id === "color-contrast" && element === ".text-brand-foreground") {
              element = ".bg-brand";
            }
            const key = `${route} ${mode}/${contrast} ${id} ${element}`;
            const count = (observed[key] ?? 0) + 1;
            observed[key] = count;
            const siblingKey = route === "app/settings-deep" ? key.replace("app/settings-deep ", "app/settings ") : key;
            if (count <= (baseline[siblingKey] ?? 0)) known++;
            else {
              failed++;
              if (!record) console.error(`${route} (${mode}/${contrast}) ${id}\n  ${target} ${node.failureSummary}`);
            }
          }
        }
      }
    }
  }
  for (const error of errors) console.error(error);
  if (record) {
    const sorted = Object.fromEntries(Object.entries(observed).sort(([a], [b]) => a.localeCompare(b, "en-US")));
    writeFileSync(record, `${JSON.stringify(sorted, null, 2)}\n`);
  }
  console.log(`axe checked ${selected.length * 4} gallery states. Baseline findings: ${known}. Additional findings: ${failed}.`);
  if ((!record && failed) || errors.size) process.exitCode = 1;
} finally {
  await browser?.close();
  await server.close();
}
