"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { useOnlineCustomers, type OnlineCustomer } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Skeleton } from "@/ui/components/skeleton";

const PAGE_SIZES = [20, 50, 100];

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};

export default function EcommerceCustomersPage() {
  const router = useRouter();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Debounce the search box; a new search resets paging.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useOnlineCustomers({
    search: search || undefined,
    page,
    limit,
  });
  const customers = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shoppers who created an account on your storefront.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          All Customers{" "}
          <span className="font-normal text-muted-foreground">
            ({pagination?.total ?? 0})
          </span>
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, phone, email"
            className="h-9 w-64 pl-8"
          />
        </div>
      </div>

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
                  <CustomerRow
                    key={c._id}
                    customer={c}
                    currency={currency}
                    fmtDate={fmtDate}
                    onOpen={() =>
                      router.push(`/ecommerce/customers/${c._id}`)
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {isFetching && <span className="text-xs">Updating…</span>}
        </div>
        <div className="flex items-center gap-2">
          <span>
            Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={(pagination?.page ?? 1) <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={(pagination?.page ?? 1) >= (pagination?.totalPages ?? 1)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomerRow({
  customer: c,
  currency,
  fmtDate,
  onOpen,
}: {
  customer: OnlineCustomer;
  currency?: string;
  fmtDate: (iso: string | null) => string;
  onOpen: () => void;
}) {
  return (
    <tr
      onClick={onOpen}
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
  );
}
