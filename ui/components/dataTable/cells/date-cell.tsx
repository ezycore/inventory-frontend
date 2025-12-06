import { useSettingsStore } from "@/stores";
import { formatDate, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
export interface DateCellProps {
  value: string | Date;
  className?: string;
  isShowDateOnly?: boolean;
}

export function DateCell({ 
  value, 
  isShowDateOnly = true,
  className = "text-sm"
}: DateCellProps) {
  const dateFormat = useSettingsStore((state) => state.dateFormat);
  const timezone = useSettingsStore((state) => state.timezone);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const date = parseISO(
    typeof value === "string" ? value : value.toISOString()
  );
  
  const formatted = formatInTimeZone(
  date, 
  timezone, 
  isShowDateOnly ? dateFormat : `${dateFormat}, ${timeFormat}`
);

  return (
    <span className={className}>
      {formatted}
    </span>
  );
}