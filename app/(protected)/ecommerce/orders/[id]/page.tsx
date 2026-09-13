"use client";
// coding-standard: maintained

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, RotateCcw, Store } from "lucide-react";
import { useStorefrontOrder, type AdminStorefrontOrder } from "@/services/api";
import { useGetMetaSettings } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { OrderInvoicePrintButton } from "@/components/ecommerce/order-invoice-print";
import {
  DELIVERY_STEPS,
  PICKUP_STEPS,
  cap,
  longDate,
} from "@/components/ecommerce/orders/order-detail-helpers";
import { ORDER_STATUS_BADGE } from "@/lib/order-status";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { useStockTracked } from "@/hooks/use-stock-tracked";
import { OrderActionBar } from "@/components/ecommerce/orders/order-action-bar";
import { OrderActivityLog } from "@/components/ecommerce/orders/order-activity-log";
import { OrderFraudPanel } from "@/components/ecommerce/orders/order-fraud-panel";
import { OrderFulfillmentPanel } from "@/components/ecommerce/orders/order-fulfillment-panel";
import { OrderLineItems } from "@/components/ecommerce/orders/order-line-items";
import { OrderMetaPanel } from "@/components/ecommerce/orders/order-meta-panel";
import { OrderPaymentPanel } from "@/components/ecommerce/orders/order-payment-panel";
import { OrderStepper } from "@/components/ecommerce/orders/order-stepper";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { StatusBadge } from "@/ui/components/status-badge";
import { OrderCollectionSummary } from "@/components/ecommerce/orders/order-collection-summary";
import { OrderCourierMoney } from "@/components/ecommerce/orders/order-courier-money";

