// The family's design rules, as tripwires. Each one exists because the thing
// it forbids already happened somewhere — see docs/PITFALLS.md and Nexis's
// AGENTS.md for the incident behind each.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

function walk(dir: string, exts = [".ts", ".tsx", ".css"]): [string, string][] {
  const out: [string, string][] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => name.endsWith(e)) && !name.includes(".test.")) out.push([relative(ROOT, p).split("\\").join("/"), readFileSync(p, "utf8")]); // posix paths, so allowlists match on Windows too
  }
  return out;
}

/** The repo's Markdown, minus what is installed, built or vendored. */
function markdown(dir: string): [string, string][] {
  const out: [string, string][] = [];
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", ".claude"].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...markdown(p));
    else if (name.endsWith(".md")) out.push([relative(ROOT, p).split("\\").join("/"), readFileSync(p, "utf8")]);
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

  it("text below 14px uses a type-scale step, not raw pixels (Nexis pitfall 18)", () => {
    // Nexis drifted to ~1,450 hand-picked `text-[Npx]` sizes across eleven
    // values from 8px to 13px, half-pixels included, so adjacent rows never
    // matched. Use text-micro (10) / text-caption (11) / text-ui (12) /
    // text-body (13). Display sizes of 14px and up are deliberate one-offs.
    const RAW = /text-\[(?:\d|1[0-3])(?:\.\d+)?px\]/;
    expect(offenders(EVERYTHING, RAW)).toEqual([]);
  });

  it("one UI face: no display face or font-heading (RULES R1.1)", () => {
    // Space Grotesk was the family's display face and was illegible below
    // ~13px, so every app had to know where it was allowed. Inter at
    // text-lg/600 is the title now.
    expect(offenders(EVERYTHING, /\bfont-heading\b|Space Grotesk/)).toEqual([]);
  });

  it("numbers are the sans with tabular-nums, never mono (RULES R1.2)", () => {
    // Mono numbers read as code and widen every readout; Press's slider
    // values were the complaint. Mono is for code, paths and ids.
    expect(offenders(EVERYTHING, /font-mono[^"'`]*tabular-nums|tabular-nums[^"'`]*font-mono/)).toEqual([]);
  });

  it("sizes come from the type list (RULES R1.4)", () => {
    // micro 10 · caption 11 · ui 12 · body 13 · sm 14 · lg 18 · 2xl 24. text-xs
    // duplicated text-ui under another name, and text-base / text-xl / 3xl+
    // were one-off sizes between the steps.
    expect(offenders(EVERYTHING, /(?<![\w-])text-(?:xs|base|xl|[3-9]xl)\b|text-\[[\d.]+(?:px|rem|em)\]/)).toEqual([]);
  });

  it("weights are 400, 500 or 600 (RULES R1.5)", () => {
    expect(offenders(EVERYTHING, /\bfont-(?:thin|extralight|light|bold|extrabold|black)\b/)).toEqual([]);
  });

  it("no em dashes in text a person reads (strings, JSX text, docs)", () => {
    // The family's copy rule (AGENTS.md rule 13). Comments are exempt, so
    // code is parsed and only string literals, template text and JSX text
    // are checked; Markdown is checked whole, code blocks included, since
    // diagrams and trees in docs render as text too.
    const EM = "—";
    const hits: string[] = [];
    for (const [rel, src] of EVERYTHING) {
      if (!/\.tsx?$/.test(rel) || !src.includes(EM)) continue;
      const kind = rel.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, kind);
      const visit = (node: ts.Node) => {
        const isText =
          node.kind === ts.SyntaxKind.JsxText ||
          ts.isStringLiteralLike(node) ||
          ts.isTemplateLiteralToken(node);
        const text = isText ? node.getText(sf) : "";
        if (text.includes(EM)) {
          const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
          hits.push(`${rel}:${line}: ${text.trim().slice(0, 80)}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    for (const [rel, src] of markdown(ROOT)) {
      src.split("\n").forEach((line, i) => {
        if (line.includes(EM)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 80)}`);
      });
    }
    expect(hits, "use a colon, comma, parentheses, a period, a middle dot or an en dash (AGENTS.md rule 13)").toEqual([]);
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
