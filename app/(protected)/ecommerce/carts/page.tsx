"use client";
// coding-standard: maintained

import { useState } from "react";
import { PackageX, ShoppingCart, TrendingDown, Wallet } from "lucide-react";
import {
  useAbandonedCarts,
  useCartFunnelStats,
  type CartListStatus,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { AbandonedCartTable } from "@/components/ecommerce/carts/abandoned-cart-table";
import { CartFunnel } from "@/components/ecommerce/carts/cart-funnel";
import { ListPagination } from "@/components/ecommerce/list-pagination";
import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { Card } from "@/ui/components/card";
import StatsCard from "@/ui/components/StatsCard";
import { cn } from "@/ui/lib/utils";

/**
 * Abandoned carts — the merchant's view of carts that were built and left
 * (backend `docs/plan/abandoned-cart.md`, Phase 2). Read-only: there is no action
 * on a cart here, because a cart belongs to the shopper. Recovery messaging is
 * Phase 3.
 */
const TABS: { key: CartListStatus; label: string; hint: string }[] = [
  {
    key: "abandoned",
    label: "Abandoned",
    hint: "Carts nobody has touched for a while, and no order followed.",
  },
  {
    key: "live",
    label: "Active now",
    hint: "Carts still being worked on. Give them time before counting them lost.",
  },
  {
    key: "converted",
    label: "Ordered",
    hint: "Carts that became orders.",
  },
  { key: "all", label: "All", hint: "Every cart that ever held an item." },
];

export default function AbandonedCartsPage() {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const [status, setStatus] = useState<CartListStatus>("abandoned");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: stats, isLoading: statsLoading } = useCartFunnelStats();
  const { data, isLoading, isFetching } = useAbandonedCarts({
    status,
    search: search || undefined,
    page,
    limit,
  });

  const carts = data?.items ?? [];
  const pagination = data?.pagination;
  const activeTab = TABS.find((t) => t.key === status) ?? TABS[0];

  const s = stats?.stats;
  const tiles = [
    // Every tile states its period. All four share the one window the funnel uses,
    // so a merchant reading them together is never comparing a rolling figure
    // against an all-time one.
    {
      label: "Abandoned carts",
      value: s?.abandonedCount ?? 0,
      icon: ShoppingCart,
      variant: "warning" as const,
      description: stats
        ? `Idle ${stats.abandonedAfterMinutes}+ min, last ${stats.windowDays} days`
        : undefined,
    },
    {
      label: "Value left behind",
      value: formatMoney(s?.abandonedValue ?? 0, currency),
      icon: Wallet,
      variant: "default" as const,
      description: stats ? `In the last ${stats.windowDays} days` : undefined,
    },
    {
      label: "Cart abandonment",
      // A null rate means there is nothing to divide by yet. Showing 0% would
      // tell a brand-new merchant their funnel is flawless.
      value: s ? formatRate(s.cartAbandonmentRate) : "—",
      icon: TrendingDown,
      variant: "default" as const,
      description: stats ? `Of carts started in ${stats.windowDays} days` : undefined,
    },
    {
      label: "Checkout abandonment",
      value: s ? formatRate(s.checkoutAbandonmentRate) : "—",
      icon: PackageX,
      variant: "default" as const,
      description: stats
        ? `Reached checkout, didn't order · ${stats.windowDays} days`
        : undefined,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abandoned Carts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shoppers who added something to their cart and left without ordering.
        </p>
      </div>

      <StatsCard data={tiles} isLoading={statsLoading} minCardWidth={220} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <CartFunnel data={stats} isLoading={statsLoading} />
        <TopAbandonedProducts
          products={stats?.topAbandonedProducts ?? []}
          currency={currency}
          isLoading={statsLoading}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                status === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ListSearchInput
          placeholder="Search shopper name, email, phone"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">{activeTab.hint}</p>

      <Card className="overflow-hidden p-0 shadow-none">
        <AbandonedCartTable
          carts={carts}
          currency={currency}
          isLoading={isLoading}
          emptyHint={
            search
              ? "No shopper matches that search. Guest carts have no name to match."
              : activeTab.hint
          }
        />
      </Card>

      {pagination && pagination.totalPages > 0 ? (
        <ListPagination
          page={page}
          totalPages={pagination.totalPages}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
          isFetching={isFetching}
        />
      ) : null}
    </div>
  );
}

/** Which products sit in abandoned carts most, by stranded value. */
function TopAbandonedProducts({
  products,
  currency,
  isLoading,
}: {
  products: NonNullable<
    ReturnType<typeof useCartFunnelStats>["data"]
  >["topAbandonedProducts"];
  currency?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">Most-abandoned products</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Ranked by the value sitting in abandoned carts over the same period. One
        product dominating this list usually means a price or stock problem, not a
        checkout problem.
      </p>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing abandoned yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {products.map((p) => (
            <li
              key={p.productId}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate">{p.productName}</span>
              <span className="shrink-0 text-right">
                <span className="font-medium tabular-nums">
                  {formatMoney(p.value, currency)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                  ×{p.quantity}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/** `null` ⇒ no data to divide by — never render that as a perfect 0%. */
const formatRate = (rate: number | null) =>
  rate === null ? "—" : `${Math.round(rate * 100)}%`;
