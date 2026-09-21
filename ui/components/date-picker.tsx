"use client"
// coding-standard: maintained

import * as React from "react"
import {
  format as dateFnsFormat,
  parseISO,
  isValid,
  startOfYear,
  endOfYear,
  addYears,
  subYears,
} from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import type { Matcher } from "react-day-picker"
import { cn } from "@ui/lib/utils"
import { Button } from "@ui/components/button"
import { Calendar } from "@ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/popover"

interface DatePickerProps {
  /** DOM id for the trigger button, so a `<Label htmlFor>` can focus it — a
   *  button is a labelable element, so this works the same as for an input. */
  id?: string
  date?: Date | string
  onSelect?: (date: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  outputFormat?: string
  displayFormat?: string
  timezone?: string
  /** Earliest selectable day (inclusive). Disables earlier days + caps navigation. */
  fromDate?: Date
  /** Latest selectable day (inclusive). Disables later days + caps navigation. */
  toDate?: Date
  /** Extra day matchers to disable, forwarded to react-day-picker. */
  disabledDates?: Matcher | Matcher[]
  /**
   * Caption style. Defaults to `"dropdown"` — month and year are selects, so a
   * date two years out is two clicks instead of twenty-four on the next arrow.
   * Pass `"label"` for the plain "September 2026" caption with arrows only.
   */
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
}

const DEFAULT_DISPLAY_FORMAT = "dd MMM yyyy"
// Date-only, timezone-safe. Used when no explicit outputFormat is given so a
// picked day never shifts across the date boundary in UTC+ offsets (e.g. BDT).
const DEFAULT_OUTPUT_FORMAT = "yyyy-MM-dd"
// How far the year dropdown reaches either side of today when the caller sets no
// fromDate/toDate. Covers the long end of what this app schedules — a two-year
// campaign, a long-dated batch expiry — while keeping the list scannable.
const DEFAULT_NAV_YEARS = 10

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
  id,
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  outputFormat,
  displayFormat,
  timezone,
  fromDate,
  toDate,
  disabledDates,
  captionLayout = "dropdown",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const dateValue = React.useMemo(() => parseDateSafe(date), [date])

  const handleSelect = (selectedDate?: Date) => {
    if (!selectedDate) {
      onSelect?.(undefined)
      setOpen(false)
      return
    }

    const needsTimezone = timezone && outputFormat && hasTimeParts(outputFormat)
    const base = needsTimezone ? toZonedDate(selectedDate, timezone!) : selectedDate
    const value = dateFnsFormat(base, outputFormat ?? DEFAULT_OUTPUT_FORMAT)

    onSelect?.(value)
    setOpen(false)
  }

  const handleClear = () => {
    onSelect?.(undefined)
  }

  const resolvedDisplayFormat = displayFormat ?? DEFAULT_DISPLAY_FORMAT

  const displayLabel = React.useMemo(
    () => (dateValue ? dateFnsFormat(dateValue, resolvedDisplayFormat) : null),
    [dateValue, resolvedDisplayFormat]
  )

  // Combine from/to bounds and caller matchers into a single `disabled` matcher.
  const disabledMatcher = React.useMemo<Matcher | Matcher[] | undefined>(() => {
    const matchers: Matcher[] = []
    if (fromDate) matchers.push({ before: fromDate })
    if (toDate) matchers.push({ after: toDate })
    if (disabledDates) {
      matchers.push(...(Array.isArray(disabledDates) ? disabledDates : [disabledDates]))
    }
    return matchers.length ? matchers : undefined
  }, [fromDate, toDate, disabledDates])

  // The navigable month window — which is also exactly the range the year
  // dropdown lists. It has to be explicit: react-day-picker's own fallback when
  // a dropdown caption has no bounds is a date-of-birth range (100 years back,
  // ending THIS December), so a campaign or expiry running into next year would
  // be unreachable. Stretched to contain the current value as well, so editing
  // an old row can still open on its month.
  const [navStart, navEnd] = React.useMemo(() => {
    const today = new Date()
    let start = fromDate ?? startOfYear(subYears(today, DEFAULT_NAV_YEARS))
    let end = toDate ?? endOfYear(addYears(today, DEFAULT_NAV_YEARS))
    if (dateValue) {
      if (dateValue < start) start = startOfYear(dateValue)
      if (dateValue > end) end = endOfYear(dateValue)
    }
    return [start, end]
  }, [fromDate, toDate, dateValue])

  return (
    // The clear button is a SIBLING of the trigger, never a child: PopoverTrigger
    // `asChild` turns the Button into the real <button>, and a <button> inside a
    // <button> is invalid HTML — React logs a hydration error for it. It is
    // absolutely positioned over the trigger's reserved right padding instead.
    // `className` lands on both: the wrapper needs the caller's width so the X
    // sits on the trigger's edge, the trigger needs its height/text styling.
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal gap-2",
              !dateValue && "text-muted-foreground",
              dateValue && !disabled && "pr-9",
              className
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">
              {displayLabel ?? placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            today={new Date()}
            autoFocus
            captionLayout={captionLayout}
            startMonth={navStart}
            endMonth={navEnd}
            disabled={disabledMatcher}
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
      {dateValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear date"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
