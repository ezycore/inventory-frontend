// coding-standard: maintained
import { ChevronRight } from "lucide-react";
import type { AdminStorefrontOrder } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";
import { cn } from "@/ui/lib/utils";
import { Checkbox } from "@/ui/components/checkbox";
import { StatusBadge, type StatusBadgeProps } from "@/ui/components/status-badge";
import { CopyTrackLink } from "@/components/ecommerce/orders/copy-track-link";

export const ORDER_STATUS_BADGE: Record<string, StatusBadgeProps["status"]> = {
  pending: "pending",
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  returned: "returned",
  cancelled: "cancelled",
  rejected: "rejected",
};

const cap = (s: string) => `${s[0]?.toUpperCase() ?? ""}${s.slice(1)}`;

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};

/** One order row in the admin list. Extracted to keep the list page under the 250-line rule. */
export function OrderRow({
  order,
  currency,
  checked,
  onToggle,
  onOpen,
}: {
  order: AdminStorefrontOrder;
  currency?: string;
  checked: boolean;
  onToggle: (on: boolean) => void;
  onOpen: () => void;
}) {
  const provider = order.courier?.provider;
  return (
    <tr
      onClick={onOpen}
      className={cn(
        "cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40",
        checked && "bg-primary/5",
      )}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onToggle(c === true)}
          aria-label={`Select ${order.orderNumber}`}
        />
      </td>
      <td className="px-3 py-3 font-semibold">{order.orderNumber}</td>
      <td className="px-3 py-3 text-muted-foreground">
        {fmtDate(order.createdAt)}
      </td>
      <td className="px-3 py-3 font-medium">{order.shippingAddress?.name}</td>
      <td className="px-3 py-3 font-semibold tabular-nums">
        {formatMoney(order.totalAmount, currency)}
      </td>
      <td className="px-3 py-3 capitalize text-muted-foreground">
        {order.paymentMethod} · {order.paymentStatus}
      </td>
      <td className="px-3 py-3">
        {provider ? (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold capitalize text-gray-600">
              {cap(provider)}
            </span>
            {order.courier?.trackingCode && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {order.courier.trackingCode}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60">
            {order.fulfillmentType === "pickup" ? "Pickup" : "—"}
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={ORDER_STATUS_BADGE[order.status] ?? "info"} />
      </td>
      {/* The buyer's link, one tap from the list — for a guest or a Messenger
          order this is the only way they ever receive it. */}
      <td className="px-1 py-3" onClick={(e) => e.stopPropagation()}>
        <CopyTrackLink
          trackUrl={order.trackUrl}
          orderNumber={order.orderNumber}
        />
      </td>
      <td className="px-3 py-3 text-muted-foreground">
        <ChevronRight className="h-4 w-4" />
      </td>
    </tr>
  );
}
