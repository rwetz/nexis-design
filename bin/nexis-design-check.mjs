#!/usr/bin/env node
// The family's rules, checked on an app's own source (docs/RULES.md R12.1).
//
//   pnpm exec nexis-design-check            # ./src, and ./src-tauri if present
//   pnpm exec nexis-design-check path/to/app
//
// Exits 1 on any error; warnings print but do not fail. Two kinds of check:
//
//   rules    the tripwires in test/design-rules.test.ts, run over src/
//   wiring   the Tauri half that only fails at runtime: a plugin imported in
//            the frontend but not in Cargo.toml, lib.rs or the capability
//            file; an invoke() of a command that is not registered; the
//            Linux window override missing (docs/BACKEND.md)
//
// A line that must break a rule on purpose carries `nexis-ok: <rule-id>
// <why>` on itself or the line above. Use it rarely and say why.

import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CODE = [".ts", ".tsx"];
const SKIP_DIRS = new Set(["node_modules", "dist", "target", "gen", ".git"]);

function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) out.push(...walk(p, exts));
    } else if (exts.some((e) => name.endsWith(e)) && !/\.(test|spec)\./.test(name)) out.push(p);
  }
  return out;
}

const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

// Each rule: id, the RULES.md number, a pattern, and what to do instead.
// `skip` can exempt a line; comments are always exempt.
const LINE_RULES = [
  {
    id: "icon-vendor",
    ref: "AGENTS 5",
    re: /from\s*["']@phosphor-icons\/react["']/,
    fix: 'use <Icon name="…" />; add a name to the registry upstream if the idea has none',
  },
  {
    id: "icon-library",
    ref: "AGENTS 5",
    re: /from\s*["'](@hugeicons|lucide-react|react-icons)/,
    fix: 'use <Icon name="…" />',
  },
  { id: "emoji", ref: "AGENTS 5", re: /[\p{Emoji_Presentation}️]/u, fix: "use an Icon or no glyph" },
  {
    id: "colour-stock",
    ref: "R6.1",
    re: /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/,
    fix: "use a token: bg-card, text-muted-foreground, text-success, bg-brand",
  },
  {
    id: "colour-hex",
    ref: "R6.1",
    re: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/,
    skip: (line) => /url\(#|href="#|`#\$|"#\/|'#\//.test(line) || /gradient\(.*#000/.test(line),
    fix: "use a token (bg-*, text-*, border-*) so the colour follows all 22 themes",
  },
  {
    id: "type-raw-size",
    ref: "R1.4",
    re: /(?<![\w-])text-(?:xs|base|xl|[3-9]xl)\b|text-\[[\d.]+(?:px|rem|em)\]/,
    fix: "sizes are text-micro, text-caption, text-ui, text-body, text-sm, text-lg, text-2xl",
  },
  { id: "type-heading-face", ref: "R1.1", re: /\bfont-heading\b|Space Grotesk/, fix: "Inter is the one face; use text-lg font-semibold" },
  {
    id: "type-mono-number",
    ref: "R1.2",
    re: /font-mono[^"'`]*tabular-nums|tabular-nums[^"'`]*font-mono/,
    fix: "numbers are the sans with tabular-nums; mono is for code, paths and ids",
  },
  { id: "type-weight", ref: "R1.5", re: /\bfont-(?:thin|extralight|light|bold|extrabold|black)\b/, fix: "weights are font-normal, font-medium, font-semibold" },
  { id: "overlay-item-aligned", ref: "R5.1", re: /position=["']item-aligned["']/, fix: "menus open below their trigger: leave Select on popper" },
  {
    id: "accent-tint",
    ref: "R6.2",
    re: /\b(?:ring|border|outline)-brand\b|\bbg-brand\/\d+|inset_[^\]]*var\(--brand\)/,
    fix: "brand marks the primary action, focus and live progress; selection is bg-muted",
  },
  { id: "no-rainbow", ref: "R6.4", re: /rainbow|aurora|bg-clip-text/i, fix: "text and icons are one flat token colour" },
  { id: "motion-spin", ref: "AGENTS 7", re: /\banimate-spin\b/, fix: "use <Spinner />" },
  { id: "motion-pulse", ref: "AGENTS 7", re: /\banimate-pulse\b/, fix: "use <StatusDot live /> for status or <Skeleton /> for loading" },
  { id: "motion-raw", ref: "AGENTS 7", re: /<motion\.[a-z]|import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*["']motion\/react["']/, fix: "import { m } from 'motion/react'; LazyMotion is strict" },
];

/** The app's own TypeScript (a devDependency of every scaffold), else ours. */
async function loadTypeScript(root) {
  try {
    return createRequire(join(root, "package.json"))("typescript");
  } catch {}
  try {
    return (await import("typescript")).default;
  } catch {
    return null;
  }
}

/** Em dashes in text a person reads: strings, template text, JSX text. */
async function emDashFindings(file, src, root) {
  const EM = "\u2014";
  if (!src.includes(EM)) return [];
  const out = [];
  const ts = await loadTypeScript(root);
  if (!ts) {
    src.split("\n").forEach((line, i) => {
      if (line.includes(EM) && !isComment(line)) out.push({ line: i + 1, text: line.trim().slice(0, 80) });
    });
    return out;
  }
  const kind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, kind);
  const visit = (node) => {
    const isText = node.kind === ts.SyntaxKind.JsxText || ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node);
    const text = isText ? node.getText(sf) : "";
    if (text.includes(EM)) out.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text: text.trim().slice(0, 80) });
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const allowed = (lines, i, id) => {
  const re = new RegExp(`nexis-ok:?\\s*${id}\\b`);
  return re.test(lines[i] ?? "") || re.test(lines[i - 1] ?? "");
};

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const pluginOf = (spec) => spec.match(/^@tauri-apps\/plugin-([a-z-]+)$/)?.[1] ?? null;

/** Rust command names: `#[tauri::command]` fns, and what `generate_handler!` lists. */
export function rustCommands(rustSources) {
  const defined = new Set();
  const registered = new Set();
  for (const src of rustSources) {
    for (const m of src.matchAll(/#\[tauri::command[^\]]*\]\s*(?:#\[[^\]]*\]\s*)*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)/g)) defined.add(m[1]);
    for (const m of src.matchAll(/generate_handler!\s*\[([^\]]*)\]/g)) {
      for (const item of m[1].split(",")) {
        const name = item.replace(/\/\/.*$/gm, "").trim().split("::").pop();
        if (name) registered.add(name);
      }
    }
  }
  return { defined, registered };
}

export async function check(root = process.cwd()) {
  root = resolve(root);
  const findings = [];
  const add = (severity, file, line, id, ref, message, fix) =>
    findings.push({ severity, file: relative(root, file).split("\\").join("/"), line, id, ref, message, fix });

  const srcDir = join(root, "src");
  const files = walk(srcDir, [...CODE, ".css"]);
  if (files.length === 0) {
    add("error", srcDir, 0, "no-source", "", "no source files under src/", "run from the app's root");
    return findings;
  }

  const text = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

  // ── rules ────────────────────────────────────────────────────────────────
  for (const [file, src] of text) {
    const lines = src.split("\n");
    const isCss = file.endsWith(".css");
    lines.forEach((line, i) => {
      if (isComment(line)) return;
      for (const rule of LINE_RULES) {
        if (isCss && !["colour-stock", "type-raw-size", "no-rainbow"].includes(rule.id)) continue;
        if (!rule.re.test(line) || rule.skip?.(line) || allowed(lines, i, rule.id)) continue;
        add("error", file, i + 1, rule.id, rule.ref, line.trim().slice(0, 100), rule.fix);
      }
    });
    if (!isCss) {
      for (const hit of await emDashFindings(file, src, root)) {
        if (allowed(lines, hit.line - 1, "em-dash")) continue;
        add("error", file, hit.line, "em-dash", "AGENTS 13", hit.text, "use a colon, comma, parentheses, a period, a middle dot, or an en dash for no value");
      }
    }
  }

  // ── the app's shape ─────────────────────────────────────────────────────
  const code = [...text].filter(([f]) => CODE.some((e) => f.endsWith(e)));
  const all = code.map(([, s]) => s).join("\n");
  const must = [
    ["ThemeProvider", "wrap the app in <ThemeProvider storageKey=\"<app>\"> (AGENTS 1)"],
    ["LazyMotion", "wrap the app in <LazyMotion features={domAnimation} strict>"],
    ["TooltipProvider", "wrap the app in <TooltipProvider>"],
    ["Toaster", "mount <Toaster /> once at the root"],
    ["TitleBar", "draw the window chrome with <TitleBar> (R4.1)"],
  ];
  for (const [name, fix] of must) {
    if (!new RegExp(`<${name}\\b`).test(all)) add("error", srcDir, 0, "shell-missing", "AGENTS 2", `<${name}> is not used anywhere in src/`, fix);
  }
  if (!/<CommandPalette\b/.test(all)) add("warn", srcDir, 0, "shell-palette", "AGENTS 10", "no <CommandPalette>", "every app exposes its actions on Mod+Shift+P");
  if (!/globals(\.ide)?\.css/.test(all) && ![...text].some(([f, s]) => f.endsWith(".css") && /@nexis\/design\/styles\/globals/.test(s)))
    add("error", srcDir, 0, "shell-styles", "AGENTS 1", "the design stylesheet is not imported", '@import "@nexis/design/styles/globals.css" in src/styles.css');

  for (const [file, src] of code) {
    const usesWindowApi = /@tauri-apps\/api\/(window|webviewWindow|webview)\b|getCurrentWindow|getCurrentWebview/.test(src);
    if (usesWindowApi && !/\bIN_TAURI\b/.test(src))
      add("error", file, 0, "tauri-unguarded-window", "PITFALLS 12", "a window API is used without an IN_TAURI guard", "gate it on IN_TAURI or the page dies in a browser and in tests");
    const usesBackend = /from\s*["']@tauri-apps\/api\/core["']|from\s*["']@tauri-apps\/plugin-(?!os)/.test(src);
    if (usesBackend && !/\bIN_TAURI\b|backend["']/.test(src))
      add("warn", file, 0, "tauri-unguarded-backend", "BACKEND 2", "calls the backend directly", "go through src/backend.ts so it also runs in a browser (headless checks)");
  }

  // ── wiring: the Tauri half ──────────────────────────────────────────────
  const tauriDir = join(root, "src-tauri");
  if (!existsSync(tauriDir)) return findings;

  const cargoPath = join(tauriDir, "Cargo.toml");
  const cargo = existsSync(cargoPath) ? readFileSync(cargoPath, "utf8") : "";
  const rustFiles = walk(join(tauriDir, "src"), [".rs"]);
  const rust = rustFiles.map((f) => readFileSync(f, "utf8"));
  const rustAll = rust.join("\n");

  const capIds = new Set();
  const capDir = join(tauriDir, "capabilities");
  if (existsSync(capDir)) {
    for (const name of readdirSync(capDir).filter((n) => n.endsWith(".json"))) {
      const cap = readJson(join(capDir, name));
      for (const p of cap?.permissions ?? []) capIds.add(typeof p === "string" ? p : p?.identifier);
    }
  }

  const plugins = new Set();
  for (const [, src] of code) for (const m of src.matchAll(/from\s*["'](@tauri-apps\/plugin-[a-z-]+)["']/g)) plugins.add(pluginOf(m[1]));
  plugins.delete(null);
  for (const p of plugins) {
    if (!new RegExp(`^tauri-plugin-${p}\\s*=`, "m").test(cargo))
      add("error", cargoPath, 0, "plugin-cargo", "BACKEND 3", `@tauri-apps/plugin-${p} is imported but tauri-plugin-${p} is not in Cargo.toml`, `add tauri-plugin-${p} = "2"`);
    if (!rustAll.includes(`tauri_plugin_${p.replace(/-/g, "_")}`))
      add("error", join(tauriDir, "src/lib.rs"), 0, "plugin-register", "BACKEND 3", `tauri_plugin_${p.replace(/-/g, "_")} is never registered`, `.plugin(tauri_plugin_${p.replace(/-/g, "_")}::init()) in lib.rs`);
    if (![...capIds].some((id) => id?.startsWith(`${p}:`)))
      add("error", capDir, 0, "plugin-permission", "BACKEND 3", `no ${p}:* permission in src-tauri/capabilities`, `add "${p}:default" (or the narrower allow-* entries the calls need)`);
  }

  const { defined, registered } = rustCommands(rust);
  const invoked = new Map();
  for (const [file, src] of code) {
    const lines = src.split("\n");
    const usesWrapper = /from\s*["'](?:\.{1,2}\/)+(?:[\w/]*\/)?backend["']/.test(src);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/\binvoke(?:<[^>]*>)?\(\s*["'`]([a-zA-Z0-9_]+)["'`]/g)) invoked.set(m[1], { file, line: i + 1 });
      if (usesWrapper)
        for (const m of line.matchAll(/\bcall(?:<[^>]*>)?\(\s*["'`]([a-zA-Z0-9_]+)["'`]/g)) invoked.set(m[1], { file, line: i + 1 });
    });
  }
  for (const [name, where] of invoked) {
    if (!registered.has(name))
      add("error", where.file, where.line, "command-unregistered", "BACKEND 1", `invoke("${name}") but no registered command by that name`, `#[tauri::command] fn ${name} and list it in generate_handler![…]`);
  }
  for (const name of defined) {
    if (!registered.has(name)) add("error", join(tauriDir, "src/lib.rs"), 0, "command-unlisted", "BACKEND 1", `#[tauri::command] ${name} is not in generate_handler![…]`, "list it in invoke_handler or the call fails at runtime");
  }

  const conf = readJson(join(tauriDir, "tauri.conf.json"));
  if (conf?.identifier === "com.tauri.dev" || conf?.identifier === "com.tauri.app")
    add("error", join(tauriDir, "tauri.conf.json"), 0, "conf-identifier", "PITFALLS 7", `identifier is the template default "${conf.identifier}"`, "use app.nexis.<name>");
  if (existsSync(join(tauriDir, "tauri.windows.conf.json")) && !existsSync(join(tauriDir, "tauri.linux.conf.json")))
    add("error", tauriDir, 0, "conf-linux", "PITFALLS 1", "tauri.windows.conf.json without tauri.linux.conf.json", "Linux then has double chrome: mirror the Windows override");
  const noIcons = (conf?.bundle?.icon ?? []).filter((icon) => !existsSync(join(tauriDir, icon)));
  if (noIcons.length)
    add("warn", join(tauriDir, "icons"), 0, "icons-missing", "PITFALLS 7", `${noIcons.length} icon file${noIcons.length === 1 ? "" : "s"} in bundle.icon missing (${noIcons[0]}, …)`, "pnpm tauri icon src-tauri/icons/icon.png (cargo check fails without them)");

  return findings;
}

export function format(findings) {
  const lines = [];
  for (const f of findings) {
    const where = f.line ? `${f.file}:${f.line}` : f.file;
    lines.push(`${f.severity === "error" ? "error" : "warn "} ${where}  [${f.id}${f.ref ? ` · ${f.ref}` : ""}]`);
    lines.push(`      ${f.message}`);
    if (f.fix) lines.push(`      -> ${f.fix}`);
  }
  const errors = findings.filter((f) => f.severity === "error").length;
  const warns = findings.length - errors;
  lines.push(errors || warns ? `\nnexis-design-check: ${errors} error${errors === 1 ? "" : "s"}, ${warns} warning${warns === 1 ? "" : "s"}` : "nexis-design-check: clean");
  return lines.join("\n");
}

// A package-manager bin is a symlink to this file: compare real paths.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const findings = await check(process.argv[2] ?? process.cwd());
  console.log(format(findings));
  process.exit(findings.some((f) => f.severity === "error") ? 1 : 0);
}
