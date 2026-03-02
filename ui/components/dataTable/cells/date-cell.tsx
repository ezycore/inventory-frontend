import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useAuthStore } from "@/services/stores";

export interface DateCellProps {
  value: string | Date;
  className?: string;
  isShowDateOnly?: boolean;
  /** Override the default date format (dd-MM-yyyy) */
  dateFormat?: string;
  /** Override the default time format (hh:mm a) */
  timeFormat?: string;
}

export function DateCell({
  value,
  isShowDateOnly = true,
  className = "text-sm",
  dateFormat = "dd-MM-yyyy",
  timeFormat = "hh:mm a",
}: DateCellProps) {
  const timezone =
    useAuthStore.getState().user?.organization?.timezone || "UTC";
  const date =
    value && parseISO(typeof value === "string" ? value : value.toISOString());

  const formatted =
    date &&
    formatInTimeZone(
      date,
      timezone,
      isShowDateOnly ? dateFormat : `${dateFormat}, ${timeFormat}`,
    );

  return <span className={className}>{formatted}</span>;
}
