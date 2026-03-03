"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@ui/lib/utils";
import { Button } from "@ui/components/button";
import { Calendar } from "@ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/popover";

interface DatePickerProps {
  date?: Date | string;
  onSelect?: (date: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
}: DatePickerProps) {
  // Convert string to Date if needed
  const dateValue = React.useMemo(() => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, [date]);

  // Handle date selection and convert to ISO string
  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onSelect?.(undefined);
    } else {
      onSelect?.(selectedDate.toISOString());
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4" />
          {dateValue ? <span className="flex-1">{format(dateValue, "dd-MM-yyyy")}</span> : <span>{placeholder}</span>}
          {dateValue && (
            <div
              onClick={() => onSelect?.(undefined)}
              className="cursor-pointer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
