"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
  /** A second, smaller line in searchable dropdowns, e.g. a post's channel and date. Search matches the label. */
  hint?: string;
  /** Shown before the label in dropdown lists, e.g. a person's photo. Phones show text only. */
  icon?: React.ReactNode;
  /** A colored dot class shown before the label in the desktop list, e.g. "bg-amber-500". */
  dot?: string;
}

export interface ResponsiveSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Applied on desktop only. Phones always get the full-size native control. */
  className?: string;
  /** Shown before the value, e.g. a status dot. */
  prefix?: React.ReactNode;
  /** Colors and shape applied on every screen size, e.g. a status pill. */
  toneClassName?: string;
}

/** The phone's own picker, styled to match. Shared by every select that goes native on phones. */
export function NativeSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  id,
  "aria-label": ariaLabel,
  prefix,
  toneClassName,
}: Omit<ResponsiveSelectProps, "className">) {
  return (
    <div className="relative w-full">
      {prefix && (
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center">
          {prefix}
        </span>
      )}
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "h-11 w-full appearance-none truncate rounded-md border border-input bg-transparent pr-9 pl-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
          prefix && "pl-7",
          toneClassName
        )}
      >
        {placeholder && !value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-70"
      />
    </div>
  );
}

// A native <select> on phones opens the OS picker. Desktop keeps the styled dropdown.
export function ResponsiveSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
  prefix,
  toneClassName,
}: ResponsiveSelectProps) {
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
        prefix={prefix}
        toneClassName={toneClassName}
      />
    );
  }

  return (
    <Select
      value={value}
      disabled={disabled}
      items={[...options]}
      onValueChange={(next) => next !== null && onValueChange(next)}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn(className ?? "w-full", toneClassName)}>
        {prefix}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.dot && <span aria-hidden className={cn("size-2 shrink-0 rounded-full", option.dot)} />}
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
