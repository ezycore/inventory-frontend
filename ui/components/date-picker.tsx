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
  outputFormat?: string
  displayFormat?: string
  timezone?: string
}

const DEFAULT_DISPLAY_FORMAT = "dd MMM yyyy"

function parseDateSafe(date: Date | string | undefined): Date | undefined {
  if (!date) return undefined
  const parsed = date instanceof Date ? date : parseISO(date as string)
  if (!isValid(parsed)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[DatePicker] Invalid date value:", date)
    }
    return undefined
  }
  return parsed
}

function hasTimeParts(format: string): boolean {
  return /[HhmsSaA]/.test(format)
}

function toZonedDate(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) => {
    const val = parts.find(p => p.type === type)?.value ?? "00"
    return val === "24" ? "00" : val
  }

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
  outputFormat,
  displayFormat,
  timezone,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const dateValue = React.useMemo(() => parseDateSafe(date), [date])

  const handleSelect = (selectedDate?: Date) => {
    if (!selectedDate) {
      onSelect?.(undefined)
      return
    }

    const needsTimezone = timezone && outputFormat && hasTimeParts(outputFormat)
    const base = needsTimezone ? toZonedDate(selectedDate, timezone!) : selectedDate
    const value = outputFormat ? dateFnsFormat(base, outputFormat) : base.toISOString()

    onSelect?.(value)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(undefined)
  }

  const resolvedDisplayFormat = displayFormat ?? DEFAULT_DISPLAY_FORMAT

  const displayLabel = React.useMemo(
    () => (dateValue ? dateFnsFormat(dateValue, resolvedDisplayFormat) : null),
    [dateValue, resolvedDisplayFormat]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal gap-2",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            {displayLabel ?? placeholder}
          </span>
          {dateValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear date"
              className="ml-auto h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          today={new Date()}
          autoFocus
          classNames={{
            today: cn(
              "rounded-md ring-1 ring-foreground/40",
              "data-[selected=true]:ring-0"
            ),
            month_caption: "flex h-8 w-full items-center justify-center px-8",
    day: "group/day relative aspect-square h-8 w-8 select-none p-0 text-center",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}