"use client";
// coding-standard: maintained

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Card } from "@/ui/components/card";
import { longDate } from "./order-detail-helpers";

/**
 * What the courier actually handed over, as recorded at the door.
 *
 * The individual effects are all booked correctly elsewhere — a Sales Return, a
 * post-sale discount on the Sale, a Payment — but they live in three different
 * documents, and the order page could only ever show its own invoice totals. So
 * a merchant reopening a settled order saw ৳3,450 marked **Paid** and nothing at
 * all about the ৳1,800 that came back, the ৳50 conceded, or the ৳1,450 the rider
 * actually handed over. This card is that missing account.
 *
 * Renders nothing when no collection was recorded through the dialog — an
 * ordinary "Mark COD collected" order has no gap to explain.
 */
export function OrderCollectionSummary({
  order,
}: {
  order: AdminStorefrontOrder;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const collections = order.collections ?? [];
  if (collections.length === 0) return null;

  const money = (n: number) => formatMoney(n, currency);
  // Off the order's own snapshotted lines, which is what the rest of the page
  // shows — a product renamed since is still the product that came back.
  const nameOf = (productId: string) =>
    (order.items ?? []).find((item) => String(item.productId) === String(productId))
      ?.productName ?? "Item";

  return (
    <Card className="gap-0 p-5 shadow-none">
      <h3 className="mb-1 text-sm font-semibold">Collection</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        What the courier handed over, and what accounts for the rest.
      </p>

      <div className="space-y-5">
        {collections.map((entry, index) => {
          const returned = entry.returnedValue ?? 0;
          const discount = entry.discount ?? 0;
          const owed = entry.stillOwed ?? 0;
          return (
            <div
              key={entry.at ?? index}
              className="space-y-1.5 text-sm [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-5"
            >
              <Row
                label="Expected at the door"
                value={money(entry.expected)}
                muted
              />
              {returned > 0 && (
                <>
                  <Row
                    label="Goods returned"
                    value={`−${money(returned)}`}
                    muted
                  />
                  {/* Naming them is the point: "৳1,800 came back" and "the Cotton
                      Kurta came back" answer different questions, and only the
                      second one tells the merchant what is on the shelf. */}
                  {(entry.returnedLines ?? []).length > 0 && (
                    <ul className="ml-3 space-y-0.5 text-xs text-muted-foreground">
                      {(entry.returnedLines ?? []).map((line) => (
                        <li key={`${line.productId}-${line.variantId ?? ""}`}>
                          {nameOf(line.productId)} × {line.quantity}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {discount > 0 && (
                <Row
                  label="Discount given"
                  value={`−${money(discount)}`}
                  muted
                />
              )}
              {owed > 0 && (
                <Row label="Left owing" value={`−${money(owed)}`} muted />
              )}
              <div className="flex items-center justify-between border-t pt-1.5 font-semibold">
                <span>Collected</span>
                <span className="tabular-nums">{money(entry.collected)}</span>
              </div>
              {entry.at ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  Recorded {longDate(entry.at)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* The reason is the whole value of a concession — an unexplained margin
          hole six months later is worse than no record at all, which is why the
          dialog refuses to submit without it. */}
      {order.collectionDiscountNote ? (
        <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Why the discount: </span>
          {order.collectionDiscountNote}
        </p>
      ) : null}

      {(order.returns ?? []).length > 0 ? (
        <Link
          href="/sales/returns"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          View the sales return
        </Link>
      ) : null}
    </Card>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : undefined}>
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
