/**
 * A typeahead select for long or searchable lists (RULES R5: more than about
 * twelve options, or options people know by name). A `Popover` anchored to a
 * select-shaped trigger, with `Command` inside for filtering and the arrow
 * keys. For a short fixed list use `Select`.
 *
 *   <Combobox value={id} onValueChange={setId} options={projects} placeholder="Project" />
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Extra words that match the search but are not shown. */
  keywords?: string[];
  disabled?: boolean;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value: string | null;
  /** `null` when the user clears the selection (only with `clearable`). */
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** A selected option can be picked again to clear it. */
  clearable?: boolean;
  /** `sm` (32px) in a panel, `default` (36px) in a dialog or settings page. */
  size?: "sm" | "default";
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select",
  searchPlaceholder = "Search",
  emptyText = "No matches",
  clearable = false,
  size = "default",
  disabled,
  id,
  className,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  const pick = (option: ComboboxOption) => {
    if (option.value === value) {
      if (clearable) onValueChange(null);
    } else {
      onValueChange(option.value);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          data-slot="combobox-trigger"
          data-size={size}
          data-placeholder={selected ? undefined : ""}
          className={cn(
            "flex w-fit items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8",
            className,
          )}
          {...aria}
        >
          <span className="min-w-0 truncate">{selected ? selected.label : placeholder}</span>
          <Icon name="unfold" size="sm" className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" matchAnchorWidth className="gap-0 p-0">
        <Command className="rounded-3xl">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-ui text-muted-foreground">{emptyText}</CommandEmpty>
            {options.map((o) => (
              <CommandItem
                key={o.value}
                value={o.value}
                keywords={[o.label, ...(o.keywords ?? [])]}
                disabled={o.disabled}
                data-checked={o.value === value}
                onSelect={() => pick(o)}
                className={cn("text-body", size === "sm" && "text-ui", o.value === value && "font-medium")}
              >
                <span className="min-w-0 truncate">{o.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
