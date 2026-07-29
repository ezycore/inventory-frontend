// coding-standard: maintained
import { useCurrency } from "@/lib/currency";

export interface MoneyCellProps {
  value: number;
  /** Text colour applied only when there is a non-zero amount to draw attention to. */
  accentClass?: string;
  className?: string;
}

/**
 * Currency-formatted table cell that stays muted at zero and takes `accentClass`
 * once there is an amount — e.g. blue for credit balance, red for outstanding due.
 */
export function MoneyCell({
  value,
  accentClass = "text-foreground",
  className = "",
}: MoneyCellProps) {
  const { format } = useCurrency();
  const tone = value > 0 ? `font-medium ${accentClass}` : "text-muted-foreground";

  return <span className={`${tone} ${className}`.trim()}>{format(value)}</span>;
}
