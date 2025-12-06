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
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? <span className="flex-1">{format(date, "PPP")}</span> : <span>{placeholder}</span>}
          {date && (
            <div
              onClick={() => onSelect?.(undefined)}
              className="cursor-pointer"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-6">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          className="[--cell-size:4rem] text-xl p-4"
        />
      </PopoverContent>
    </Popover>
  );
}
