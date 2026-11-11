// nexis-design-look against a page that is wrong in known ways, and one that
// is not. Skipped where no Chromium is installed.
import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script, no types
import { chromiumPath } from "../bin/chromium-path.mjs";

const ROOT = resolve(__dirname, "..");
let browser: string | null = null;
try {
  browser = await chromiumPath();
} catch {}

const BAD = `<!doctype html><meta charset=utf-8><body style="margin:0">
<div style="width:2600px;height:20px;background:#ccc"></div>
<button id="icon" style="width:16px;height:16px"></button>
<div style="width:50px;overflow:hidden;white-space:nowrap">a very long label that is cut off</div>
<p style="font-size:8px">tiny text</p>
<script>console.error("boom")</script>`;

const GOOD = `<!doctype html><meta charset=utf-8><body style="margin:0">
<button style="width:40px;height:32px" aria-label="Refresh">r</button>
<label><input type="checkbox" style="width:24px;height:24px"> Mine</label>
<p style="font-size:13px">fine text</p>`;

let server: Server;
let base = "";
const out = mkdtempSync(join(tmpdir(), "nexis-look-"));
beforeAll(async () => {
  server = createServer((req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(req.url === "/bad" ? BAD : GOOD);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => {
  server.close();
  rmSync(out, { recursive: true, force: true });
});

// Async on purpose: the page is served from this process, so blocking it
// (spawnSync) would starve the server the browser is waiting on.
const look = (path: string) =>
  new Promise<{ status: number; stdout: string }>((done) =>
    execFile(
      "node",
      [join(ROOT, "bin/nexis-design-look.mjs"), base + path, `--out=${out}`, "--sizes=1024x768", "--modes=light", "--settle=100"],
      { encoding: "utf8", env: { ...process.env, CHROMIUM: browser ?? "" } },
      (err, stdout) => done({ status: err ? ((err as { code?: number }).code ?? 1) : 0, stdout }),
    ),
  );

describe.skipIf(!browser)("nexis-design-look", () => {
  it("passes a sound page", async () => {
    const r = await look("/good");
    expect(r.stdout).toMatch(/0 errors, 0 warnings/);
    expect(r.status).toBe(0);
  });

  it("names what is wrong, and exits 1 for errors", async () => {
    const r = await look("/bad");
    expect(r.status).toBe(1);
    for (const id of ["overflow-page", "unlabeled-control", "runtime", "text-clipped", "text-small", "target-small"]) expect(r.stdout, id).toContain(`[${id}]`);
  });
});
