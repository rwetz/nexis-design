// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A hierarchical list: files, outlines, request collections.
 *
 * Renders the *visible* nodes flat (`flattenTree`) rather than as nested
 * lists, so keyboard movement is index arithmetic and a 2,000-node tree is one
 * loop. WAI-ARIA tree semantics: Up/Down move, Right opens or steps in, Left
 * closes or steps out, Enter/Space selects, Home/End jump.
 *
 * Rows sit under `role="tree"`, which also keeps the default theme's rainbow
 * hover off them (rainbowAccent.ts excludes trees — a tint across a file name
 * erases the file-type colour).
 */

import * as React from "react";
import { Icon, type IconName } from "../../icon/icon";
import { cn } from "../../lib/utils";

export type TreeNode = {
  id: string;
  label: string;
  icon?: IconName;
  meta?: React.ReactNode;
  children?: readonly TreeNode[];
};

export type FlatNode = { node: TreeNode; depth: number; parentId: string | null; hasChildren: boolean };

export function flattenTree(nodes: readonly TreeNode[], expanded: ReadonlySet<string>): FlatNode[] {
  const out: FlatNode[] = [];
  const walk = (list: readonly TreeNode[], depth: number, parentId: string | null) => {
    for (const node of list) {
      const hasChildren = !!node.children && node.children.length > 0;
      out.push({ node, depth, parentId, hasChildren });
      if (hasChildren && expanded.has(node.id)) walk(node.children!, depth + 1, node.id);
    }
  };
  walk(nodes, 0, null);
  return out;
}

type TreeProps = {
  nodes: readonly TreeNode[];
  expanded: ReadonlySet<string>;
  onExpandedChange: (next: Set<string>) => void;
  selected?: string | null;
  onSelect?: (id: string, node: TreeNode) => void;
  label: string;
  className?: string;
};

export function Tree({ nodes, expanded, onExpandedChange, selected, onSelect, label, className }: TreeProps) {
  const flat = React.useMemo(() => flattenTree(nodes, expanded), [nodes, expanded]);
  const [focusId, setFocusId] = React.useState<string | null>(selected ?? flat[0]?.node.id ?? null);
  const refs = React.useRef(new Map<string, HTMLDivElement>());

  const toggle = (id: string, open?: boolean) => {
    const next = new Set(expanded);
    const willOpen = open ?? !next.has(id);
    if (willOpen) next.add(id);
    else next.delete(id);
    onExpandedChange(next);
  };

  const focus = (id: string | undefined | null) => {
    if (!id) return;
    setFocusId(id);
    refs.current.get(id)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const f = flat[i];
    switch (e.key) {
      case "ArrowDown":
        focus(flat[i + 1]?.node.id);
        break;
      case "ArrowUp":
        focus(flat[i - 1]?.node.id);
        break;
      case "ArrowRight":
        if (f.hasChildren && !expanded.has(f.node.id)) toggle(f.node.id, true);
        else if (f.hasChildren) focus(flat[i + 1]?.node.id);
        break;
      case "ArrowLeft":
        if (f.hasChildren && expanded.has(f.node.id)) toggle(f.node.id, false);
        else focus(f.parentId);
        break;
      case "Home":
        focus(flat[0]?.node.id);
        break;
      case "End":
        focus(flat[flat.length - 1]?.node.id);
        break;
      case "Enter":
      case " ":
        onSelect?.(f.node.id, f.node);
        if (f.hasChildren) toggle(f.node.id);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div role="tree" aria-label={label} className={cn("flex flex-col py-1 text-[13px]", className)}>
      {flat.map((f, i) => {
        const open = expanded.has(f.node.id);
        const isSel = f.node.id === selected;
        const icon: IconName = f.node.icon ?? (f.hasChildren ? (open ? "folder-open" : "folder") : "file");
        return (
          <div
            key={f.node.id}
            ref={(el) => {
              if (el) refs.current.set(f.node.id, el);
              else refs.current.delete(f.node.id);
            }}
            role="treeitem"
            aria-level={f.depth + 1}
            aria-expanded={f.hasChildren ? open : undefined}
            aria-selected={isSel}
            tabIndex={f.node.id === (focusId ?? flat[0]?.node.id) ? 0 : -1}
            onFocus={() => setFocusId(f.node.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => {
              setFocusId(f.node.id);
              onSelect?.(f.node.id, f.node);
              if (f.hasChildren) toggle(f.node.id);
            }}
            className={cn(
              "group/row relative mx-1 flex h-7 cursor-pointer items-center gap-1.5 rounded-lg pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isSel ? "bg-accent text-accent-foreground" : "text-foreground/85 hover:bg-muted/70",
            )}
            style={{ paddingLeft: 8 + f.depth * 14 }}
          >
            {Array.from({ length: f.depth }, (_, d) => (
              <span
                key={d}
                aria-hidden
                className="absolute inset-y-0 w-px bg-border/60"
                style={{ left: 14 + d * 14 }}
              />
            ))}
            <span className="grid w-3 place-items-center text-muted-foreground">
              {f.hasChildren && (
                <Icon name="chevron-right" size={10} className={cn("transition-transform", open && "rotate-90")} />
              )}
            </span>
            <Icon name={icon} className={cn(f.hasChildren ? "text-brand/80" : "text-muted-foreground")} active={isSel && !f.hasChildren} />
            <span className="flex-1 truncate">{f.node.label}</span>
            {f.node.meta !== undefined && <span className="text-[11px] text-muted-foreground">{f.node.meta}</span>}
          </div>
        );
      })}
    </div>
  );
}
