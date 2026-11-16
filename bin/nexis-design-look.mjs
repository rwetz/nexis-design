#!/usr/bin/env node
// Look at a running app the way RULES R12.2 says to, and report what a
// regex cannot see: the page at 1024x768 up to 3840x2160, dark and light,
// checked for what is broken at that size.
//
//   pnpm dev                                  # or any URL serving the app
//   pnpm exec nexis-design-look               # http://localhost:1420
//   pnpm exec nexis-design-look http://localhost:5173 --out=look --sizes=1024x768,1920x1080
//
// Writes a screenshot per size and mode into --out (default ./look) and
// prints findings. Errors exit 1; warnings do not. It reports facts a person
// then judges: it cannot tell whether a layout is good, only that something
// is cut off, overflowing, unlabeled or throwing. Looking at the screenshots
// is still the check for "empty bands, things that should line up".
//
// Needs playwright-core and a Chromium (CHROMIUM=/path, or Playwright's).

import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromiumPath } from "./chromium-path.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const url = args.find((a) => !a.startsWith("--")) ?? "http://localhost:1420";
const out = resolve(flag("out", "look"));
const SIZES = flag("sizes", "1024x768,1440x900,1920x1080,2560x1440,3840x2160")
  .split(",")
  .map((s) => s.split("x").map(Number));
const MODES = flag("modes", "dark,light").split(",");
const settle = Number(flag("settle", "800"));

const { chromium } = await import("playwright-core");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: await chromiumPath() });

/** Runs in the page: every fact is measured, none is guessed. */
function probe() {
  const vw = innerWidth;
  const found = [];
  const label = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const slot = el.getAttribute("data-slot");
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 32);
    return `${el.tagName.toLowerCase()}${id}${slot ? `[${slot}]` : ""}${cls ? "." + cls : ""}${text ? ` "${text}"` : ""}`;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };
  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") return true;
    }
    return false;
  };

  if (document.documentElement.scrollWidth > vw + 1)
    found.push({ level: "error", id: "overflow-page", message: `the page scrolls sideways (${document.documentElement.scrollWidth}px content in ${vw}px)` });

  let offscreen = 0, clipped = 0, small = 0, tiny = 0, unlabeled = 0, broken = 0;
  const cap = (n, entry) => n < 6 && found.push(entry);
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("[aria-hidden='true'], svg, script, style, .sr-only")) continue;
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);

    if ((r.right > vw + 1 || r.left < -1) && cs.position !== "fixed" && !clippedByAncestor(el)) {
      cap(offscreen++, { level: "error", id: "off-viewport", message: `${label(el)} sticks out of the window (${Math.round(r.left)} to ${Math.round(r.right)} of ${vw})` });
    }
    // Text cut off with no ellipsis to say so.
    if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX === "hidden" && cs.textOverflow !== "ellipsis" && (el.textContent || "").trim() && el.children.length === 0) {
      cap(clipped++, { level: "warn", id: "text-clipped", message: `${label(el)} cuts its text off with no ellipsis` });
    }
    // Text below the type scale's floor (10px at 100%; the scale only grows it).
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (own && parseFloat(cs.fontSize) < 9.5) cap(small++, { level: "warn", id: "text-small", message: `${label(el)} is ${cs.fontSize}, under the 10px floor` });

    if (el.matches("button, a[href], [role=button], input:not([type=hidden]), select, [role=tab], [role=menuitem]")) {
      if ((r.width < 24 || r.height < 24) && !el.closest("[data-slot='checkbox'], [data-slot='switch'], [data-slot='radio-group-item']"))
        cap(tiny++, { level: "warn", id: "target-small", message: `${label(el)} is ${Math.round(r.width)}x${Math.round(r.height)}, under the 24px minimum (R7.1)` });
      if (el.matches("button, a[href], [role=button], [role=tab]")) {
        // A control named by a wrapping or associated <label> has a name too.
        const labelled = [...(el.labels ?? [])].map((l) => l.textContent).join("") || el.closest("label")?.textContent || "";
        const name = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title") || el.textContent || labelled).trim();
        if (!name) cap(unlabeled++, { level: "error", id: "unlabeled-control", message: `${label(el)} has no text or aria-label (an icon-only control must be named)` });
      }
    }
    if (el.tagName === "IMG" && el.complete && el.naturalWidth === 0) cap(broken++, { level: "error", id: "image-broken", message: `${label(el)} failed to load` });
  }
  const extra = (n, id, what) => (n > 6 ? [{ level: "info", id, message: `and ${n - 6} more ${what}` }] : []);
  return [...found, ...extra(offscreen, "off-viewport", "elements off the window"), ...extra(clipped, "text-clipped", "clipped texts"), ...extra(tiny, "target-small", "small targets")];
}

const all = [];
for (const mode of MODES) {
  const context = await browser.newContext({ colorScheme: mode });
  for (const [w, h] of SIZES) {
    const page = await context.newPage();
    await page.setViewportSize({ width: w, height: h });
    const errors = [];
    page.on("pageerror", (e) => errors.push(`uncaught: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource.*(favicon|cursors)/.test(m.text())) errors.push(`console: ${m.text().split("\n")[0].slice(0, 160)}`);
    });
    page.on("requestfailed", (r) => !/favicon|cursors/.test(r.url()) && errors.push(`request failed: ${r.url().slice(0, 100)}`));
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    } catch (e) {
      all.push({ size: `${w}x${h}`, mode, level: "error", id: "load", message: `could not load ${url}: ${e.message.split("\n")[0]}` });
      await page.close();
      continue;
    }
    await page.waitForTimeout(settle);
    for (const e of errors) all.push({ size: `${w}x${h}`, mode, level: "error", id: "runtime", message: e });
    for (const f of await page.evaluate(probe)) all.push({ size: `${w}x${h}`, mode, ...f });
    await page.screenshot({ path: join(out, `${w}x${h}-${mode}.png`) });
    await page.close();
  }
  await context.close();
}
await browser.close();

// The same finding at five sizes is one finding: group, and say where.
const groups = new Map();
for (const f of all) {
  const key = `${f.level}|${f.id}|${f.message}`;
  const g = groups.get(key) ?? { ...f, where: [] };
  g.where.push(f.size ? `${f.size} ${f.mode}` : "");
  groups.set(key, g);
}
const order = { error: 0, warn: 1, info: 2 };
const list = [...groups.values()].sort((a, b) => order[a.level] - order[b.level]);
for (const g of list) {
  const where = g.where.length === SIZES.length * MODES.length ? "every size" : g.where.slice(0, 4).join(", ") + (g.where.length > 4 ? ` +${g.where.length - 4}` : "");
  console.log(`${g.level.padEnd(5)} [${g.id}] ${g.message}\n      at ${where}`);
}
const errors = list.filter((g) => g.level === "error").length;
const warns = list.filter((g) => g.level === "warn").length;
console.log(`\nnexis-design-look: ${SIZES.length * MODES.length} views, ${errors} error${errors === 1 ? "" : "s"}, ${warns} warning${warns === 1 ? "" : "s"}. Screenshots in ${out}: look at them.`);
process.exit(errors ? 1 : 0);
