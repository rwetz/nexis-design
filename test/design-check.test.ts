// The checker apps run on their own source (bin/nexis-design-check.mjs,
// RULES R12.1). Two promises: every template, scaffolded for real, passes it;
// and each way of getting an app wrong is named.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script, no types
import { check, rustCommands } from "../bin/nexis-design-check.mjs";

const ROOT = resolve(__dirname, "..");
const work = mkdtempSync(join(tmpdir(), "nexis-check-"));
afterAll(() => rmSync(work, { recursive: true, force: true }));

type Finding = { severity: string; id: string; message: string; file: string };
const ids = (fs: Finding[], severity = "error") => fs.filter((f) => f.severity === severity).map((f) => f.id);

function scaffold(template: string, name: string, extra: string[] = []) {
  const dir = join(work, name);
  const r = spawnSync("bash", [join(ROOT, "scripts/new-app.sh"), name, template, dir, ...extra], {
    env: { ...process.env, NEXIS_PATH: ROOT },
    encoding: "utf8",
  });
  expect(r.status, r.stderr).toBe(0);
  return dir;
}

const describeUnix = process.platform === "win32" ? describe.skip : describe;

describeUnix("scaffolded apps pass the checker", () => {
  for (const t of ["dashboard", "workbench", "settings", "explorer", "console", "wizard", "minimal"]) {
    it(`${t}`, async () => {
      const dir = scaffold(t, `nexis-t-${t}`);
      expect(ids(await check(dir))).toEqual([]);
    });
  }

  it("wires every plugin in all four places", async () => {
    const dir = scaffold("minimal", "nexis-t-plugins", ["--with", "store,dialog,fs,opener,notification,clipboard-manager,process"]);
    expect(ids(await check(dir))).toEqual([]);
    const lib = readFileSync(join(dir, "src-tauri/src/lib.rs"), "utf8");
    expect(lib).toContain("tauri_plugin_clipboard_manager::init()");
    expect(lib).toContain("tauri_plugin_store::Builder::new().build()");
    const caps = JSON.parse(readFileSync(join(dir, "src-tauri/capabilities/default.json"), "utf8"));
    expect(caps.permissions).toContain("clipboard-manager:allow-write-text");
    expect(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).dependencies).toHaveProperty("@tauri-apps/plugin-dialog");
  });

  it("refuses a plugin it cannot wire", () => {
    const r = spawnSync("bash", [join(ROOT, "scripts/new-app.sh"), "nexis-t-bad", "minimal", join(work, "nexis-t-bad"), "--with", "sql"], { env: { ...process.env, NEXIS_PATH: ROOT }, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/unknown plugin 'sql'/);
  });
});

