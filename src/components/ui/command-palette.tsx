// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Every app in the family exposes its actions in a command palette on
 * Mod+Shift+P (docs/DESIGN_LANGUAGE.md §9). This is that palette, data-driven:
 * hand it `PaletteCommand`s and it does the rest — ranking, grouping, the
 * shortcut column, match highlighting, running the command and closing.
 *
 * Ranking is `fuzzyMatch` (lib/fuzzy.ts), not cmdk's built-in scorer, so
 * every app ranks "gc" → "Git: Commit" the same way and the scorer is
 * testable without a DOM. Groups keep their order of first appearance in the
 * *ranked* list, so the best match's group is always on top.
 */

import * as React from "react";
import { Icon, type IconName } from "../../icon/icon";
import { fuzzyMatch } from "../../lib/fuzzy";
import { MOD_PROP } from "../../lib/platform";
import { cn } from "../../lib/utils";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./command";

export type PaletteCommand = {
  id: string;
  label: string;
  group?: string;
  icon?: IconName;
  /** Display string, e.g. fmtShortcut(MOD_KEY, "N"). */
  shortcut?: string;
  /** Extra words to match on that are not shown. */
  keywords?: readonly string[];
  run: () => void;
  disabled?: boolean;
};

function Highlight({ text, indices }: { text: string; indices: readonly number[] }) {
  if (indices.length === 0) return <>{text}</>;
  const set = new Set(indices);
  return (
    <>
      {Array.from(text, (ch, i) =>
        set.has(i) ? (
          <span key={i} className="font-semibold text-foreground">
            {ch}
          </span>
        ) : (
          ch
        ),
      )}
    </>
  );
}

export function rankCommands(commands: readonly PaletteCommand[], query: string) {
  const ranked = commands
    .map((c, i) => {
      const label = fuzzyMatch(query, c.label);
      const kw = Math.max(0, ...(c.keywords ?? []).map((k) => fuzzyMatch(query, k).score * 0.8));
      return { c, i, score: Math.max(label.score, kw), indices: label.score >= kw ? label.indices : [] };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const groups = new Map<string, typeof ranked>();
  for (const r of ranked) {
    const g = r.c.group ?? "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(r);
  }
  return [...groups.entries()];
}

export function CommandPalette({
  open,
  onOpenChange,
  commands,
  placeholder = "Type a command…",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: readonly PaletteCommand[];
  placeholder?: string;
}) {
  const [query, setQuery] = React.useState("");
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  const groups = React.useMemo(() => rankCommands(commands, query), [commands, query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      <Command shouldFilter={false} className="bg-transparent">
      <CommandInput value={query} onValueChange={setQuery} placeholder={placeholder} />
      <CommandList className="max-h-[22rem]">
        <CommandEmpty>No command matches “{query}”.</CommandEmpty>
        {groups.map(([group, items]) => (
          <CommandGroup key={group || "_"} heading={group || undefined}>
            {items.map(({ c, indices }) => (
              <CommandItem
                key={c.id}
                value={c.id}
                disabled={c.disabled}
                onSelect={() => {
                  onOpenChange(false);
                  // After close, so a command that opens a dialog does not
                  // fight the palette's own focus restoration.
                  requestAnimationFrame(() => c.run());
                }}
              >
                {c.icon ? <Icon name={c.icon} className="text-muted-foreground" /> : <span className="w-3.5" />}
                <span className={cn("flex-1 truncate", query && "text-foreground/75")}>
                  <Highlight text={c.label} indices={indices} />
                </span>
                {c.shortcut && <CommandShortcut>{c.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}

/**
 * Binds Mod+Shift+P (Cmd on macOS, Ctrl elsewhere) to toggle a palette.
 * Listens on `window` in the capture phase, so it works no matter what has
 * focus — including an editor or terminal that would otherwise eat the keys.
 */
export function useCommandPaletteShortcut(toggle: () => void, key = "p") {
  const ref = React.useRef(toggle);
  ref.current = toggle;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = MOD_PROP === "meta" ? e.metaKey : e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === key) {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [key]);
}
