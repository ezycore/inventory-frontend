"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useOnlineCustomer, useOnlineCustomerOrders } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { TablePager } from "@/components/shared/table-pager";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { StatusBadge } from "@/ui/components/status-badge";
import { ORDER_STATUS_BADGE } from "@/lib/order-status";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};

export default function CustomerDetailPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { labelFor } = useOrderStatusLabels();
  const { data, isLoading, isError } = useOnlineCustomer(id);
  const [ordersPage, setOrdersPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useOnlineCustomerOrders(
    id,
    ordersPage,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-2 p-6">
        <p className="text-sm text-muted-foreground">Customer not found.</p>
        <Link href="/customers" className="text-sm underline">
          ← Back to customers
        </Link>
      </div>
    );
  }

  const { customer, stats } = data;
  const orders = ordersData?.items ?? [];
  const pagination = ordersData?.pagination;

  return (
    <div className="space-y-5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-auto gap-1.5 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <Link href="/customers">
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer since {fmtDate(customer.createdAt)}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
        {/* Contact + stats */}
        <div className="min-w-0 space-y-5">
          <Card className="space-y-2.5 p-5 shadow-none">
            <h3 className="text-sm font-semibold">Contact</h3>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="break-all">{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone || "—"}</span>
            </div>
          </Card>

          <Card className="grid grid-cols-2 gap-4 p-5 shadow-none">
            <Stat label="Orders" value={String(stats.orders)} />
            <Stat
              label="Total spent"
              value={formatMoney(stats.totalSpent, currency)}
            />
            <Stat label="Last order" value={fmtDate(stats.lastOrderAt)} />
          </Card>
        </div>

        {/* Order history */}
        <Card className="overflow-hidden p-0 shadow-none">
          <div className="border-b px-5 py-3.5">
            <h3 className="text-sm font-semibold">Order history</h3>
          </div>
          {ordersLoading && orders.length === 0 ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <>
              {/* Scrolls rather than squeezes: the four columns need ~30rem,
                  and inside the card's `overflow-hidden` the surplus was being
                  clipped — no scrollbar, a wrapped order number, and a status
                  badge cut in half. */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                      <th className="whitespace-nowrap px-4 py-2.5">Order</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Date</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Total</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o._id}
                        onClick={() => router.push(`/ecommerce/orders/${o._id}`)}
                        className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-semibold">
                          {o.orderNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {fmtDate(o.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold tabular-nums">
                          {formatMoney(o.totalAmount, currency)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <StatusBadge
                            status={ORDER_STATUS_BADGE[o.status] ?? "info"}
                            label={labelFor(o.status)}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && (
                <TablePager
                  page={pagination.page}
                  limit={pagination.limit}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  onPageChange={setOrdersPage}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
