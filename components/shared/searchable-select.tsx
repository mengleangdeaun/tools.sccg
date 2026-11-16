"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NativeSelect, type ResponsiveSelectProps, type SelectOption } from "@/components/ui/responsive-select";
import { COMBOBOX_TRIGGER, ComboboxPanel } from "./combobox-panel";

const sameOption = (a: SelectOption, b: SelectOption) => a.value === b.value;

type SearchableSelectProps = ResponsiveSelectProps & { searchPlaceholder?: string };

// Searchable from tablet size up. Phones keep their own picker, which has search built in where the OS offers it.
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
  searchPlaceholder,
}: SearchableSelectProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <NativeSelect
        id={id}
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        options={options}
        onValueChange={onValueChange}
      />
    );
  }

  return (
    <Combobox.Root
      items={options as SelectOption[]}
      value={options.find((option) => option.value === value) ?? null}
      onValueChange={(option: SelectOption | null) => option && onValueChange(option.value)}
      isItemEqualToValue={sameOption}
      disabled={disabled}
    >
      <Combobox.Trigger id={id} aria-label={ariaLabel} className={cn(COMBOBOX_TRIGGER, className)}>
        <Combobox.Value>
          {(option: SelectOption | null) =>
            option ? (
              <span className="flex min-w-0 items-center gap-2">
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="truncate">{option.label}</span>
              </span>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )
          }
        </Combobox.Value>
        <ChevronsUpDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </Combobox.Trigger>
      <ComboboxPanel searchPlaceholder={searchPlaceholder} />
    </Combobox.Root>
  );
}
