// The family's design rules, as tripwires. Each one exists because the thing
// it forbids already happened somewhere — see docs/PITFALLS.md and Nexis's
// AGENTS.md for the incident behind each.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

function walk(dir: string, exts = [".ts", ".tsx", ".css"]): [string, string][] {
  const out: [string, string][] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => name.endsWith(e)) && !name.includes(".test.")) out.push([relative(ROOT, p), readFileSync(p, "utf8")]);
  }
  return out;
}

const SHIPPED = [...walk(join(ROOT, "src")), ...walk(join(ROOT, "templates"))];
const EVERYTHING = [...SHIPPED, ...walk(join(ROOT, "gallery"))];

function offenders(files: [string, string][], re: RegExp, allow: (rel: string, line: string) => boolean = () => false) {
  const hits: string[] = [];
  for (const [rel, text] of files) {
    text.split("\n").forEach((line, i) => {
      if (re.test(line) && !allow(rel, line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
  return hits;
}

describe("design rules", () => {
  it("the icon vendor is imported only by the Icon choke point (Nexis pitfall 18)", () => {
    const hits = EVERYTHING.filter(([rel, src]) => rel !== "src/icon/icon.tsx" && /from\s*["']@phosphor-icons\/react["']/.test(src));
    expect(hits.map(([r]) => r), 'use <Icon name="…" /> — add a name to src/icon/icon.tsx if the idea has none').toEqual([]);
  });

  it("no second icon library sneaks back in", () => {
    const hits = EVERYTHING.filter(([, src]) => /from\s*["'](@hugeicons|lucide-react|react-icons)/.test(src));
    expect(hits.map(([r]) => r)).toEqual([]);
  });

  it("no emoji anywhere (Nexis pitfall 19)", () => {
    expect(offenders(EVERYTHING, /[\p{Emoji_Presentation}️]/u)).toEqual([]);
  });

  it("components and templates use theme tokens, not Tailwind's stock palette", () => {
    // `text-emerald-500` ignores the theme: it is the same green on Aurelian
    // and on Glacier, and it was the commonest raw colour in Nexis. Status
    // colours are `success` / `warning` / `info` / `destructive`, which follow
    // the theme's ANSI roles.
    const STOCK =
      /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/;
    expect(offenders(SHIPPED, STOCK)).toEqual([]);
  });

  it("components and templates carry no raw hex colours", () => {
    // Theme files are palettes — that is where hex belongs. Everywhere else a
    // hex literal is a colour that will not change when the theme does.
    const hits = offenders(
      SHIPPED.filter(([rel]) => !rel.startsWith("src/theme/") && !rel.endsWith(".css") && rel !== "src/styles/tokens.ts"),
      /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/,
      // `#000` inside a mask gradient is alpha, not colour.
      (_rel, line) => /^\s*(\/\/|\*)/.test(line) || /url\(#|href="#|`#\$|"#\/|'#\//.test(line) || /gradient\(.*#000/.test(line),
    );
    expect(hits).toEqual([]);
  });

  it("indeterminate progress steps; nothing uses animate-spin", () => {
    // `.nexis-spin` ticks four quarter-turns at --tick-cadence; animate-spin
    // is the stock sweep every shadcn app has.
    expect(offenders(SHIPPED, /\banimate-spin\b/, (_r, line) => /^\s*(\/\/|\*)/.test(line))).toEqual([]);
  });

  it("motion components use `m`, never `motion.*` (LazyMotion strict)", () => {
    expect(offenders(SHIPPED, /<motion\.[a-z]/)).toEqual([]);
  });

  it("high-contrast tokens are declared on body, where they beat inline theme vars", () => {
    const css = readFileSync(join(ROOT, "src/styles/globals.css"), "utf8");
    expect(css).toMatch(/html\[data-contrast="high"\] body \{[^}]*--muted-foreground:/);
    expect(css).not.toMatch(/html\[data-contrast="high"\]\s*\{[^}]*--[a-z-]+:/);
  });

  it("globals.css scans the package's own components (@source)", () => {
    // Without it, a consumer's Tailwind never sees the component classes
    // and every component renders unstyled.
    const css = readFileSync(join(ROOT, "src/styles/globals.css"), "utf8");
    expect(css).toMatch(/@source\s+"\.\.\/";/);
  });

  it("every component module is exported from the package root", () => {
    const index = readFileSync(join(ROOT, "src/index.ts"), "utf8");
    const missing = readdirSync(join(ROOT, "src/components/ui"))
      .filter((f) => f.endsWith(".tsx") && !f.includes(".test."))
      .map((f) => f.replace(/\.tsx$/, ""))
      .filter((m) => !index.includes(`./components/ui/${m}"`));
    expect(missing).toEqual([]);
  });

  it("every template opens a command palette and draws a title bar", () => {
    for (const [rel, src] of walk(join(ROOT, "templates"), [".tsx"])) {
      expect(src, `${rel}: title bar`).toMatch(/<TitleBar\b/);
      if (!rel.endsWith("wizard.tsx")) expect(src, `${rel}: command palette`).toMatch(/<CommandPalette\b/);
    }
  });
});
