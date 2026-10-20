// coding-standard: maintained
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { bn } from "date-fns/locale";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import type { AdminStorefrontOrder } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";
import { cn } from "@/ui/lib/utils";
import { Checkbox } from "@/ui/components/checkbox";
import { StatusBadge } from "@/ui/components/status-badge";
import { CopyTrackLink } from "@/components/ecommerce/orders/copy-track-link";
import { CustomerPhone } from "@/components/ecommerce/orders/customer-phone";
import { OrderRowActions } from "@/components/ecommerce/orders/order-row-actions";
import {
  type BuyerHistory,
  buyerHistoryIsWarning,
  buyerHistoryLabel,
  orderAge,
  orderDetailHref,
  orderItemCount,
  orderPlacedAt,
  paymentMethodText,
  paymentStatusText,
  rejectionReasonLabel,
} from "@/components/ecommerce/orders/helpers";
import { ORDER_STATUS_BADGE } from "@/lib/order-status";

const cap = (s: string) => `${s[0]?.toUpperCase() ?? ""}${s.slice(1)}`;

/** One order row in the admin list. Extracted to keep the list page under the 250-line rule. */
export function OrderRow({
  order,
  currency,
  checked,
  statusLabel,
  buyerHistory,
  now,
  onToggle,
  onOpen,
  onShowBuyer,
}: {
  order: AdminStorefrontOrder;
  currency?: string;
  checked: boolean;
  /** The organization's wording for `order.status`, resolved once by the list. */
  statusLabel: string;
  /**
   * What this buyer has ordered before, looked up by the list in one aggregate.
   * Absent for a first-time buyer, and the row says nothing in that case.
   */
  buyerHistory?: BuyerHistory;
  /**
   * The clock the Age cell is measured against, ticked by the LIST (`useNow`).
   * Passed in rather than read here so a page of rows shares one timer instead
   * of setting one each.
   */
  now: Date;
  onToggle: (on: boolean) => void;
  onOpen: () => void;
  /** Filter the list to this buyer's orders — the history chip is the button for it. */
  onShowBuyer?: () => void;
}) {
  const { timezone } = useOrgCalendar();
  const t = useTranslations("ecommerce");
  const locale = useLocale();
  const provider = order.courier?.provider;
  const itemCount = orderItemCount(order.items);
  const reasonLabel = rejectionReasonLabel(order.rejectionReason, t);
  const historyLabel = buyerHistoryLabel(buyerHistory, t);
  const historyWarns = buyerHistoryIsWarning(buyerHistory);
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
          aria-label={t("orderRow.select", { orderNumber: order.orderNumber })}
        />
      </td>
      {/* An anchor, not just text inside the clickable row: the row's onClick
          gives a plain click and nothing else, so ctrl/cmd-click, middle-click
          and "Open link in new tab" all did nothing on a list whose whole job is
          working several orders at once. The href is what the browser needs;
          stopPropagation keeps the row from navigating a second time behind it. */}
      <td className="px-3 py-3 font-semibold">
        <Link
          href={orderDetailHref(order._id)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {order.orderNumber}
        </Link>
      </td>
      {/* Age, not a date. A COD order goes cold in hours, so the useful fact on
          a pending row is how long it has been waiting — the exact timestamp is
          still one hover away rather than gone. */}
      <td
        className="px-3 py-3 tabular-nums text-muted-foreground"
        title={orderPlacedAt(order.createdAt, timezone, locale === "bn" ? bn : undefined)}
      >
        {orderAge(order.createdAt, now, timezone, t)}
      </td>
      {/* The buyer's record sits under their name, which is where the pattern
          was already hiding in plain text: the same customer on three rows, every
          one rejected, and nothing joining them up. */}
      <td className="px-3 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{order.shippingAddress?.name}</span>
          {/* Directly under the name, because on a COD business the two ARE the
              customer — and the number is the half that is actually unique. Two
              buyers called Rahim are told apart by nothing else on this row. */}
          <CustomerPhone phone={order.shippingAddress?.phone} />
          {/* The chip IS "this buyer's orders", so it is the one-click filter to them —
              rather than the name, which reads as "open this order" like the rest of the row. */}
          {historyLabel && (
            <button
              type="button"
              disabled={!onShowBuyer}
              title={t("orderRow.showBuyer")}
              onClick={(event) => {
                // The row opens the order on click; this filters instead.
                event.stopPropagation();
                onShowBuyer?.();
              }}
              className={cn(
                "w-fit text-left text-xs underline-offset-2 enabled:hover:underline",
                historyWarns
                  ? "text-amber-700 dark:text-amber-500"
                  : "text-muted-foreground",
              )}
            >
              {historyLabel}
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold tabular-nums">
            {formatMoney(order.totalAmount, currency)}
          </span>
          {/* So a merchant knows whether they are packing one panjabi or ten
              without opening the order. Rides under the total instead of taking
              a column, which the row could not spare. */}
          <span className="text-xs text-muted-foreground">
            {t("orderRow.items", { count: itemCount })}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-muted-foreground">
        {paymentMethodText(order, t)} ·{" "}
        <span>{paymentStatusText(order.paymentStatus, t)}</span>
      </td>
      {/* Status, and everything that qualifies it: why it was rejected, and who
          is carrying it. The courier had its own column, which printed `—` on
          every order not yet dispatched — the large majority — so it spent width
          on an absence. Where it goes belongs to the fulfillment story anyway. */}
      <td className="px-3 py-3">
        <div className="flex flex-col items-start gap-1">
          <div className="flex flex-wrap items-center gap-1">
            <StatusBadge
              status={ORDER_STATUS_BADGE[order.status] ?? "info"}
              label={statusLabel}
            />
            {reasonLabel && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {reasonLabel}
              </span>
            )}
          </div>
          {provider && (
            <span className="text-xs text-muted-foreground">
              {cap(provider)}
              {order.courier?.trackingCode && (
                <span className="tabular-nums">
                  {" "}
                  · {order.courier.trackingCode}
                </span>
              )}
            </span>
          )}
          {!provider && order.fulfillmentType === "pickup" && (
            <span className="text-xs text-muted-foreground/70">{t("orderRow.pickup")}</span>
          )}
        </div>
      </td>
      {/* The buyer's link, one tap from the list — for a guest or a Messenger
          order this is the only way they ever receive it. */}
      <td className="px-1 py-3" onClick={(e) => e.stopPropagation()}>
        <CopyTrackLink
          trackUrl={order.trackUrl}
          orderNumber={order.orderNumber}
        />
      </td>
      {/* Replaces the chevron: the row itself already opens the order, so the
          cell is worth more as the triage menu than as a second affordance for
          the click the whole row performs. */}
      <td className="px-1 py-3" onClick={(e) => e.stopPropagation()}>
        <OrderRowActions order={order} onOpen={onOpen} />
      </td>
    </tr>
  );
}
