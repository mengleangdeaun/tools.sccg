"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { cn } from "@/lib/utils";

export interface FilterChip {
  key: string;
  text: string;
  clear: () => void;
}

export interface FilterToggle {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** Quick on/off filters shown as buttons, e.g. "My work". */
  toggles?: FilterToggle[];
  /** One per filter set inside the panel; each can be cleared on its own. */
  chips: FilterChip[];
  /** The fields inside the Filters panel. */
  panel: React.ReactNode;
  /** Clears everything the panel holds. */
  onClearPanel: () => void;
  /** Shows Reset when anything at all is filtered. */
  hasActiveFilters: boolean;
  onReset: () => void;
  /** Controls at the end of the row that are not filters, such as a sort. */
  trailing?: React.ReactNode;
}

const CONTROL = "h-10 md:h-8";

/**
 * One row: search, a Filters button that opens a side panel (a bottom drawer on phones),
 * quick toggles, and a chip per active panel filter, so nothing hides behind the panel.
 */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  toggles = [],
  chips,
  panel,
  onClearPanel,
  hasActiveFilters,
  onReset,
  trailing,
}: FilterBarProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={searchPlaceholder.replace(/\.+$/, "")}
          placeholder={searchPlaceholder}
          value={search}
          enterKeyHint="search"
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn("pl-9", CONTROL)}
        />
      </div>

      <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)} className={cn(CONTROL, "gap-1.5")}>
        <SlidersHorizontal />
        Filters
        {chips.length > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-xs leading-4 font-semibold text-primary-foreground tabular-nums">
            {chips.length}
          </span>
        )}
      </Button>
      {toggles.map((toggle) => (
        <Button
          key={toggle.label}
          variant={toggle.pressed ? "secondary" : "outline"}
          size="sm"
          aria-pressed={toggle.pressed}
          onClick={toggle.onToggle}
          className={CONTROL}
        >
          {toggle.label}
        </Button>
      ))}

      {chips.map((chip) => (
        <span key={chip.key} className="flex h-8 items-center gap-1 rounded-full border bg-muted/40 pr-1 pl-2.5 text-xs text-foreground">
          <button type="button" onClick={() => setPanelOpen(true)} className="max-w-52 truncate outline-none hover:underline focus-visible:underline">
            {chip.text}
          </button>
          <button
            type="button"
            aria-label={`Clear ${chip.text}`}
            onClick={chip.clear}
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className={cn(CONTROL, "text-muted-foreground")}>
          Reset
        </Button>
      )}

      {trailing && <div className="ml-auto">{trailing}</div>}

      {panelOpen && (
        <ResponsiveModal
          open
          variant="side"
          onClose={() => setPanelOpen(false)}
          title="Filters"
          description="Changes apply as you pick."
          footer={
            <FormActions>
              <Button type="button" variant="outline" onClick={onClearPanel} disabled={chips.length === 0}>
                Clear these
              </Button>
              <Button type="button" onClick={() => setPanelOpen(false)}>
                Done
              </Button>
            </FormActions>
          }
        >
          <div className="space-y-4">{panel}</div>
        </ResponsiveModal>
      )}
    </div>
  );
}

/** A labelled field inside the Filters panel. */
export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

/** A chip per non-empty list filter: the option's name for one pick, the count for several. */
export function listChips<K extends string>(
  keys: readonly K[],
  values: Record<K, string[]>,
  options: Record<K, { value: string; label: string }[]>,
  labels: Record<K, string>,
  clear: (key: K) => void
): FilterChip[] {
  return keys
    .filter((key) => values[key].length > 0)
    .map((key) => {
      const chosen = values[key];
      const label = chosen.length > 1 ? String(chosen.length) : (options[key].find((o) => o.value === chosen[0])?.label ?? chosen[0]);
      return { key, text: `${labels[key]}: ${label}`, clear: () => clear(key) };
    });
}
