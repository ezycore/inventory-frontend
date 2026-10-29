"use client";
// coding-standard: maintained

import { Heart } from "lucide-react";
import { useShopperWishlist } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";
import { fmtDate } from "@/components/ecommerce/customers/accounts-table";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";

/**
 * One online customer's saved products, on their detail page (backend
 * `docs/plan/wishlist.md`, Phase 3) — a lead to follow up: something they want,
 * often something sold out.
 */
export function CustomerWishlistCard({
  shopperId,
  currency,
}: {
  shopperId: string;
  currency?: string;
}) {
  const { timezone } = useOrgCalendar();
  const { data: items, isLoading } = useShopperWishlist(shopperId);

  return (
    <Card className="space-y-3 p-5 shadow-none">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <Heart className="h-4 w-4 text-rose-500" /> Wishlist
      </h3>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !items?.length ? (
        <p className="text-sm text-muted-foreground">Nothing saved.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.productId} className="text-sm">
              <div className="truncate font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.price === null ? "Priced per option" : formatMoney(item.price, currency)}
                {" · "}
                {item.purchasedAt
                  ? `bought ${fmtDate(item.purchasedAt, timezone)}`
                  : `saved ${fmtDate(item.addedAt, timezone)}`}
                {item.soldOut ? (
                  <span className="text-destructive"> · sold out</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
