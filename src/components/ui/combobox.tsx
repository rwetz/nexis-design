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
  label: string;
  options: readonly ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function Combobox({
  label, options, value, onChange, placeholder = "Choose an option",
  disabled, id, className, "aria-describedby": describedBy, "aria-invalid": invalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((option) => option.value === value);
  const active = (option: ComboboxOption) => JSON.stringify(option.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          disabled={disabled}
          variant="outline"
          aria-label={`${label}: ${current?.label ?? placeholder}`}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn("w-56 justify-between font-normal", className)}
        >
          <span className="truncate">{current?.label ?? placeholder}</span>
          <Icon name="chevron-down" size="sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={label} align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command label={`Search ${label}`} defaultValue={current && active(current)}>
          <CommandInput placeholder="Search options" />
          <CommandList label={`${label} options`}>
            <CommandEmpty>No matching options</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={active(option)}
                keywords={[option.label, ...(option.keywords ?? [])]}
                disabled={option.disabled}
                data-checked={option.value === value}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
                {option.value === value && <span className="sr-only">Current value</span>}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
