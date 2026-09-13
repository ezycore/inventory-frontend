"use client";
// coding-standard: maintained

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEcommerceDashboard } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { StatusBadge } from "@/ui/components/status-badge";
import { ORDER_STATUS_BADGE } from "@/lib/order-status";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";

/**
 * The last few storefront orders, with their status.
 *
 * Lifted out of the ecommerce dashboard so the MAIN dashboard can show it too.
 * That page loses several panels for a storefront-only merchant — no purchase
 * chart, no payable, no stock movements, no low-stock — and the space they left
 * was the problem: a shop whose entire trade is online opened its home screen to
 * a page with holes in it and no sign of the thing it actually does (QA-R3).
 *
 * Fetches its own data rather than taking a prop, because the two callers load
 * different overviews. `useEcommerceDashboard` is shared cache, so rendering it
 * beside the ecommerce page's own use costs no second request.
 *
 * The caller gates on the `storefront` feature — this component does not, so it
 * stays usable anywhere that has already made that decision.
 */
export function RecentOrders() {
  const t = useTranslations("dashboard.recentOrders");
  const { data, isLoading } = useEcommerceDashboard();
  const { labelFor } = useOrderStatusLabels();
  const orgCurrency = useAuthStore((s) => s.user?.organization?.currency);
  const currency = data?.currency ?? orgCurrency;

  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });

  return (
    <Card className="p-5 shadow-none">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <Link
          href="/ecommerce/orders"
          className="text-xs font-semibold text-primary"
        >
          {t("viewAll")}
        </Link>
      </div>
      {isLoading || !data ? (
        <Skeleton className="h-48 w-full" />
      ) : data.recentOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y">
          {data.recentOrders.map((o) => (
            <li key={o._id}>
              <Link
                href={`/ecommerce/orders/${o._id}`}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{o.orderNumber}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {o.shippingAddress?.name} · {shortDate(o.createdAt)}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums">
                  {formatMoney(o.totalAmount, currency)}
                </div>
                <StatusBadge
                  status={ORDER_STATUS_BADGE[o.status] ?? "info"}
                  label={labelFor(o.status)}
                  size="sm"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
