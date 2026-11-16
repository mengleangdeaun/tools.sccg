"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/components/ui/responsive-select";
import { COMBOBOX_TRIGGER, ComboboxPanel, POPUP_WIDTH } from "./combobox-panel";

interface SearchableMultiSelectProps {
  /** What is being chosen, e.g. "Channels". Shown when nothing is selected, and used as the accessible name. */
  label: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  options: readonly SelectOption[];
  searchPlaceholder?: string;
  className?: string;
  /** Shown when nothing is selected. Defaults to "All <label>", which suits filters. */
  placeholder?: string;
  /** "wide" lets the dropdown grow past its button, for long options such as post titles. */
  popupWidth?: keyof typeof POPUP_WIDTH;
}

const sameOption = (a: SelectOption, b: SelectOption) => a.value === b.value;

// An empty selection means "all". Searchable on every screen size: phones have no good native multi-select.
export function SearchableMultiSelect({
  label,
  value,
  onValueChange,
  options,
  searchPlaceholder,
  className,
  placeholder,
  popupWidth,
}: SearchableMultiSelectProps) {
  const selected = options.filter((option) => value.includes(option.value));
  const empty = placeholder ?? `All ${label.toLowerCase()}`;
  const summary =
    selected.length === 0 ? empty : selected.length === 1 ? selected[0].label : `${label}: ${selected.length}`;

  return (
    <Combobox.Root
      multiple
      items={options as SelectOption[]}
      value={selected}
      onValueChange={(next: SelectOption[]) => onValueChange(next.map((option) => option.value))}
      isItemEqualToValue={sameOption}
      // Keep the typed search after picking, so several matches can be chosen in a row.
      onInputValueChange={(_input, details) => {
        if (details.isItemPress) details.cancel();
      }}
    >
      <Combobox.Trigger
        aria-label={`${label}: ${selected.length ? selected.map((s) => s.label).join(", ") : placeholder ? "none" : "all"}`}
        className={cn(COMBOBOX_TRIGGER, className)}
      >
        <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>{summary}</span>
        <ChevronsUpDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </Combobox.Trigger>
      <ComboboxPanel
        width={popupWidth}
        searchPlaceholder={searchPlaceholder ?? `Search ${label.toLowerCase()}...`}
        footer={
          selected.length > 0 && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => onValueChange([])}
                className="h-10 w-full rounded-sm px-2 text-left text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent md:h-8"
              >
                Clear selection
              </button>
            </div>
          )
        }
      />
    </Combobox.Root>
  );
}