export default function AdminOrderDetailPage() {
  const id = String(useParams().id);
  const { data: order, isLoading, isError } = useStorefrontOrder(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-2 p-6">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link href="/ecommerce/orders" className="text-sm underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  return <OrderDetail key={order._id} order={order} />;
}

function OrderDetail({ order }: { order: AdminStorefrontOrder }) {
  // Only to decide whether the Meta panel renders at all. Cheap and cached — the settings card
  // on Store Settings shares this query.
  const { data: metaSettings } = useGetMetaSettings();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { labelFor } = useOrderStatusLabels();
  const stockTracked = useStockTracked();

  const isPickup = order.fulfillmentType === "pickup";
  const isTerminalBad =
    order.status === "cancelled" || order.status === "rejected";
  const isReturned = order.status === "returned";
  // Delivered, with part of the parcel refused at the door. Not a terminal state
  // and not off the pipeline: the customer kept the rest and paid for it.
  const isPartiallyReturned = order.status === "partially_returned";
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  // `indexOf` returns -1 for a status that is not a step, which would render every
  // node grey — so a part-returned order sits on the step it actually reached.
  const currentStep = (steps as readonly string[]).indexOf(
    isPartiallyReturned ? "delivered" : order.status,
  );
  // A partial return does not set `returnedAt` — that marks the whole order coming
  // back — so the date comes from the last entry in the return log.
  const lastReturnAt = order.returns?.[order.returns.length - 1]?.at;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const money = (n: number | undefined) => formatMoney(n ?? 0, currency);

  return (
    <div className="space-y-5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-auto gap-1.5 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <Link href="/ecommerce/orders">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-all text-2xl font-bold tracking-tight">
              {order.orderNumber}
            </h1>
            <StatusBadge
              status={ORDER_STATUS_BADGE[order.status] ?? "info"}
              label={labelFor(order.status)}
              size="lg"
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {longDate(order.createdAt)} · {itemCount} item
            {itemCount === 1 ? "" : "s"} · {money(order.totalAmount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderInvoicePrintButton orders={[order]} />
          <OrderActionBar order={order} />
        </div>
      </div>

      {/* Stepper / terminal banner */}
      <Card className="gap-0 p-4 shadow-none sm:p-5">
        {isTerminalBad ? (
          <div className="flex items-center gap-2.5 text-sm font-semibold text-red-700">
            <Ban className="h-5 w-5" />
            This order was {cap(order.status)}. Any reserved stock was released
            back to inventory.
          </div>
        ) : isReturned ? (
          <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold text-gray-700">
            <RotateCcw className="h-5 w-5" />
            This order was returned
            {order.returnedAt ? ` on ${longDate(order.returnedAt)}` : ""}.{" "}
            {stockTracked
              ? "Stock was restocked and the refund processed."
              : "The refund was processed."}
            <Link
              href="/sales/returns"
              className="font-medium text-primary underline"
            >
              View sales returns
            </Link>
          </div>
        ) : (
          <>
            <OrderStepper currentStep={currentStep} steps={steps} />
            {isPartiallyReturned ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>
                  Part of this order came back
                  {lastReturnAt ? ` on ${longDate(lastReturnAt)}` : ""}.{" "}
                  {stockTracked
                    ? "Those items were restocked and the refund settled against the collection."
                    : "The refund was settled against the collection."}
                </span>
                <Link
                  href="/sales/returns"
                  className="font-medium text-primary underline"
                >
                  View sales returns
                </Link>
              </div>
            ) : null}
          </>
        )}
      </Card>

      {/* `min-w-0` on both columns: a grid track's default `min-width:auto` sizes
          it to its content's minimum, so one wide row inside pushes the column —
          and the page — past the viewport instead of being contained. */}
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* LEFT */}
        <div className="min-w-0 space-y-5">
          <OrderLineItems order={order} />
          {/* Directly under the invoice it explains: the totals above are what
              was asked for, this is what actually came back. */}
          <OrderCollectionSummary order={order} />
          {/* The door is where `OrderCollectionSummary` stops; this is the next step of the
              same money — what the carrier charged for the parcel, and whether they have
              handed the COD over yet. */}
          <OrderCourierMoney order={order} />
          <OrderFulfillmentPanel order={order} />

          {/* Activity log */}
          <Card className="gap-0 p-5 shadow-none">
            <h3 className="mb-4 text-sm font-semibold">Activity log</h3>
            <OrderActivityLog order={order} />
          </Card>
        </div>

        {/* RIGHT */}
        <div className="min-w-0 space-y-5">
          {/* Customer & delivery + fraud */}
          <Card className="gap-0 p-5 shadow-none">
            <h3 className="mb-3 text-sm font-semibold">
              {isPickup ? "Customer" : "Customer & delivery"}
            </h3>
            <div className="text-sm font-semibold">
              {order.shippingAddress.name}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {order.shippingAddress.phone}
            </div>
            {isPickup ? (
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  <Store className="h-3 w-3" /> Store pickup
                </span>
              </div>
            ) : (
              <>
                <div className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {order.shippingAddress.address}
                </div>
                {(order.shippingAddress.area || order.shippingAddress.district) && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      {[order.shippingAddress.area, order.shippingAddress.district]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </>
            )}
            {/* What the shopper typed under "Delivery notes" at checkout. Distinct
                from `order.notes` below, which only admin-created orders set, so
                every website order's instruction was invisible here while still
                reaching the courier. Pickup orders keep it too. */}
            {order.shippingAddress.notes && (
              <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                <b className="text-foreground">
                  {isPickup ? "Customer note:" : "Delivery note:"}
                </b>{" "}
                {order.shippingAddress.notes}
              </div>
            )}
            {order.notes && (
              <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                <b className="text-foreground">Note:</b> {order.notes}
              </div>
            )}

            {/* The shopper's answers to this store's own checkout fields. The
                LABEL comes off the order, not from current settings: renaming a
                field must not rewrite what older orders say the shopper answered. */}
            {order.customFields?.length ? (
              <dl className="mt-3 space-y-1.5 rounded-lg bg-muted p-2.5 text-xs">
                {order.customFields.map((field) => (
                  <div key={field.key} className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-foreground">
                      {field.label}:
                    </dt>
                    <dd className="text-muted-foreground">{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-4 border-t pt-4">
              <OrderFraudPanel orderId={order._id} />
            </div>
          </Card>

          <OrderPaymentPanel order={order} />

          {/* Whether this sale reached Meta, and the per-order opt-out. Renders nothing when the
              store has no pixel connected — a panel explaining an unused feature on every order
              page is noise. */}
          <OrderMetaPanel order={order} configured={metaSettings?.capiReady === true} />

          {/* Internal notes lived here until 2026-08-16: a textarea captioned
              "Notes are not yet persisted — coming with the order-notes
              endpoint." A merchant typing a note about a real order and losing
              it is worse than not offering the field, and the caption reads as
              unfinished software on a page they use daily (QA-042). Bring it
              back with the endpoint, not before. */}
        </div>
      </div>
    </div>
  );
}
