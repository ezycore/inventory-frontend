"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  useCancelOrder,
  useConfirmOrder,
  useCouriers,
  useCreateConsignment,
  useMarkOrderPaid,
  useRefreshTracking,
  useStorefrontOrder,
  useUpdateCourierCost,
  useUpdateOrderStatus,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

export default function AdminOrderDetailPage() {
  const id = String(useParams().id);
  const { data: order, isLoading, isError } = useStorefrontOrder(id);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (isError || !order) {
    return (
      <div className="space-y-2 p-6">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link href="/ecommerce/orders" className="text-sm underline">
          ← Orders
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
  const { data: couriersData } = useCouriers();

  const [courierCost, setCourierCost] = useState(String(order.shippingCost ?? 0));
  const [accountId, setAccountId] = useState("");
  const [provider, setProvider] = useState("");
  const enabledCouriers = (couriersData?.couriers ?? []).filter((c) => c.enabled);

  const { data: accountsRes } = useQuery({
    queryKey: ["accounts", "order-options"],
    queryFn: () =>
      apiClient.get<{ data: { _id: string; name: string }[] }>(
        "/accounts?all=true&fields=_id,name",
      ),
    enabled: !!accountsEnabled,
    staleTime: 5 * 60 * 1000,
  });
  const accounts = accountsRes?.data ?? [];

  const isPending = order.status === "pending";
  const isConfirmed = !!order.saleId;
  const isPaid = order.paymentStatus === "paid";
  const shippingMargin = order.shippingCharged - order.shippingCost;

  return (
    <div className="container mx-auto max-w-4xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()} · status{" "}
            <span className="capitalize">{order.status}</span> · payment{" "}
            {order.paymentMethod} / <span className="capitalize">{order.paymentStatus}</span>
          </p>
        </div>
        <Link href="/ecommerce/orders" className="text-sm underline">
          ← Orders
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Items + totals */}
        <div className="space-y-4 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {i.productName} × {i.quantity}
                  </span>
                  <span>{formatMoney(i.subtotal, currency)}</span>
                </div>
              ))}
              <div className="border-t pt-2">
                <Row label="Subtotal" value={formatMoney(order.subtotal, currency)} />
                {order.discountAmount > 0 && (
                  <Row label="Discount" value={`-${formatMoney(order.discountAmount, currency)}`} />
                )}
                <Row label="Shipping charged" value={formatMoney(order.shippingCharged, currency)} />
                <Row label="Courier cost" value={formatMoney(order.shippingCost, currency)} muted />
                <Row
                  label="Shipping margin"
                  value={formatMoney(shippingMargin, currency)}
                  muted
                />
                <div className="mt-1 flex justify-between font-semibold">
                  <span>Total (goods + shipping)</span>
                  <span>{formatMoney(order.totalAmount, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{order.shippingAddress.name}</p>
              <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-muted-foreground">{order.shippingAddress.address}</p>
              {order.shippingAddress.city && (
                <p className="text-muted-foreground">{order.shippingAddress.city}</p>
              )}
              {order.notes && (
                <p className="mt-2 text-muted-foreground">Notes: {order.notes}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  disabled={confirm.isPending}
                  onClick={() => confirm.mutate(order._id)}
                >
                  Confirm order
                </Button>
                <p className="text-xs text-muted-foreground">
                  Confirming creates the sale and deducts stock.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => cancel.mutate({ id: order._id, reject: false })}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => cancel.mutate({ id: order._id, reject: true })}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {isConfirmed && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Fulfillment</p>
                <div className="flex flex-wrap gap-2">
                  {(["processing", "shipped", "delivered"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={order.status === s ? "default" : "outline"}
                      onClick={() => updateStatus.mutate({ id: order._id, status: s })}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {isConfirmed && !isPaid && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Courier cost</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={courierCost}
                    onChange={(e) => setCourierCost(e.target.value)}
                    className="w-full rounded-md border px-2 py-1 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateCourierCost.mutate({
                        id: order._id,
                        shippingCost: Number(courierCost) || 0,
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {isConfirmed && !isPaid && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Payment</p>
                {accountsEnabled && (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="">Receiving account (default)</option>
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
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
                  Mark as paid
                </Button>
              </div>
            )}

            {isConfirmed && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Courier</p>
                {order.courier?.consignmentId ? (
                  <div className="space-y-1 text-sm">
                    <p className="capitalize">Provider: {order.courier.provider}</p>
                    <p>
                      Tracking:{" "}
                      {order.courier.trackingCode || order.courier.consignmentId}
                    </p>
                    <p className="text-muted-foreground">
                      Status: {order.courier.status || "—"}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={refreshTracking.isPending}
                      onClick={() => refreshTracking.mutate(order._id)}
                    >
                      Refresh tracking
                    </Button>
                  </div>
                ) : enabledCouriers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No courier enabled. Add one in Store Settings → Couriers.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full rounded-md border px-2 py-1 text-sm capitalize"
                    >
                      <option value="">Select courier</option>
                      {enabledCouriers.map((c) => (
                        <option key={c.provider} value={c.provider}>
                          {c.provider}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!provider || createConsignment.isPending}
                      onClick={() =>
                        createConsignment.mutate({ id: order._id, provider })
                      }
                    >
                      Send
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isPaid && (
              <p className="text-sm text-green-600">Payment recorded ✓</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
    <div className="flex justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={muted ? "text-muted-foreground" : ""}>{value}</span>
    </div>
  );
}
