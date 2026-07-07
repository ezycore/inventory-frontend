"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
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

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

const rangeClassNames = {
  today: cn("rounded-md ring-1 ring-foreground/40", "data-[selected=true]:ring-0"),
  month_caption: "flex h-8 w-full items-center justify-center px-8",
  day: "group/day relative aspect-square h-8 w-8 select-none p-1 text-center",
};

/** Format a date only when it is a valid Date — guards date-fns `format`
 *  from throwing on `Invalid Date`. */
function formatSafe(date: Date | undefined): string | null {
  return date && isValid(date) ? format(date, "PPP") : null;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onChange?.(range);
    // Close once a complete range is chosen; keep open while picking the end.
    if (range?.from && range?.to) setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  const label = React.useMemo(() => {
    const from = formatSafe(value?.from);
    if (!from) return placeholder;
    const to = formatSafe(value?.to);
    return to ? `${from} - ${to}` : from;
  }, [value?.from, value?.to, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal gap-2",
            !value?.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{label}</span>
          {value?.from && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear date range"
              className="ml-auto h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={handleSelect}
          numberOfMonths={1}
          autoFocus
          // Larger touch targets on mobile, compact on md+.
          className="[--cell-size:3.5rem] text-lg md:[--cell-size:2rem] md:text-base"
          classNames={rangeClassNames}
        />
      </PopoverContent>
    </Popover>
  );
}
