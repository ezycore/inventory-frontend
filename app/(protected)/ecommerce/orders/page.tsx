"use client";

import { useState } from "react";
import Link from "next/link";
import { useStorefrontOrders } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Badge } from "@/ui/components/badge";

const STATUSES = [
  "",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
];

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
  rejected: "bg-red-100 text-red-700",
};

export default function EcommerceOrdersPage() {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStorefrontOrders({
    status: status || undefined,
    page,
    limit: 20,
  });

  const orders = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Online Orders</h1>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Payment</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      href={`/ecommerce/orders/${o._id}`}
                      className="font-medium hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">{o.shippingAddress?.name}</td>
                  <td className="p-3 font-medium tabular-nums">
                    {formatMoney(o.totalAmount, currency)}
                  </td>
                  <td className="p-3">
                    <span className="capitalize text-muted-foreground">
                      {o.paymentMethod} · {o.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge
                      className={`capitalize ${statusColor[o.status] ?? "bg-gray-100"}`}
                    >
                      {o.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
