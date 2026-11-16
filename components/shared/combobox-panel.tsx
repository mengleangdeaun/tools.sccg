"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/components/ui/responsive-select";

/** Matches the existing select trigger, with a taller touch target on phones. */
export const COMBOBOX_TRIGGER =
  "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-left text-base shadow-xs outline-none transition-[border-color,box-shadow] focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:text-sm data-popup-open:ring-1 data-popup-open:ring-ring";

/** Popup as wide as its button, or wider for long options such as post titles. */
export const POPUP_WIDTH = {
  trigger: "w-(--anchor-width) min-w-56",
  wide: "w-[min(32rem,calc(100vw-2rem))]",
} as const;

interface ComboboxPanelProps {
  searchPlaceholder?: string;
  footer?: React.ReactNode;
  width?: keyof typeof POPUP_WIDTH;
}

// The popup shared by the searchable selects: a search box, the filtered options, and an empty state.
export function ComboboxPanel({ searchPlaceholder = "Search...", footer, width = "trigger" }: ComboboxPanelProps) {
  return (
    <Combobox.Portal>
      <Combobox.Positioner align="start" sideOffset={4} collisionPadding={16} className="isolate z-50">
        <Combobox.Popup
          className={cn(
            "flex max-h-80 origin-(--transform-origin) flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            POPUP_WIDTH[width]
          )}
        >
          <div className="relative border-b">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Combobox.Input
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent pr-3 pl-8 text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
          </div>
          <Combobox.Empty className="px-3 py-6 text-center text-sm text-muted-foreground empty:hidden">
            No matches.
          </Combobox.Empty>
          <Combobox.List className="min-h-0 flex-1 overflow-y-auto p-1 empty:p-0">
            {(option: SelectOption) => (
              <Combobox.Item
                key={option.value}
                value={option}
                className="group relative flex min-h-10 cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground md:min-h-8"
              >
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="min-w-0">
                  <span className={cn("block", option.hint ? "line-clamp-2 font-medium" : "truncate")}>{option.label}</span>
                  {/* Grey is unreadable on the colored highlight, so the hint takes the highlight's text color there. */}
                  {option.hint && (
                    <span className="block truncate text-xs text-muted-foreground group-data-highlighted:text-accent-foreground/80">
                      {option.hint}
                    </span>
                  )}
                </span>
                <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center text-primary">
                  <CheckIcon className="size-4" />
                </Combobox.ItemIndicator>
              </Combobox.Item>
            )}
          </Combobox.List>
          {footer}
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  );
}
