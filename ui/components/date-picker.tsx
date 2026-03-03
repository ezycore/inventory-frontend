"use client"

import * as React from "react"
import { format as formatDate } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@ui/lib/utils"
import { Button } from "@ui/components/button"
import { Calendar } from "@ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/popover"

interface DatePickerProps {
  date?: Date | string
  onSelect?: (date: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string

  /** NEW */
  format?: string
  timezone?: string
}

const toZonedDate = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find(p => p.type === type)?.value ?? "00"

  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
  )
}


export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  format,
  timezone,
}: DatePickerProps) {
  const dateValue = React.useMemo(() => {
    if (!date) return undefined
    const parsed = date instanceof Date ? date : new Date(date)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [date])

  const handleSelect = (selectedDate?: Date) => {
    if (!selectedDate) {
      onSelect?.(undefined)
      return
    }

    // Default behavior (your current implementation)
    if (!format && !timezone) {
      onSelect?.(selectedDate.toISOString())
      return
    }

    const zonedDate = timezone
      ? toZonedDate(selectedDate, timezone)
      : selectedDate

    const value = format
      ? formatDate(zonedDate, format)
      : zonedDate.toISOString()

    onSelect?.(value)
  }

  const displayValue = React.useMemo(() => {
    if (!dateValue) return null

    if (!format && !timezone) {
      return formatDate(dateValue, "dd-MM-yyyy")
    }

    const zonedDate = timezone
      ? toZonedDate(dateValue, timezone)
      : dateValue

    return format
      ? formatDate(zonedDate, format)
      : formatDate(zonedDate, "dd-MM-yyyy")
  }, [dateValue, format, timezone])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {displayValue ? (
            <span className="flex-1">{displayValue}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          {dateValue && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(undefined)
              }}
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
  )
}