"use client";
// coding-standard: maintained

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AbandonedCart } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";

/**
 * The abandoned-cart list. Rows expand to their line items — carts are small
 * (capped at 50 lines server-side) and ship with the list payload, so opening one
 * costs no request.
 *
 * The **Shopper** column is the honest part: a cart that never signed in reads
 * "Guest — not reachable", because there is genuinely no contact detail and no
 * consent record for it. Showing a blank there would imply a merchant could chase
 * it. See the cohort table in the backend plan.
 */
interface AbandonedCartTableProps {
  carts: AbandonedCart[];
  currency?: string;
  isLoading?: boolean;
  emptyHint: string;
}

const STEP_LABEL: Record<string, string> = {
  cart: "Cart",
  signed_in: "Signed in",
  checkout: "Checkout",
  ordered: "Ordered",
};

export function AbandonedCartTable({
  carts,
  currency,
  isLoading,
  emptyHint,
}: AbandonedCartTableProps) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
            <th className="w-8" />
            <th className="px-3 py-3">Shopper</th>
            <th className="px-3 py-3">Items</th>
            <th className="px-3 py-3">Value</th>
            <th className="px-3 py-3">Got as far as</th>
            <th className="px-3 py-3">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b">
                <td colSpan={6} className="px-4 py-3">
                  <Skeleton className="h-5 w-full" />
                </td>
              </tr>
            ))
          ) : carts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center">
                <div className="text-sm font-semibold">Nothing here</div>
                <div className="mt-1 text-xs text-muted-foreground">{emptyHint}</div>
              </td>
            </tr>
          ) : (
            carts.map((cart) => {
              const expanded = open === cart._id;
              return (
                <CartRow
                  key={cart._id}
                  cart={cart}
                  currency={currency}
                  expanded={expanded}
                  onToggle={() => setOpen(expanded ? null : cart._id)}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function CartRow({
  cart,
  currency,
  expanded,
  onToggle,
}: {
  cart: AbandonedCart;
  currency?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b transition-colors hover:bg-muted/40",
          expanded && "bg-muted/30",
        )}
        onClick={onToggle}
      >
        <td className="pl-3">
          <Chevron className="h-4 w-4 text-muted-foreground" />
        </td>
        <td className="px-3 py-3">
          {cart.shopper ? (
            <>
              <div className="font-medium">{cart.shopper.name || "—"}</div>
              <div className="text-xs text-muted-foreground">
                {cart.shopper.email}
                {cart.shopper.phone ? ` · ${cart.shopper.phone}` : ""}
              </div>
            </>
          ) : (
            <>
              <div className="font-medium text-muted-foreground">Guest</div>
              {/* Say it plainly: there is no contact detail and no consent
                  record, so no recovery message can ever go to this cart. */}
              <div className="text-xs text-muted-foreground">Not reachable</div>
            </>
          )}
        </td>
        <td className="px-3 py-3 tabular-nums">{cart.itemCount}</td>
        <td className="px-3 py-3 font-medium tabular-nums">
          {formatMoney(cart.subtotal, cart.currency ?? currency)}
        </td>
        <td className="px-3 py-3">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
            {STEP_LABEL[cart.furthestStep] ?? cart.furthestStep}
          </span>
        </td>
        <td className="px-3 py-3 text-xs text-muted-foreground">
          {timeAgo(cart.lastActivityAt)}
        </td>
      </tr>

      {expanded ? (
        <tr className="border-b bg-muted/20">
          <td />
          <td colSpan={5} className="px-3 py-3">
            <ul className="space-y-1.5">
              {cart.items.map((item, i) => (
                <li
                  key={`${item.productId}-${item.variantId ?? ""}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-xs"
                >
                  <span>
                    {item.productName}
                    {item.variantLabel ? (
                      <span className="text-muted-foreground"> · {item.variantLabel}</span>
                    ) : null}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(item.subtotal, cart.currency ?? currency)}
                  </span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Coarse relative time — the merchant needs "how cold is this", not a timestamp. */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