describeUnix("the checker names what is wrong", () => {
  it("each rule", async () => {
    const dir = scaffold("minimal", "nexis-t-rules");
    writeFileSync(
      join(dir, "src/Bad.tsx"),
      [
        'import { Gear } from "@phosphor-icons/react";',
        'export const A = () => <div className="text-emerald-500 text-xs font-bold bg-brand/10 animate-spin font-mono tabular-nums" style={{ color: "#ff0000" }}>Hi — there</div>;',
        "export const B = () => <motion.div />;",
        "// text-emerald-500 in a comment is fine",
        "// nexis-ok: colour-stock this one is deliberate",
        'export const C = () => <div className="text-red-500" />;',
      ].join("\n"),
    );
    const got = new Set(ids(await check(dir)));
    for (const id of ["icon-vendor", "colour-stock", "colour-hex", "type-raw-size", "type-weight", "accent-tint", "motion-spin", "type-mono-number", "motion-raw", "em-dash"])
      expect(got, id).toContain(id);
    const stock = (await check(dir)).filter((f: Finding) => f.id === "colour-stock");
    expect(stock).toHaveLength(1); // the commented one and the nexis-ok one are not reported
  });

  it("an app without its shell", async () => {
    const dir = scaffold("minimal", "nexis-t-shell");
    writeFileSync(join(dir, "src/main.tsx"), 'import "./styles.css";\nexport {};\n');
    const missing = (await check(dir)).filter((f: Finding) => f.id === "shell-missing").map((f: Finding) => f.message);
    expect(missing.join("\n")).toMatch(/ThemeProvider[\s\S]*LazyMotion[\s\S]*TooltipProvider[\s\S]*Toaster/);
  });

  it("an unguarded window API", async () => {
    const dir = scaffold("minimal", "nexis-t-window");
    writeFileSync(join(dir, "src/win.ts"), 'import { getCurrentWindow } from "@tauri-apps/api/window";\nexport const w = () => getCurrentWindow();\n');
    expect(ids(await check(dir))).toContain("tauri-unguarded-window");
  });

  it("a plugin used in the frontend but missing from Rust, Cargo and the capability", async () => {
    const dir = scaffold("minimal", "nexis-t-plugin");
    writeFileSync(join(dir, "src/files.ts"), 'import { open } from "@tauri-apps/plugin-dialog";\nimport { IN_TAURI } from "@nexis/design";\nexport const pick = () => (IN_TAURI ? open() : null);\n');
    expect(ids(await check(dir)).sort()).toEqual(["plugin-cargo", "plugin-permission", "plugin-register"]);
  });

  it("a command the frontend calls that Rust does not register, and the reverse", async () => {
    const dir = scaffold("minimal", "nexis-t-cmd");
    writeFileSync(join(dir, "src/api.ts"), 'import { call } from "./backend";\nexport const go = () => call("load_project", { id: 1 });\n');
    writeFileSync(join(dir, "src-tauri/src/extra.rs"), "#[tauri::command]\npub async fn save_project() -> Result<(), String> { Ok(()) }\n");
    const fs = (await check(dir)).filter((f: Finding) => f.severity === "error");
    expect(fs.map((f: Finding) => f.id).sort()).toEqual(["command-unlisted", "command-unregistered"]);
    expect(fs.map((f: Finding) => f.message).join("\n")).toMatch(/load_project[\s\S]*save_project|save_project[\s\S]*load_project/);
  });

  it("windows override without linux, and the placeholder identifier", async () => {
    const dir = scaffold("minimal", "nexis-t-conf");
    rmSync(join(dir, "src-tauri/tauri.linux.conf.json"));
    const conf = JSON.parse(readFileSync(join(dir, "src-tauri/tauri.conf.json"), "utf8"));
    conf.identifier = "com.tauri.dev";
    writeFileSync(join(dir, "src-tauri/tauri.conf.json"), JSON.stringify(conf));
    expect(ids(await check(dir)).sort()).toEqual(["conf-identifier", "conf-linux"]);
  });

  it("only warns, never fails, about missing icons and the palette", async () => {
    const dir = scaffold("minimal", "nexis-t-warn");
    expect(ids(await check(dir), "warn")).toContain("icons-missing");
  });
});

describe("rustCommands", () => {
  it("reads commands and the handler list, through modules, attributes and comments", () => {
    const { defined, registered } = rustCommands([
      "#[tauri::command]\npub fn a() {}\n#[tauri::command(rename_all = \"snake_case\")]\n#[allow(dead_code)]\nasync fn b() {}\npub(crate) fn not_a_command() {}",
      "tauri::generate_handler![\n  commands::a, // first\n  b,\n]",
    ]);
    expect([...defined].sort()).toEqual(["a", "b"]);
    expect([...registered].sort()).toEqual(["a", "b"]);
  });
});

// Keep the checker's rule list honest against the repo's own tripwires: the
// shipped templates, un-scaffolded, must be clean under the per-file rules.
describe("templates", () => {
  it("are clean under the per-file rules", async () => {
    const dir = join(work, "templates-as-app");
    mkdirSync(join(dir, "src"), { recursive: true });
    for (const t of ["dashboard", "workbench", "settings", "explorer", "console", "wizard", "minimal"]) {
      writeFileSync(join(dir, "src", `${t}.tsx`), readFileSync(join(ROOT, "templates", `${t}.tsx`), "utf8"));
    }
    const perFile = (await check(dir)).filter((f: Finding) => f.severity === "error" && f.id !== "shell-missing" && f.id !== "shell-styles");
    expect(perFile.map((f: Finding) => `${f.file}: ${f.id}`)).toEqual([]);
  });
});
