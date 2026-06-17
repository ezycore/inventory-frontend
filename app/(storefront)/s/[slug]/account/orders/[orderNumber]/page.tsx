"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useShopperOrder, useStore } from "@/services/storefront/hooks";
import { formatMoney } from "@/components/storefront/format";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bank: "Bank / Manual transfer",
  manual: "Manual",
};

export default function OrderDetailPage() {
  const params = useParams();
  const slug = String(params.slug);
  const orderNumber = String(params.orderNumber);

  const shopper = useShopperStore((s) => s.shopper);
  const { data: store } = useStore(slug);
  const { data: order, isLoading, isError } = useShopperOrder(slug, orderNumber);

  if (!shopper) {
    return (
      <div className="mx-auto max-w-md space-y-3 text-center">
        <p className="text-sm text-gray-500">Sign in to view this order.</p>
        <Link
          href={`/s/${slug}/account`}
          className="inline-block rounded-md bg-[var(--sf-brand,#111827)] px-4 py-2 text-sm text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (isError || !order) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Order not found.</p>
        <Link href={`/s/${slug}/account/orders`} className="text-sm underline">
          ← My orders
        </Link>
      </div>
    );
  }

  const currency = store?.currency;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
          <p className="text-xs text-gray-500">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Link href={`/s/${slug}/account/orders`} className="text-sm underline">
          ← My orders
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2 py-1 capitalize">
          Status: {order.status}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-1">
          Payment: {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} ·{" "}
          <span className="capitalize">{order.paymentStatus}</span>
        </span>
      </div>

      {/* Items */}
      <div className="divide-y rounded-lg border bg-white">
        {order.items.map((i, idx) => (
          <div key={idx} className="flex justify-between p-3 text-sm">
            <span className="pr-2">
              {i.productName} × {i.quantity}
            </span>
            <span>{formatMoney(i.subtotal, currency)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 rounded-lg border bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatMoney(order.subtotal, currency)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Discount</span>
            <span>-{formatMoney(order.discountAmount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Shipping</span>
          <span>
            {order.shippingCharged === 0
              ? "Free"
              : formatMoney(order.shippingCharged, currency)}
          </span>
        </div>
        <div className="mt-1 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.totalAmount, currency)}</span>
        </div>
      </div>

      {/* Tracking */}
      {order.courier?.trackingCode && (
        <div className="rounded-lg border bg-white p-4 text-sm">
          <h2 className="mb-1 font-medium">Tracking</h2>
          <p className="capitalize text-gray-600">
            Courier: {order.courier.provider}
          </p>
          <p className="text-gray-600">Tracking #: {order.courier.trackingCode}</p>
          {order.courier.status && (
            <p className="text-gray-600">Status: {order.courier.status}</p>
          )}
        </div>
      )}

      {/* Delivery address */}
      <div className="rounded-lg border bg-white p-4 text-sm">
        <h2 className="mb-1 font-medium">Delivery address</h2>
        <p>{order.shippingAddress.name}</p>
        <p className="text-gray-600">{order.shippingAddress.phone}</p>
        <p className="text-gray-600">{order.shippingAddress.address}</p>
        {order.shippingAddress.city && (
          <p className="text-gray-600">{order.shippingAddress.city}</p>
        )}
      </div>
    </div>
  );
}
