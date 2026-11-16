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
          onSelect={(selected) => {
            onSelectDate?.(selected);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

