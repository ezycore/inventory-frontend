"use client"

import * as React from "react"
import { format as dateFnsFormat, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@ui/lib/utils"
import { Button } from "@ui/components/button"
import { Calendar } from "@ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/popover"

interface DatePickerProps {
  date?: Date | string
  onSelect?: (date: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  outputFormat?: string   // e.g. "yyyy-MM-dd"
  timezone?: string       // e.g. "Asia/Dhaka" — only used for datetime output
}

/** Extracts date parts as seen in a given timezone, returns a local Date. 
 *  Only useful when outputFormat includes time (HH, mm, ss). */
const toZonedDate = (date: Date, timeZone: string): Date => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00"
  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
  )
}

const DEFAULT_DISPLAY_FORMAT = "dd-MM-yyyy"

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  outputFormat,
  timezone,
}: DatePickerProps) {
  
  // Safely parse incoming date string/object
  const dateValue = React.useMemo(() => {
    if (!date) return undefined
    const parsed = date instanceof Date ? date : parseISO(date as string)
    return isValid(parsed) ? parsed : undefined
  }, [date])

  const handleSelect = (selectedDate?: Date) => {
    if (!selectedDate) { onSelect?.(undefined); return }

    // Only apply timezone conversion if outputting a datetime format
    const needsTimezone = timezone && outputFormat && /[HhmsSaA]/.test(outputFormat)
    const base = needsTimezone ? toZonedDate(selectedDate, timezone!) : selectedDate

    const value = outputFormat
      ? dateFnsFormat(base, outputFormat)
      : base.toISOString()

    onSelect?.(value)
  }

  const displayValue = React.useMemo(() => {
    if (!dateValue) return null
    return dateFnsFormat(dateValue, outputFormat ?? DEFAULT_DISPLAY_FORMAT)
  }, [dateValue, outputFormat])

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
          {displayValue
            ? <span className="flex-1">{displayValue}</span>
            : <span>{placeholder}</span>
          }
          {dateValue && (
            <div onClick={(e) => { e.stopPropagation(); onSelect?.(undefined) }} className="cursor-pointer">
              <X className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={dateValue} onSelect={handleSelect} autoFocus />
      </PopoverContent>
    </Popover>
  )
}