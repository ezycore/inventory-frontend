"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  Lock,
  Printer,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  useCancelOrder,
  useConfirmOrder,
  useCouriers,
  useCreateConsignment,
  useMarkOrderPaid,
  useOrderFraudScore,
  useRefreshTracking,
  useStorefrontOrder,
  useUpdateCourierCost,
  useUpdateOrderStatus,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { Skeleton } from "@/ui/components/skeleton";
import { SimpleSelect } from "@/ui/components/simple-select";
import { StatusBadge, type StatusBadgeProps } from "@/ui/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/components/alert-dialog";

/** The forward order pipeline (terminal Cancelled/Rejected sit outside it). */
const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const ORDER_STATUS_BADGE: Record<string, StatusBadgeProps["status"]> = {
  pending: "pending",
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  rejected: "rejected",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const longDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const actorLabel = (by?: string) =>
  by === "shopper" ? "Customer" : by === "system" ? "System" : by ? "Staff" : "—";

export default function AdminOrderDetailPage() {
  const id = String(useParams().id);
  const { data: order, isLoading, isError } = useStorefrontOrder(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
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
  const accountsEnabled = useAuthStore(
    (s) => s.user?.organization?.features?.accounts,
  );

  const confirm = useConfirmOrder();
  const updateStatus = useUpdateOrderStatus();
  const cancel = useCancelOrder();
  const updateCourierCost = useUpdateCourierCost();
  const markPaid = useMarkOrderPaid();
  const createConsignment = useCreateConsignment();
  const refreshTracking = useRefreshTracking();
  const fraud = useOrderFraudScore();
  const { data: couriersData } = useCouriers();

  const [courierCost, setCourierCost] = useState(String(order.shippingCost ?? 0));
  const [editingShipping, setEditingShipping] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [provider, setProvider] = useState("");

  const enabledCouriers = (couriersData?.couriers ?? []).filter((c) => c.enabled);

  const { data: accountsRes } = useQuery({
    queryKey: ["accounts", "order-options"],
    queryFn: () =>
      apiClient.get<{ data: { items: { _id: string; name: string }[] } }>(
        "/accounts?all=true&fields=_id,name",
      ),
    enabled: !!accountsEnabled,
    staleTime: 5 * 60 * 1000,
  });
  const accounts = accountsRes?.data?.items ?? [];

  const isPaid = order.paymentStatus === "paid";
  const isConfirmed = !!order.saleId || order.status !== "pending";
  const isTerminalBad =
    order.status === "cancelled" || order.status === "rejected";
  const canCancel = ["pending", "confirmed", "processing"].includes(order.status);
  const hasTracking = !!order.courier?.consignmentId;
  const canShip = order.status === "processing" && !hasTracking;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const money = (n: number | undefined) => formatMoney(n ?? 0, currency);

  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  const saveShipping = () => {
    updateCourierCost.mutate(
      { id: order._id, shippingCost: Number(courierCost) || 0 },
      { onSuccess: () => setEditingShipping(false) },
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 pb-16">
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
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print invoice
          </Button>

          {order.status === "pending" && (
            <>
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm">
                    Reject
                  </Button>
                }
                title="Reject this order?"
                description="The shopper is notified the order was rejected. No stock is committed. This cannot be undone."
                actionLabel="Reject order"
                destructive
                onConfirm={() =>
                  cancel.mutate({ id: order._id, reject: true })
                }
              />
              <ConfirmDialog
                trigger={<Button size="sm">Confirm order</Button>}
                title="Confirm this order?"
                description={`This creates the sale and commits stock for ${itemCount} item${
                  itemCount === 1 ? "" : "s"
                } from the fulfillment location. It can only be reversed by cancelling (which restocks).`}
                actionLabel="Confirm & commit stock"
                onConfirm={() => confirm.mutate(order._id)}
              />
            </>
          )}

          {canCancel && order.status !== "pending" && (
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm">
                  Cancel order
                </Button>
              }
              title="Cancel this order?"
              description="Committed stock is released back to inventory. This cannot be undone."
              actionLabel="Cancel & restock"
              destructive
              onConfirm={() => cancel.mutate({ id: order._id, reject: false })}
            />
          )}
          {order.status === "confirmed" && (
            <Button
              size="sm"
              onClick={() =>
                updateStatus.mutate({ id: order._id, status: "processing" })
              }
            >
              Mark processing
            </Button>
          )}
          {order.status === "shipped" && (
            <Button
              size="sm"
              onClick={() =>
                updateStatus.mutate({ id: order._id, status: "delivered" })
              }
            >
              Mark delivered
            </Button>
          )}
          {order.status === "delivered" && !isPaid && (
            <Button
              size="sm"
              disabled={markPaid.isPending}
              onClick={() =>
                markPaid.mutate({ id: order._id, accountId: accountId || undefined })
              }
            >
              Mark COD collected
            </Button>
          )}
        </div>
      </div>

      {/* Stepper / terminal banner */}
      <Card className="p-5 shadow-none">
        {isTerminalBad ? (
          <div className="flex items-center gap-2.5 text-sm font-semibold text-red-700">
            <Ban className="h-5 w-5" />
            This order was {cap(order.status)}.
            {order.saleId
              ? " Committed stock was released back to inventory."
              : " No stock was committed."}
          </div>
        ) : (
          <Stepper currentStep={currentStep} />
        )}
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Line items + breakdown */}
          <Card className="overflow-hidden shadow-none">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <h3 className="text-sm font-semibold">Line items</h3>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> snapshotted at purchase
              </span>
            </div>
            {order.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 border-b px-5 py-3"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                  {it.productName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {it.productName}
                  </div>
                </div>
                <div className="w-32 text-right text-xs tabular-nums text-muted-foreground">
                  {money(it.price)} × {it.quantity}
                </div>
                <div className="w-24 text-right text-sm font-semibold tabular-nums">
                  {money(it.subtotal)}
                </div>
              </div>
            ))}

            <div className="space-y-2 px-5 py-4 text-sm">
              <BreakdownRow label="Subtotal" value={money(order.subtotal)} />
              {order.discountAmount > 0 && (
                <BreakdownRow
                  label={
                    order.couponCode
                      ? `Discount · ${order.couponCode}`
                      : "Discount"
                  }
                  value={`−${money(order.discountAmount)}`}
                  positive
                />
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping fee</span>
                {editingShipping ? (
                  <span className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={courierCost}
                      onChange={(e) => setCourierCost(e.target.value)}
                      className="h-7 w-24 text-right"
                    />
                    <Button
                      size="sm"
                      className="h-7"
                      disabled={updateCourierCost.isPending}
                      onClick={saveShipping}
                    >
                      Save
                    </Button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums text-foreground">
                      {money(order.shippingCharged)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingShipping(true)}
                      className="text-xs font-semibold text-primary"
                    >
                      Edit
                    </button>
                  </span>
                )}
              </div>
              <div className="flex justify-between border-t pt-2.5 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{money(order.totalAmount)}</span>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Courier cost (your expense): {money(order.shippingCost)} ·
                shipping margin{" "}
                {money(order.shippingCharged - order.shippingCost)}
              </p>
            </div>
          </Card>

          {/* Fulfillment */}
          <Card className="space-y-3 p-5 shadow-none">
            <h3 className="text-sm font-semibold">Fulfillment</h3>
            {hasTracking ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border bg-card">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold capitalize">
                    {order.courier?.provider} · consignment created
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tracking{" "}
                    <span className="font-semibold text-foreground">
                      {order.courier?.trackingCode ||
                        order.courier?.consignmentId}
                    </span>
                    {order.courier?.status ? ` · ${order.courier.status}` : ""}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refreshTracking.isPending}
                  onClick={() => refreshTracking.mutate(order._id)}
                >
                  Refresh
                </Button>
              </div>
            ) : canShip ? (
              enabledCouriers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No courier enabled. Add one in{" "}
                  <Link
                    href="/ecommerce/settings"
                    className="font-medium text-primary underline"
                  >
                    Store Settings → Couriers
                  </Link>
                  .
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <SimpleSelect
                        value={provider}
                        onValueChange={setProvider}
                        options={enabledCouriers.map((c) => ({
                          label: `${cap(c.provider)} Courier`,
                          value: c.provider,
                        }))}
                        placeholder="Select courier"
                      />
                    </div>
                    <Button
                      disabled={!provider || createConsignment.isPending}
                      onClick={() =>
                        createConsignment.mutate({ id: order._id, provider })
                      }
                    >
                      Create consignment
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Creates a consignment with the courier and returns a tracking
                    ID.
                  </p>
                </>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Available once the order reaches <b>Processing</b>.
              </p>
            )}
          </Card>

          {/* Activity log */}
          <Card className="p-5 shadow-none">
            <h3 className="mb-4 text-sm font-semibold">Activity log</h3>
            <ActivityLog order={order} />
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Customer & delivery + fraud */}
          <Card className="p-5 shadow-none">
            <h3 className="mb-3 text-sm font-semibold">Customer &amp; delivery</h3>
            <div className="text-sm font-semibold">
              {order.shippingAddress.name}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {order.shippingAddress.phone}
            </div>
            <div className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {order.shippingAddress.address}
            </div>
            {(order.shippingAddress.area || order.shippingAddress.city) && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {[order.shippingAddress.area, order.shippingAddress.city]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {order.notes && (
              <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                <b className="text-foreground">Note:</b> {order.notes}
              </div>
            )}

            <div className="mt-4 border-t pt-4">
              <FraudPanel
                idle={!fraud.data && !fraud.isPending}
                loading={fraud.isPending}
                result={fraud.data?.data}
                onRun={() => fraud.mutate(order._id)}
              />
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-5 shadow-none">
            <h3 className="mb-3 text-sm font-semibold">Payment</h3>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="font-semibold uppercase">
                {order.paymentMethod}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <PaymentBadge status={order.paymentStatus} />
            </div>
            {isConfirmed && !isPaid && (
              <div className="mt-4 space-y-2 border-t pt-4">
                {accountsEnabled && accounts.length > 0 && (
                  <SimpleSelect
                    value={accountId}
                    onValueChange={setAccountId}
                    options={accounts.map((a) => ({
                      label: a.name,
                      value: a._id,
                    }))}
                    placeholder="Receiving account (default)"
                  />
                )}
                <Button
                  className="w-full"
                  disabled={markPaid.isPending}
                  onClick={() =>
                    markPaid.mutate({
                      id: order._id,
                      accountId: accountId || undefined,
                    })
                  }
                >
                  {order.paymentMethod === "cod"
                    ? "Mark COD collected"
                    : "Mark as paid"}
                </Button>
              </div>
            )}
          </Card>

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

/* ----------------------------- sub-components ----------------------------- */

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const current = i === currentStep;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-primary text-primary-foreground",
                  !done && !current && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1",
                  i < currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between",
        positive ? "text-green-700" : "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className={cn("tabular-nums", !positive && "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    paid: { cls: "border-green-200 bg-green-50 text-green-800", label: "Paid" },
    pending: {
      cls: "border-yellow-200 bg-yellow-50 text-yellow-800",
      label: "Pending",
    },
    refunded: {
      cls: "border-gray-200 bg-gray-50 text-gray-600",
      label: "Refunded",
    },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}

function ActivityLog({ order }: { order: AdminStorefrontOrder }) {
  const events = [
    ...(order.statusHistory ?? []).map((e) => ({
      text: `Order ${cap(e.status)}`,
      at: e.at,
      by: e.by,
    })),
    { text: "Order placed", at: order.createdAt, by: "shopper" },
  ]
    .slice()
    .reverse();

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-none flex-col items-center">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
            {i < events.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-4">
            <div className="text-sm font-medium">{ev.text}</div>
            <div className="text-xs text-muted-foreground">
              {longDate(String(ev.at))} · {actorLabel(ev.by)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FraudPanel({
  idle,
  loading,
  result,
  onRun,
}: {
  idle: boolean;
  loading: boolean;
  result?: import("@/services/api").OrderFraudScore;
  onRun: () => void;
}) {
  if (loading) {
    return (
      <div className="flex h-9 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking delivery history…
      </div>
    );
  }

  if (idle || !result) {
    return (
      <Button variant="outline" className="w-full" onClick={onRun}>
        <ShieldCheck className="mr-2 h-4 w-4" /> Courier fraud-score check
      </Button>
    );
  }

  const riskMap = {
    low: { cls: "border-green-200 bg-green-50 text-green-800", label: "Low risk" },
    medium: {
      cls: "border-yellow-200 bg-yellow-50 text-yellow-800",
      label: "Medium risk",
    },
    high: { cls: "border-red-200 bg-red-50 text-red-800", label: "High risk" },
  } as const;
  const m = riskMap[result.risk];

  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          Delivery risk
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            m.cls,
          )}
        >
          {m.label}
        </span>
      </div>
      {result.available ? (
        <div className="flex gap-5 text-sm">
          <Stat value={result.deliveredParcels} label="delivered" tone="text-green-700" />
          <Stat value={result.cancelledParcels} label="cancelled" tone="text-red-700" />
          <Stat value={result.totalParcels} label="total parcels" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No prior orders from this number — treat as a new customer.
        </p>
      )}
      <p className="mt-2.5 text-[11px] text-muted-foreground">
        Based on this store&apos;s COD history for the customer&apos;s phone.
      </p>
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: string;
}) {
  return (
    <div>
      <div className={cn("text-base font-bold", tone)}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ConfirmDialog({
  trigger,
  title,
  description,
  actionLabel,
  onConfirm,
  destructive,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              destructive &&
                "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
            )}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
