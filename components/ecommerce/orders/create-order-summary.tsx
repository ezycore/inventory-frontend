"use client";
// coding-standard: maintained
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { OrderQuote } from "@/services/api/modules/storefront-orders/api";

/**
 * The numbers the merchant reads out in chat, plus the lines that cannot be
 * ordered.
 *
 * **Every figure here is server-quoted** (`POST /ecommerce/orders/quote`) and none
 * is computed in this file — see `useCreateOrderForm`. If you ever find yourself
 * adding arithmetic to this component, the number you want belongs on the quote.
 */

/** One label/value pair in the summary. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function CreateOrderSummary({
  quote,
  quoting,
  rejected,
  currency,
}: {
  quote: OrderQuote | undefined;
  quoting: boolean;
  rejected: OrderQuote["rejected"];
  currency?: string;
}) {
  return (
    <>
      {/* Every line the order path would refuse, named. Submit stays disabled
          while any remain — the alternative is a 400 that discards the whole
          typed order for one bad row. */}
      {rejected.length > 0 ? (
        <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">
              {rejected.length === 1
                ? "One product can't be ordered online"
                : `${rejected.length} products can't be ordered online`}
            </p>
            <p className="text-xs text-muted-foreground">
              Remove them, or list them on your store first. Everything else is
              priced below.
            </p>
          </div>
        </div>
      ) : null}

      {quote ? (
        <div className="space-y-1.5 border-t pt-3 text-sm">
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(quote.subtotal, currency)}
          />
          {quote.couponDiscount > 0 ? (
            <SummaryRow
              label={`Coupon${quote.couponCode ? ` · ${quote.couponCode}` : ""}`}
              value={`− ${formatCurrency(quote.couponDiscount, currency)}`}
            />
          ) : null}
          {quote.manualDiscount > 0 ? (
            <SummaryRow
              label="Discount"
              value={`− ${formatCurrency(quote.manualDiscount, currency)}`}
            />
          ) : null}
          {quote.fulfillmentType === "delivery" ? (
            <SummaryRow
              label="Delivery"
              value={formatCurrency(quote.shippingCharged, currency)}
            />
          ) : null}
          <div className="flex justify-between border-t pt-1.5 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(quote.totalAmount, currency)}</span>
          </div>
          {/* The previous total stays on screen while the next loads, so say when
              it is not settled yet rather than letting it read as final. */}
          {quoting ? (
            <p className="text-xs text-muted-foreground">Updating…</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
