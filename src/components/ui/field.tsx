// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * A labelled form row: label, the control, and either a hint or an error
 * under it. Wires `htmlFor`/`aria-describedby`/`aria-invalid` so the control
 * is announced with its label and its error — the part every hand-built form
 * row forgets.
 *
 * `inline` puts the label on the left (settings screens); the default stacks
 * it above (dialogs, wizards).
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Label } from "./label";

type FieldProps = {
  label: React.ReactNode;
  /** Shown under the control while there is no error. */
  hint?: React.ReactNode;
  /** Replaces the hint and marks the control invalid. */
  error?: React.ReactNode | null;
  required?: boolean;
  inline?: boolean;
  /** The control. Must accept `id`, `aria-describedby` and `aria-invalid`. */
  children: React.ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  className?: string;
};

export function Field({ label, hint, error, required, inline = false, children, className }: FieldProps) {
  const auto = React.useId();
  const id = children.props.id ?? auto;
  const noteId = `${id}-note`;
  const note = error ?? hint;
  const control = React.cloneElement(children, {
    id,
    "aria-describedby": note ? noteId : undefined,
    "aria-invalid": error ? true : undefined,
  });
  return (
    <div
      data-slot="field"
      className={cn(
        inline ? "grid grid-cols-[minmax(8rem,14rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1" : "flex flex-col gap-1.5",
        className,
      )}
    >
      <Label htmlFor={id} className={cn(inline && "pt-2")}>
        {label}
        {required && (
          <span aria-hidden className="text-brand">
            *
          </span>
        )}
      </Label>
      <div className="flex min-w-0 flex-col gap-1.5">
        {control}
        {note && (
          <p
            id={noteId}
            className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}
          >
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
