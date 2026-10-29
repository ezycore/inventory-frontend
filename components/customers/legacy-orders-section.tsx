"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { formatCurrency } from "@/lib/currency";
import { useLegacyOrders } from "@/services/api";

/** Lines shown per order before "and N more". */
const LINES_SHOWN = 3;

/**
 * A customer's orders from the store the merchant migrated off (backend
 * `docs/plan/data-migration.md` Phase 4) — history only, never a sale. Draws
 * nothing for a customer who has none, which is every customer of a workspace
 * that never migrated.
 *
 * Amounts are printed in the old store's own currency, as recorded: they were
 * never converted and are not this workspace's money. Formatted like every
 * other amount (৳1,500.00, not "BDT 1,500") with that currency's symbol.
 */
export function LegacyOrdersSection({ customerId }: { customerId: string }) {
  const t = useTranslations("customers.legacyOrders");
  const { formatDate } = useFormatters();
  const { data: orders = [] } = useLegacyOrders(customerId);
  if (orders.length === 0) return null;

  return (
    <section className="border-t px-6 py-4">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">{t("hint")}</p>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order._id} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{t("order", { number: order.number })}</span>
              <span className="tabular-nums">
                {formatCurrency(order.total, order.currency)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(order.placedAt)} · {order.status}
            </div>
            <ul className="mt-1 text-xs">
              {order.lines.slice(0, LINES_SHOWN).map((line, index) => (
                <li key={index} className="break-words">
                  {line.quantity} × {line.name}
                </li>
              ))}
              {order.lines.length > LINES_SHOWN && (
                <li className="text-muted-foreground">{t("more", { count: order.lines.length - LINES_SHOWN })}</li>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
