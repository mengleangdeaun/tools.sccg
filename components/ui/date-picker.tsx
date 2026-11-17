"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onSelectDate?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** date-fns format for the button text; shorter formats fit narrow columns. */
  displayFormat?: string;
}

export function DatePicker({
  date,
  onSelectDate,
  placeholder = "Pick a date",
  className,
  disabled = false,
  displayFormat = "PPP",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const thisYear = new Date().getFullYear();
  let startMonth = new Date(thisYear - 30, 0);
  let endMonth = new Date(thisYear + 15, 11);
  if (date) {
    if (date < startMonth) startMonth = new Date(date.getFullYear(), 0);
    if (date > endMonth) endMonth = new Date(date.getFullYear(), 11);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-start text-left font-normal text-sm px-3",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate">
              {date ? format(date, displayFormat) : placeholder}
            </span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          defaultMonth={date ?? new Date()}
          startMonth={startMonth}
          endMonth={endMonth}
          onSelect={(selected) => {
            onSelectDate?.(selected);
            setOpen(false);
          }}
        />
        <div className="flex items-center justify-between border-t p-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              onSelectDate?.(new Date());
              setOpen(false);
            }}
          >
            Today
          </Button>
          {date && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                onSelectDate?.(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

