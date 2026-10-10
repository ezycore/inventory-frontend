"use client";
// coding-standard: maintained

import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { useSalesReturn, type AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { ReturnDetailsSheet } from "@/components/sales/returns/return-details-sheet";
import { Card } from "@/ui/components/card";
import type { SalesReturn } from "@/types";
import { longDate } from "./order-detail-helpers";

/**
 * Every return taken against this order, each opening its return document (D6, backend
 * `docs/features/business-modes.md`).
 *
 * Online returns live with the order, in order language. The only way to a return document used to
 * be the counter's Sales Returns page — a search-by-invoice screen for a shop that may not run a
 * counter at all, and which a storefront-only shop no longer sees.
 */
export function OrderReturnsPanel({ order }: { order: AdminStorefrontOrder }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useSalesReturn(openId ?? "");
  const salesReturn = (data as { data?: SalesReturn } | undefined)?.data ?? null;

  const returns = order.returns ?? [];
  if (returns.length === 0) return null;

  return (
    <Card className="p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <RotateCcw className="h-4 w-4" />
        Returns
      </h2>
      <ul className="divide-y">
        {returns.map((entry, index) => (
          <li key={entry.salesReturnId}>
            <button
              type="button"
              onClick={() => setOpenId(entry.salesReturnId)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm hover:text-primary"
            >
              <span>
                Return {index + 1}
                {entry.at ? (
                  <span className="ml-2 text-xs text-muted-foreground">{longDate(entry.at)}</span>
                ) : null}
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                {entry.amount != null ? formatMoney(entry.amount, currency) : null}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <ReturnDetailsSheet
        open={!!openId}
        onOpenChange={(open) => !open && setOpenId(null)}
        salesReturn={salesReturn}
        isLoading={!!openId && isLoading}
        formatCurrency={(n) => formatMoney(n, currency)}
      />
    </Card>
  );
}
