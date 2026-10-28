/**
 * One labelled control in a panel (docs/RULES.md R4.4): label, control,
 * value.
 *
 * The label column is clamp(7rem, 38%, 10rem): a narrow panel doesn't crush
 * the control (Press's sliders collapsed to their thumb behind a fixed 8.5rem
 * label), and a wide one doesn't strand the label far from it. The value slot
 * is the same 3.5rem on every row, right-aligned and tabular, so slider
 * tracks line up down the panel. Labels wrap to two lines before they
 * truncate.
 *
 * `edited` puts a neutral dot after the label (R6.5) and, with `onReset`,
 * double-clicking the label resets the control.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export function ControlRow({
  label,
  htmlFor,
  hint,
  edited = false,
  onReset,
  value,
  children,
  className,
}: {
  label: React.ReactNode;
  /** The control's id, so the label focuses it. */
  htmlFor?: string;
  /** Shown as the label's tooltip. */
  hint?: string;
  edited?: boolean;
  onReset?: () => void;
  /** The readout (a slider's number). Leave it out and the control takes its slot. */
  value?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const tip = [hint, edited && onReset && "Double-click to reset"].filter(Boolean).join(". ") || undefined;
  return (
    <div
      data-slot="control-row"
      className={cn("grid min-h-8 grid-cols-[clamp(7rem,38%,10rem)_minmax(0,1fr)_3.5rem] items-center gap-x-3", className)}
    >
      <label
        htmlFor={htmlFor}
        title={tip}
        onDoubleClick={(e) => {
          if (!edited || !onReset) return;
          e.preventDefault();
          onReset();
        }}
        className={cn("flex min-w-0 items-center gap-1.5 text-ui leading-tight select-none", edited ? "text-foreground" : "text-muted-foreground")}
      >
        <span className="line-clamp-2 min-w-0">{label}</span>
        {edited && <span aria-label="edited" className="size-1.5 shrink-0 rounded-full bg-foreground/60" />}
      </label>
      <div className={cn("flex min-w-0 items-center", value === undefined && "col-span-2")}>{children}</div>
      {value !== undefined && <div className="flex min-w-0 items-center justify-end text-caption text-muted-foreground tabular-nums">{value}</div>}
    </div>
  );
}
