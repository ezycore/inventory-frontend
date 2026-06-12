"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@ui/lib/utils";
import { Button } from "@ui/components/button";
import { Calendar } from "@ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/popover";
import { useEffect, useLayoutEffect } from "react";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
}: DateRangePickerProps) {
  // const [date, setDate] = React.useState<DateRange | undefined>(
  //   value ? { from: value.from, to: value.to } : undefined
  // );


  const handleSelect = (range: DateRange | undefined) => {
    // setDate(range);
    onChange?.(range);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    // setDate(undefined);
    onChange?.(undefined);
  };

  const formatDateRange = () => {
    if (!value?.from) return placeholder;
    if (!value.to) return format(value.from, "PPP");
    return `${format(value.from, "PPP")} - ${format(value.to, "PPP")}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{formatDateRange()}</span>
          {value?.from && (
            <div
              onClick={handleClear}
              className="cursor-pointer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </div>

          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="hidden md:block">
          <Calendar
            mode="range"
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={1}
            classNames={{
              today: cn(
                "rounded-md ring-1 ring-foreground/40",
                "data-[selected=true]:ring-0"
              ),
              month_caption: "flex h-8 w-full items-center justify-center px-8",
              day: "group/day relative aspect-square h-8 w-8 select-none p-1 text-center",
            }}
          />

        </div>
        <div className="block md:hidden">
          <Calendar
            mode="range"
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={1}
            className="[--cell-size:3.5rem] text-lg p-2 w-72"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
