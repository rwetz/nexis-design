// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const app = resolve(process.argv[2] ?? ".");
const fixtures = await mkdtemp(resolve(app, ".bundle-size-"));
try {
  const entries = [
    ["button from root", "@nexis/design", "Button"],
    ["button from subpath", "@nexis/design/ui/button", "Button"],
    ["charts", "@nexis/design/ui/chart", "LineChart"],
    ["virtual list", "@nexis/design/ui/virtual-list", "VirtualList"],
  ];
  const sizes = [];
  for (const [label, specifier, name] of entries) {
    const input = resolve(fixtures, "entry.mjs");
    await writeFile(input, `import { ${name} } from "${specifier}"; globalThis.fixture = ${name};\n`);
    const result = await build({ root: app, configFile: false, logLevel: "error", esbuild: { jsx: "automatic" }, build: {
      write: false, minify: "esbuild", rollupOptions: { input },
    } });
    const chunks = result.output.filter((chunk) => chunk.type === "chunk");
    const modules = chunks.flatMap((chunk) => Object.entries(chunk.modules).filter(([, module]) => module.renderedLength > 0).map(([name]) => name));
    if (modules.some((id) => /[\\/](ogl|@codemirror)[\\/]/.test(id))) {
      throw new Error(`Optional engines leaked into ${label}`);
    }
    if (name === "Button" && modules.some((id) => /[\\/](chart|virtual-list|data-table)\.tsx$/.test(id))) {
      throw new Error(`Data components failed to tree-shake from ${label}`);
    }
    const bytes = chunks.reduce((sum, chunk) => sum + gzipSync(chunk.code).length, 0);
    sizes.push(bytes);
    console.log(`${label.padEnd(22)} ${bytes.toLocaleString("en-US")} bytes gzip`);
  }
  if (sizes[0] - sizes[1] > 1024) throw new Error("Root button adds over 1 KiB to the direct entry's bundle.");
} finally {
  await rm(fixtures, { recursive: true, force: true });
}
