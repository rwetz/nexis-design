// Ad-hoc screenshot: node scripts/shot.mjs <url> <out.png> [width] [height] [--click=selector]...
import { chromium } from "playwright-core";
import { chromiumPath } from "./browser.mjs";
const [url, out, w = "1440", h = "900", ...rest] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: chromiumPath() });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
page.on("console", (m) => m.type() === "error" && console.error("CONSOLE", m.text()));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
for (const a of rest) {
  if (a.startsWith("--click=")) { await page.click(a.slice(8)); await page.waitForTimeout(400); }
  if (a.startsWith("--hover=")) { await page.hover(a.slice(8)); await page.waitForTimeout(300); }
  if (a.startsWith("--key=")) { await page.keyboard.press(a.slice(6)); await page.waitForTimeout(400); }
}
await page.screenshot({ path: out });
await browser.close();
