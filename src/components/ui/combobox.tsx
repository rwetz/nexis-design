// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ComboboxOption = {
  value: string;
  label: string;
  keywords?: readonly string[];
  disabled?: boolean;
};

type ComboboxProps = {
  label?: string;
  options: readonly ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  clearable?: boolean;
  size?: "sm" | "default";
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function Combobox({
  label, options, value, onValueChange, placeholder = "Choose an option",
  searchPlaceholder = "Search", emptyText = "No matches", clearable = false, size = "default",
  disabled, id, className, "aria-describedby": describedBy, "aria-invalid": invalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((option) => option.value === value);
  const name = label ?? placeholder;
  const active = (option: ComboboxOption) => JSON.stringify(option.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          disabled={disabled}
          variant="outline"
          size={size}
          aria-label={label ? `${label}: ${current?.label ?? placeholder}` : undefined}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn("w-56 justify-between font-normal", className)}
        >
          <span className="truncate">{current?.label ?? placeholder}</span>
          <Icon name="chevron-down" size="sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={name} align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command label={`Search ${name}`} defaultValue={current && active(current)}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList label={`${name} options`}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={active(option)}
                keywords={[option.label, ...(option.keywords ?? [])]}
                disabled={option.disabled}
                data-checked={option.value === value}
                onSelect={() => {
                  if (option.value !== value) onValueChange(option.value);
                  else if (clearable) onValueChange(null);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {option.value === value && <span className="sr-only">Current value</span>}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
