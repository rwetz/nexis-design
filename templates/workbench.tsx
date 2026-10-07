// ╔══════════════════════════════════════╗
// ║  @nexis/design — app template        ║
// ║  workbench                           ║
// ╚══════════════════════════════════════╝
//
// Shape: resizable split — file tree · tabs of open documents · a virtualised
// document · an inspector.
// Start here for: editors, notes, IDE-likes, asset browsers, API clients,
// git clients.

import * as React from "react";
import {
  CommandPalette,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  cn,
  fmtShortcut,
  GlidingTabs,
  Icon,
  MOD_KEY,
  PropertyList,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SectionLabel,
  StatusBar,
  StatusItem,
  TitleBar,
  toast,
  Tree,
  type TreeNode,
  useCommandPaletteShortcut,
  VirtualList,
  WindowResizeEdges,
} from "@nexis/design";

export default function App() {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(["src", "src/components"]));
  const [open, setOpen] = React.useState<string[]>(["src/components/Panel.tsx", "src/theme/applyTheme.ts", "README.md"]);
  const [active, setActive] = React.useState(open[0]);
  const [cursor, setCursor] = React.useState(12);
  const [inspector, setInspector] = React.useState<"outline" | "info">("outline");
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  const openFile = (id: string) => {
    if (!FILES[id]) return;
    setOpen((o) => (o.includes(id) ? o : [...o, id]));
    setActive(id);
  };
  const close = (id: string) => {
    setOpen((o) => {
      const next = o.filter((x) => x !== id);
      if (active === id) setActive(next[next.length - 1] ?? "");
      return next;
    });
  };
  const lines = FILES[active] ?? [];

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <TitleBar
        brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />}
        title="Scribe"
        center={
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-7 w-full max-w-sm items-center gap-2 rounded-full bg-muted/70 px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="search" size="xs" /> <span className="flex-1 text-left">nexis-design</span>
          </button>
        }
      />
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="20%" minSize="12%" className="bg-sidebar">
          <div className="flex h-9 items-center px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Explorer</div>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="h-[calc(100%-2.25rem)] overflow-y-auto nexis-scrollbar">
                <Tree label="Files" nodes={TREE} expanded={expanded} onExpandedChange={setExpanded} selected={active} onSelect={openFile} />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-52">
              <ContextMenuItem>
                <Icon name="file-add" /> New file
              </ContextMenuItem>
              <ContextMenuItem>
                <Icon name="folder-add" /> New folder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive">
                <Icon name="delete" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="58%" minSize="30%">
          <div className="flex h-full flex-col">
            <div role="tablist" className="flex h-9 shrink-0 items-end gap-0.5 overflow-x-auto border-b border-border/60 bg-sidebar/40 px-1.5">
              {open.map((id) => (
                <div
                  key={id}
                  role="tab"
                  aria-selected={id === active}
                  onClick={() => setActive(id)}
                  className={cn(
                    "group/tab flex h-8 cursor-pointer items-center gap-2 rounded-t-lg pr-1.5 pl-3 text-[12.5px]",
                    id === active ? "bg-background text-foreground shadow-[inset_0_2px_0_var(--brand)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon name={id.endsWith(".md") ? "document" : "file-code"} size="xs" />
                  {id.split("/").pop()}
                  <button
                    type="button"
                    aria-label="Close tab"
                    onClick={(e) => {
                      e.stopPropagation();
                      close(id);
                    }}
                    className="grid size-5 place-items-center rounded-md opacity-0 group-hover/tab:opacity-100 hover:bg-muted"
                  >
                    <Icon name="close" size="xs" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex h-7 shrink-0 items-center gap-1 px-4 text-[11.5px] text-muted-foreground">
              {active.split("/").map((p, i, a) => (
                <React.Fragment key={i}>
                  {i > 0 && <Icon name="chevron-right" size={10} />}
                  <span className={i === a.length - 1 ? "text-foreground" : ""}>{p}</span>
                </React.Fragment>
              ))}
            </div>
            <VirtualList
              label={active}
              count={lines.length}
              rowHeight={22}
              className="min-h-0 flex-1 pb-6"
              renderRow={(i) => (
                <div
                  onClick={() => setCursor(i)}
                  className={cn("flex h-full items-center font-mono text-[12.5px]", i === cursor && "bg-muted/60")}
                >
                  <span className={cn("w-14 shrink-0 pr-4 text-right tabular-nums", i === cursor ? "text-foreground" : "text-muted-foreground/50")}>
                    {i + 1}
                  </span>
                  <Code line={lines[i]} />
                </div>
              )}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="22%" minSize="14%" className="bg-sidebar/40">
          <div className="flex h-9 items-center border-b border-border/60 px-3">
            <GlidingTabs
              label="Inspector"
              value={inspector}
              onChange={setInspector}
              tabs={[
                { id: "outline", label: "Outline", icon: "outline" },
                { id: "info", label: "Info", icon: "info" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 p-3">
            {inspector === "outline" ? (
              <>
                <SectionLabel>Symbols</SectionLabel>
                {lines
                  .map((l, i) => ({ l, i }))
                  .filter(({ l }) => /^(export )?(function|type|const) /.test(l))
                  .map(({ l, i }) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCursor(i)}
                      className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] hover:bg-muted"
                    >
                      <Icon name={l.includes("function") ? "symbol-function" : l.includes("type") ? "symbol-type" : "variable"} className="text-brand/80" />
                      <span className="truncate font-mono">{l.replace(/^export /, "").split(/[ (=<]/)[1]}</span>
                    </button>
                  ))}
              </>
            ) : (
              <PropertyList
                items={[
                  { label: "Lines", value: lines.length, mono: true },
                  { label: "Language", value: active.endsWith(".md") ? "Markdown" : "TypeScript" },
                  { label: "Encoding", value: "UTF-8" },
                  { label: "Modified", value: "2 min ago" },
                ]}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <StatusBar
        left={
          <>
            <StatusItem icon="git-branch" onClick={() => toast("Source control")}>
              main
            </StatusItem>
            <StatusItem icon="success">0 problems</StatusItem>
          </>
        }
        right={
          <>
            <StatusItem live>
              Ln {cursor + 1}, Col 1
            </StatusItem>
            <StatusItem>UTF-8</StatusItem>
            <StatusItem>{active.endsWith(".md") ? "Markdown" : "TypeScript React"}</StatusItem>
          </>
        }
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={[
          ...Object.keys(FILES).map((f) => ({ id: f, label: f, group: "Files", icon: "file" as const, run: () => openFile(f) })),
          { id: "save", label: "Save", group: "File", icon: "save", shortcut: fmtShortcut(MOD_KEY, "S"), run: () => toast.success("Saved") },
          { id: "close", label: "Close tab", group: "File", icon: "close", shortcut: fmtShortcut(MOD_KEY, "W"), run: () => close(active) },
        ]}
      />
    </div>
  );
}

/** A deliberately tiny highlighter — swap in CodeMirror for a real editor
 * (and import globals.ide.css). */
function Code({ line }: { line: string }) {
  const parts = line.split(/(\b(?:export|function|return|const|type|import|from|if|else)\b|"[^"]*"|\/\/.*$)/g);
  return (
    <span className="whitespace-pre text-foreground/90">
      {parts.map((p, i) =>
        /^(export|function|return|const|type|import|from|if|else)$/.test(p) ? (
          <span key={i} className="text-[var(--terminal-ansi-magenta)]">{p}</span>
        ) : p.startsWith('"') ? (
          <span key={i} className="text-[var(--terminal-ansi-green)]">{p}</span>
        ) : p.startsWith("//") ? (
          <span key={i} className="text-muted-foreground italic">{p}</span>
        ) : (
          p
        ),
      )}
    </span>
  );
}

// ── Fixture data — replace with your source ─────────────────────────────────

const PANEL = `import type * as React from "react";
import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";

// A titled region of a screen.
type PanelProps = {
  title?: React.ReactNode;
  icon?: IconName;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  flush?: boolean;
};

export function Panel({ title, meta, actions, flush, children }: PanelProps) {
  const hasHeader = title !== undefined || actions !== undefined;
  return (
    <section data-slot="panel" className="rounded-2xl bg-card">
      {hasHeader && <header className="flex h-10 items-center">{title}</header>}
      <div className={cn("min-h-0 flex-1", flush ? "" : "p-4")}>{children}</div>
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}
`.split("\n");

const APPLY = `import type { Theme, ThemeMode } from "./types";

// The only writer of theme CSS variables.
export function applyTheme(theme: Theme, mode: ThemeMode): void {
  const root = document.documentElement;
  const variant = theme.variants[mode] ?? theme.variants.dark;
  if (!variant) return clearTheme();
  for (const v of ALL_VARS) root.style.removeProperty(v);
  writeColors(root, variant.colors);
  const brand = variant.colors?.ring ?? variant.colors?.primary;
  if (brand) root.style.setProperty("--brand", brand);
}

export function clearTheme(): void {
  const root = document.documentElement;
  for (const v of ALL_VARS) root.style.removeProperty(v);
}
`.split("\n");

const README = `# nexis-design

The design system for the Nexis family of Tauri desktop apps.

## Use

  pnpm add github:rwetz/nexis-design

Then import the stylesheet and wrap your root in ThemeProvider.
`.split("\n");

const FILES: Record<string, string[]> = {
  "src/components/Panel.tsx": PANEL,
  "src/components/StatusBar.tsx": PANEL.slice(0, 12),
  "src/theme/applyTheme.ts": APPLY,
  "src/index.ts": ['export * from "./theme";', 'export * from "./components/Panel";'],
  "README.md": README,
};

const TREE: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "src/components",
        label: "components",
        children: [
          { id: "src/components/Panel.tsx", label: "Panel.tsx", icon: "file-code" },
          { id: "src/components/StatusBar.tsx", label: "StatusBar.tsx", icon: "file-code" },
        ],
      },
      { id: "src/theme", label: "theme", children: [{ id: "src/theme/applyTheme.ts", label: "applyTheme.ts", icon: "file-code" }] },
      { id: "src/index.ts", label: "index.ts", icon: "file-code" },
    ],
  },
  { id: "docs", label: "docs", children: [{ id: "docs/DESIGN_LANGUAGE.md", label: "DESIGN_LANGUAGE.md", icon: "document" }] },
  { id: "README.md", label: "README.md", icon: "document" },
  { id: "package.json", label: "package.json", icon: "file" },
];
