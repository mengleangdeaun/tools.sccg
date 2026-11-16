"use client";

import * as React from "react";
import { format } from "date-fns";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

interface ResponsiveDatePickerProps {
  /** "YYYY-MM-DD", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
  /** Desktop button text format, e.g. "MMM d, yyyy". Phones show the OS format. */
  displayFormat?: string;
}

// A native date input on phones opens the OS calendar. Desktop keeps the styled picker.
export function ResponsiveDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  clearable = true,
  id,
  "aria-label": ariaLabel,
  className,
  displayFormat,
}: ResponsiveDatePickerProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <DatePicker
        date={value ? new Date(`${value}T00:00:00`) : undefined}
        onSelectDate={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        displayFormat={displayFormat}
      />
    );
  }

  return (
    <div className="relative w-full">
      <input
        id={id}
        aria-label={ariaLabel}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "peer h-11 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none [&::-webkit-date-and-time-value]:text-left focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
          !value && "text-transparent focus:text-foreground"
        )}
      />
      {/* An empty native date input shows nothing on iOS and dd/mm/yyyy on Android. */}
      {!value && (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-muted-foreground peer-focus:hidden">
          {placeholder}
        </span>
      )}
      {value && clearable && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear date"
          onClick={() => onChange("")}
          className="absolute top-0.5 right-0.5 h-10 w-10 text-muted-foreground"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
