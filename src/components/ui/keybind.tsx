// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Keys you can change (RULES R7 "change a key binding"). `KeyCapture` is a
 * keycap button: click (or Enter) arms it, the next key binds, Esc or blur
 * cancels; it listens in the capture phase so nothing else sees that key.
 * `KeybindTable` lists actions and their keys, shows mouse rows as fixed,
 * marks a key bound twice on every row that shares it, and resets.
 *
 * Bindings are `{ defaultCode: chosenCode }`. `keyRemap` turns them into the
 * lookup a key handler applies before it reads keys (chosen -> default, and
 * the defaults that were moved away), so the code that reads keys keeps
 * reading the codes it was written for. Codes are `KeyboardEvent.code`.
 * From Stipple.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Kbd } from "./kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type KeyBindings = Record<string, string>;
/** One action: what it does, and its keys. A key with `code: null` is fixed (a mouse button, a wheel). */
export type KeyAction = { label: string; keys: { label: string; code: string | null }[] };

/** Keys a binding may use by default: letters, digits, arrows, Space, Shift, brackets. */
export const BINDABLE_KEYS = /^(Key[A-Z]|Digit\d|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Bracket(Left|Right))$/;

const ARROWS: Record<string, string> = { ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right" };

/** The keycap text for a code: "KeyW" -> "W", "ArrowUp" -> "Up", "BracketLeft" -> "[". */
export function keyCodeLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code in ARROWS) return ARROWS[code];
  if (code === "ShiftLeft") return "Shift";
  if (code === "ShiftRight") return "Right Shift";
  if (code === "BracketLeft") return "[";
  if (code === "BracketRight") return "]";
  return code;
}

/** The code a keycap label stands for, or null for mouse rows ("Click", "Wheel"). */
export function keyLabelToCode(label: string): string | null {
  if (/^[A-Z]$/.test(label)) return `Key${label}`;
  if (/^\d$/.test(label)) return `Digit${label}`;
  if (label === "Space") return "Space";
  if (label === "Shift") return "ShiftLeft";
  if (label === "[") return "BracketLeft";
  if (label === "]") return "BracketRight";
  if (/^(Up|Down|Left|Right)$/.test(label)) return `Arrow${label}`;
  return null;
}

/** Actions from keycap labels: `[{ label: "Move", keys: ["W", "A"] }]`. */
export function keyActions(rows: readonly { label: string; keys: readonly string[] }[]): KeyAction[] {
  return rows.map((r) => ({ label: r.label, keys: r.keys.map((k) => ({ label: k, code: keyLabelToCode(k) })) }));
}

/** What a key handler applies: chosen key -> default key, and the defaults moved away (ignored). */
export function keyRemap(b: KeyBindings): { map: Record<string, string>; blocked: Set<string> } {
  const map: Record<string, string> = {};
  for (const [def, user] of Object.entries(b)) if (user !== def) map[user] = def;
  const blocked = new Set(Object.keys(b).filter((def) => b[def] !== def && !(def in map)));
  return { map, blocked };
}

/** Default codes whose bound key is also bound to another action. */
export function keyConflicts(actions: readonly KeyAction[], b: KeyBindings): Set<string> {
  const byKey = new Map<string, string[]>();
  for (const a of actions)
    for (const k of a.keys) {
      if (!k.code) continue;
      const bound = b[k.code] ?? k.code;
      byKey.set(bound, [...(byKey.get(bound) ?? []), k.code]);
    }
  return new Set([...byKey.values()].filter((d) => d.length > 1).flat());
}

/** One rebindable key: shows the bound key, listens for a new one when armed. */
export function KeyCapture({
  value,
  isDefault = true,
  conflict = false,
  onChange,
  label,
  bindable = BINDABLE_KEYS,
}: {
  /** The bound `KeyboardEvent.code`. */
  value: string;
  isDefault?: boolean;
  conflict?: boolean;
  onChange: (code: string) => void;
  /** What the key does, for screen readers. */
  label: string;
  bindable?: RegExp;
}) {
  const [armed, setArmed] = React.useState(false);
  const change = React.useRef(onChange);
  change.current = onChange;
  React.useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") return setArmed(false);
      if (!bindable.test(e.code)) return;
      change.current(e.code);
      setArmed(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [armed, bindable]);
  return (
    <button
      type="button"
      data-slot="key-capture"
      onClick={() => setArmed((a) => !a)}
      onBlur={() => setArmed(false)}
      aria-label={armed ? `Press a key for ${label}` : `${label}: ${keyCodeLabel(value)}. Change`}
      className={cn(
        "inline-flex h-7 min-w-9 items-center justify-center rounded-md border px-2 text-ui font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        armed
          ? "border-ring bg-background text-muted-foreground"
          : conflict
            ? "border-warning bg-muted text-warning"
            : isDefault
              ? "border-border bg-muted text-foreground hover:border-foreground/30"
              : "border-foreground/40 bg-muted text-foreground hover:border-foreground/60",
      )}
    >
      {armed ? "Press a key" : keyCodeLabel(value)}
    </button>
  );
}

export function KeybindTable({
  actions,
  bindings,
  onChange,
  compact = false,
  bindable,
  className,
}: {
  actions: readonly KeyAction[];
  bindings: KeyBindings;
  onChange: (b: KeyBindings) => void;
  compact?: boolean;
  bindable?: RegExp;
  className?: string;
}) {
  const clash = keyConflicts(actions, bindings);
  const changed = Object.entries(bindings).some(([d, u]) => d !== u);
  const set = (def: string, code: string) => {
    const next = { ...bindings };
    if (code === def) delete next[def];
    else next[def] = code;
    onChange(next);
  };
  return (
    <div data-slot="keybind-table" className={cn("flex flex-col gap-row", className)}>
      <table className={cn("w-full", compact ? "text-ui" : "text-body")}>
        <tbody>
          {actions.map((a) => (
            <tr key={a.label} className="border-b border-border last:border-b-0">
              <td className="py-2 pr-group text-muted-foreground">{a.label}</td>
              <td className="py-2 text-right whitespace-nowrap">
                <span className="inline-flex flex-wrap justify-end gap-1">
                  {a.keys.map((k) => {
                    if (!k.code)
                      return (
                        <Tooltip key={k.label}>
                          <TooltipTrigger asChild>
                            <span tabIndex={0} className="outline-none">
                              <Kbd>{k.label}</Kbd>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Mouse controls are fixed</TooltipContent>
                        </Tooltip>
                      );
                    const def = k.code;
                    const cur = bindings[def] ?? def;
                    return (
                      <KeyCapture
                        key={k.label}
                        value={cur}
                        isDefault={cur === def}
                        conflict={clash.has(def)}
                        label={`${a.label} (${k.label})`}
                        bindable={bindable}
                        onChange={(c) => set(def, c)}
                      />
                    );
                  })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-row">
        <span className={cn("flex items-center gap-inline text-caption", clash.size ? "text-warning" : "text-muted-foreground")}>
          {clash.size ? (
            <>
              <Icon name="alert" size="sm" /> A key is used twice: only one of its actions will work.
            </>
          ) : (
            "Click a key, then press the new one. Esc cancels."
          )}
        </span>
        <Button variant="ghost" size="sm" disabled={!changed} onClick={() => onChange({})}>
          <Icon name="revert" /> Reset to defaults
        </Button>
      </div>
    </div>
  );
}
