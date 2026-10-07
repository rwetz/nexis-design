// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A number with steppers, bounds and a unit.
 *
 * Typing is free-form and only committed on blur or Enter, so a user can pass
 * through an out-of-range value on the way to a valid one ("1" on the way to
 * "16") without it snapping under their cursor. Arrow keys step; Shift steps
 * by ten.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";

export function clampStep(value: number, min: number, max: number, step: number, decimals: number): number {
  const stepped = Math.round(value / step) * step;
  const clamped = Math.min(max, Math.max(min, stepped));
  return Number(clamped.toFixed(decimals));
}

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  suffix?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  decimals = 0,
  suffix,
  disabled,
  className,
  ...aria
}: NumberInputProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = (n: number) => {
    if (!Number.isFinite(n)) return;
    onChange(clampStep(n, min, max, step, decimals));
  };
  const bump = (dir: 1 | -1, big = false) => commit(value + dir * step * (big ? 10 : 1));

  return (
    <div
      data-slot="number-input"
      className={cn(
        "inline-flex h-9 items-center rounded-3xl bg-input/50 pr-1 pl-3 text-sm transition-[box-shadow] focus-within:ring-3 focus-within:ring-ring/30",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <input
        {...aria}
        inputMode="decimal"
        disabled={disabled}
        value={draft ?? value.toFixed(decimals)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) commit(Number(draft));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (draft !== null) commit(Number(draft));
            setDraft(null);
          } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setDraft(null);
            bump(e.key === "ArrowUp" ? 1 : -1, e.shiftKey);
          } else if (e.key === "Escape") {
            setDraft(null);
          }
        }}
        className="w-full min-w-0 bg-transparent font-mono tabular-nums outline-none"
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
      />
      {suffix && <span className="mr-1 text-xs text-muted-foreground">{suffix}</span>}
      <span className="flex flex-col">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increase"
          disabled={value >= max}
          onClick={() => bump(1)}
          className="grid h-3.5 w-5 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Icon name="chevron-up" size={10} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrease"
          disabled={value <= min}
          onClick={() => bump(-1)}
          className="grid h-3.5 w-5 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Icon name="chevron-down" size={10} />
        </button>
      </span>
    </div>
  );
}
