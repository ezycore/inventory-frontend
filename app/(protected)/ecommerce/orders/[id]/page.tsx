"use client";
// coding-standard: maintained

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, RotateCcw, Store } from "lucide-react";
import { useStorefrontOrder, type AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { OrderInvoicePrintButton } from "@/components/ecommerce/order-invoice-print";
import {
  DELIVERY_STEPS,
  ORDER_STATUS_BADGE,
  PICKUP_STEPS,
  cap,
  longDate,
} from "@/components/ecommerce/orders/order-detail-helpers";
import { OrderActionBar } from "@/components/ecommerce/orders/order-action-bar";
import { OrderActivityLog } from "@/components/ecommerce/orders/order-activity-log";
import { OrderFraudPanel } from "@/components/ecommerce/orders/order-fraud-panel";
import { OrderFulfillmentPanel } from "@/components/ecommerce/orders/order-fulfillment-panel";
import { OrderLineItems } from "@/components/ecommerce/orders/order-line-items";
import { OrderPaymentPanel } from "@/components/ecommerce/orders/order-payment-panel";
import { OrderStepper } from "@/components/ecommerce/orders/order-stepper";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Textarea } from "@/ui/components/textarea";
import { Skeleton } from "@/ui/components/skeleton";
import { StatusBadge } from "@/ui/components/status-badge";

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
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const isPickup = order.fulfillmentType === "pickup";
  const isTerminalBad =
    order.status === "cancelled" || order.status === "rejected";
  const isReturned = order.status === "returned";
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentStep = (steps as readonly string[]).indexOf(order.status);
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
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {order.orderNumber}
            </h1>
            <StatusBadge
              status={ORDER_STATUS_BADGE[order.status] ?? "info"}
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
      <Card className="p-5 shadow-none">
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
            {order.returnedAt ? ` on ${longDate(order.returnedAt)}` : ""}. Stock
            was restocked and the refund processed.
            <Link
              href="/sales/returns"
              className="font-medium text-primary underline"
            >
              View sales returns
            </Link>
          </div>
        ) : (
          <OrderStepper currentStep={currentStep} steps={steps} />
        )}
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* LEFT */}
        <div className="space-y-5">
          <OrderLineItems order={order} />
          <OrderFulfillmentPanel order={order} />

          {/* Activity log */}
          <Card className="p-5 shadow-none">
            <h3 className="mb-4 text-sm font-semibold">Activity log</h3>
            <OrderActivityLog order={order} />
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Customer & delivery + fraud */}
          <Card className="p-5 shadow-none">
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
            {order.notes && (
              <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                <b className="text-foreground">Note:</b> {order.notes}
              </div>
            )}

            <div className="mt-4 border-t pt-4">
              <OrderFraudPanel orderId={order._id} />
            </div>
          </Card>

          <OrderPaymentPanel order={order} />

          {/* Internal notes */}
          <Card className="p-5 shadow-none">
            <h3 className="mb-2.5 text-sm font-semibold">
              Internal notes{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (merchant only)
              </span>
            </h3>
            <Textarea
              placeholder="Add a private note…"
              className="min-h-16 resize-y"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Notes are not yet persisted — coming with the order-notes endpoint.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
