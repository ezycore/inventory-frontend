// coding-standard: maintained
import { formatMoney } from "@/components/storefront/format";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * Campaign/coupon discount table cell — `10%` for percentage discounts,
 * currency-formatted (org currency) for fixed amounts.
 */
export function DiscountCell({
  type,
  value,
}: {
  type: "percentage" | "fixed" | string;
  value: number | null | undefined;
}) {
  if (type === "percentage") return <span>{value ?? 0}%</span>;
  const currency = useAuthStore.getState().user?.organization?.currency;
  return <span>{formatMoney(value, currency)}</span>;
}
