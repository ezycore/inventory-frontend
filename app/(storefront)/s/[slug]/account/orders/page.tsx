"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useShopperOrders, useStore } from "@/services/storefront/hooks";
import { formatMoney } from "@/components/storefront/format";

export default function OrdersPage() {
  const slug = String(useParams().slug);
  const shopper = useShopperStore((s) => s.shopper);
  const { data: store } = useStore(slug);
  const { data: orders, isLoading } = useShopperOrders(slug);

  if (!shopper) {
    return (
      <div className="mx-auto max-w-md space-y-3 text-center">
        <p className="text-sm text-gray-500">Sign in to view your orders.</p>
        <Link
          href={`/s/${slug}/account`}
          className="inline-block rounded-md bg-[var(--sf-brand,#111827)] px-4 py-2 text-sm text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My orders</h1>
        <Link href={`/s/${slug}/account`} className="text-sm underline">
          ← Account
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="divide-y rounded-lg border bg-white">
          {orders.map((o) => (
            <Link
              key={o._id}
              href={`/s/${slug}/account/orders/${o.orderNumber}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium">{o.orderNumber}</p>
                <p className="text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString()} · {o.items.length}{" "}
                  item(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatMoney(o.totalAmount, store?.currency)}
                </p>
                <span className="text-xs capitalize text-gray-500">
                  {o.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
