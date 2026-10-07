// Regenerates every image in docs/img from the live gallery.
//
//   pnpm screenshots                 # all of them
//   pnpm screenshots app-dashboard   # only names containing a filter
//
// Boots the gallery with Vite's API, drives it with Playwright, and writes
// PNGs. Uses the system Chromium (CHROMIUM env, else Playwright's cached one)
// so nothing is downloaded. Animations are pinned at their end state with
// ?still, except where a shot exists to catch motion mid-frame.
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "docs/img");
mkdirSync(OUT, { recursive: true });

const CHROMIUM = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const W = 1440;
const H = 900;

/** name, route, query, viewport and the interaction that sets the scene. */
const SHOTS = [
  { name: "showcase-dark", route: "overview", q: { mode: "dark" } },
  { name: "showcase-light", route: "overview", q: { mode: "light", theme: "halcyon" } },
  { name: "themes-dark", route: "themes", q: { mode: "dark" }, h: 1180 },
  { name: "themes-light", route: "themes", q: { mode: "light", theme: "aurelian" }, h: 1180 },
  { name: "foundations", route: "foundations", q: { mode: "dark" }, h: 1250 },
  { name: "components-controls", route: "controls", q: { mode: "dark" }, h: 1180 },
  { name: "components-controls-light", route: "controls", q: { mode: "light", theme: "meridian" }, h: 1180 },
  { name: "components-forms", route: "forms", q: { mode: "dark", theme: "thicket" }, h: 980 },
  {
    name: "components-menu",
    route: "overlays",
    q: { mode: "dark" },
    act: async (p) => {
      await p.click('[data-shot="menu-trigger"]');
      await p.hover('[data-shot="submenu-trigger"]');
      await p.waitForTimeout(400);
    },
  },
  {
    name: "components-palette",
    route: "overview",
    q: { mode: "dark", theme: "ultraviolet" },
    act: async (p) => {
      await p.keyboard.press("Control+Shift+P");
      await p.waitForTimeout(250);
      await p.keyboard.type("templ");
      await p.waitForTimeout(300);
    },
  },
  {
    name: "components-dialog",
    route: "overlays",
    q: { mode: "dark" },
    act: async (p) => {
      await p.click('[data-shot="confirm-trigger"]');
      await p.waitForTimeout(300);
    },
  },
  {
    name: "components-sheet",
    route: "overlays",
    q: { mode: "light", theme: "cinder" },
    act: async (p) => {
      await p.click('[data-shot="sheet-trigger"]');
      await p.waitForTimeout(300);
    },
  },
  {
    name: "components-toasts",
    route: "feedback",
    q: { mode: "dark" },
    still: false,
    act: async (p) => {
      for (const b of ["Success", "Error", "With action"]) {
        await p.getByRole("button", { name: b, exact: true }).click();
        await p.waitForTimeout(150);
      }
      await p.waitForTimeout(500);
      // Sonner stacks toasts collapsed; hovering the stack fans it out.
      await p.hover("[data-sonner-toast]");
      await p.waitForTimeout(600);
    },
  },
  { name: "components-navigation", route: "navigation", q: { mode: "dark" }, h: 960 },
  { name: "components-data", route: "data", q: { mode: "dark" }, h: 1180 },
  { name: "components-charts", route: "charts", q: { mode: "dark" }, h: 1200 },
  { name: "components-feedback", route: "feedback", q: { mode: "light" } },
  { name: "components-layout", route: "layout", q: { mode: "dark", theme: "tokyo-night" }, h: 820 },
  { name: "icons", route: "icons", q: { mode: "dark" }, h: 1100 },
  { name: "chrome", route: "chrome", q: { mode: "dark" }, h: 960 },
  { name: "high-contrast", route: "controls", q: { mode: "dark", contrast: "high" } },
  {
    name: "motion-midframe",
    route: "motion",
    q: { mode: "dark" },
    still: false,
    h: 1100,
    act: async (p) => {
      await p.getByRole("button", { name: "Replay" }).click();
      await p.waitForTimeout(150);
    },
  },
  { name: "app-dashboard", route: "app/dashboard", q: { mode: "dark" } },
  { name: "app-workbench", route: "app/workbench", q: { mode: "dark", theme: "halcyon" } },
  { name: "app-settings", route: "app/settings", q: { mode: "light", theme: "aurelian" } },
  { name: "app-explorer", route: "app/explorer", q: { mode: "light" } },
  { name: "app-console", route: "app/console", q: { mode: "dark", theme: "cinder" } },
  {
    name: "app-wizard",
    route: "app/wizard",
    q: { mode: "dark", theme: "ultramarine" },
    act: async (p) => {
      await p.fill("input", "nexis-pulse");
      await p.getByRole("button", { name: "Next" }).click();
      await p.waitForTimeout(300);
    },
  },
  { name: "app-minimal", route: "app/minimal", q: { mode: "dark" } },
];

const filter = process.argv[2];
const server = await createServer({ configFile: resolve(ROOT, "vite.config.ts"), server: { port: 5299, strictPort: false }, logLevel: "error" });
await server.listen();
const base = server.resolvedUrls.local[0];

const browser = await chromium.launch({ executablePath: CHROMIUM });
let failed = 0;
for (const s of SHOTS.filter((x) => !filter || x.name.includes(filter))) {
  const ctx = await browser.newContext({ viewport: { width: W, height: s.h ?? H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const q = new URLSearchParams({ ...s.q, shot: "1", ...(s.still === false ? {} : { still: "1" }) });
  await page.goto(`${base}?${q}#/${s.route}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  if (s.act) await s.act(page);
  await page.screenshot({ path: resolve(OUT, `${s.name}.png`) });
  if (errors.length) {
    failed++;
    console.error(`✗ ${s.name}: ${errors.join("; ")}`);
  } else console.log(`✓ ${s.name}`);
  await ctx.close();
}
await browser.close();
await server.close();
process.exit(failed ? 1 : 0);
