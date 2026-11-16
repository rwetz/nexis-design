// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { parseArgs } from "node:util";

const mime = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const escape = (value) => value.replace(/[&<>"']/g, (character) => entities[character]);
const hex = /^#[\da-f]{6}$/i;

export function writeBanner(args) {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      background: { type: "string" },
      "mark-color": { type: "string" },
      "title-color": { type: "string", default: "#F0F3F7" },
      out: { type: "string", default: "assets/banner.svg" },
    },
  });
  const title = positionals[0]?.trim().replace(/\s+/g, " ");
  if (!title || positionals.length !== 1) throw new Error("Pass one app title in quotes.");
  for (const key of ["mark-color", "title-color"]) {
    if (values[key] !== undefined && !hex.test(values[key])) throw new Error(`--${key} takes a six-digit hex color.`);
  }

  const tile = readFileSync(new URL("../assets/brand/nexis-logo.svg", import.meta.url), "utf8");
  const defs = tile.match(/<defs>[\s\S]*?<\/defs>/)?.[0];
  const mark = tile.match(/<path\b[^>]+\/>/)?.[0];
  if (!defs || !mark) throw new Error("The canonical Nexis tile is missing its paint or mark.");
  const foreground = values["mark-color"] ? mark.replace(/fill="[^"]+"/, `fill="${values["mark-color"]}"`) : mark;

  let background = '<rect width="500" height="300" fill="url(#glass)"/>';
  if (values.background) {
    const type = mime[extname(values.background).toLowerCase()];
    if (!type) throw new Error("Use a PNG, JPEG, WebP or SVG background.");
    const bytes = readFileSync(values.background).toString("base64");
    background = `<image width="500" height="300" preserveAspectRatio="xMidYMid slice" href="data:${type};base64,${bytes}"/>`;
  }

  const name = escape(title);
  const length = Array.from(title).length;
  const textSize = Math.min(46, Math.floor(270 / (length * 0.76)));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300" role="img" aria-labelledby="app-title">
  <title id="app-title">${name}</title>
  ${defs}
  <clipPath id="nexis-banner-clip"><rect width="500" height="300" rx="22"/></clipPath>
  <g clip-path="url(#nexis-banner-clip)">${background}</g>
  <rect x=".5" y=".5" width="499" height="299" rx="21.5" fill="none" stroke="url(#rim)"/>
  <g transform="translate(34 80) scale(.13671875)">${foreground}</g>
  <text x="188" y="150" dominant-baseline="central" fill="${values["title-color"]}" font-family="system-ui, sans-serif" font-size="${textSize}" font-weight="650">${name}</text>
</svg>
`;
  writeFileSync(values.out, svg);
  console.log(values.out);
}
