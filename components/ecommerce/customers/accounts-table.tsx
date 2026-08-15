"use client";
// coding-standard: maintained

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { OnlineCustomer } from "@/services/api";
import { formatMoney } from "@/components/storefront/format";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";

/** Shoppers who created an account on the storefront, with their order stats. */
export function AccountsTable({
  customers,
  currency,
  isLoading,
}: {
  customers: OnlineCustomer[];
  currency?: string;
  isLoading?: boolean;
}) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden p-0 shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <th className="px-4 py-3">Customer</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Orders</th>
              <th className="px-3 py-3">Total spent</th>
              <th className="px-3 py-3">Last order</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="text-sm font-semibold">No customers yet</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Shoppers appear here once they register on your store.
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr
                  key={c._id}
                  onClick={() => router.push(`/customers/online/${c._id}`)}
                  className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="px-3 py-3 tabular-nums">{c.orders}</td>
                  <td className="px-3 py-3 font-semibold tabular-nums">
                    {formatMoney(c.totalSpent, currency)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {fmtDate(c.lastOrderAt)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Day-first, the way a BD merchant reads a date. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}
