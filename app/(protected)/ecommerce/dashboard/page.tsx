"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Clock,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useEcommerceDashboard } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { StoreStatusCard } from "@/components/ecommerce/store-status-card";
import { storefrontUrl } from "@/lib/storefront-url";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { StatusBadge, type StatusBadgeProps } from "@/ui/components/status-badge";

const ORDER_STATUS_BADGE: Record<string, StatusBadgeProps["status"]> = {
  pending: "pending",
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  rejected: "rejected",
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });

export default function EcommerceDashboardPage() {
  const { data, isLoading } = useEcommerceDashboard();
  const orgCurrency = useAuthStore((s) => s.user?.organization?.currency);
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const currency = data?.currency ?? orgCurrency;
  const subdomainUrl = slug ? storefrontUrl(slug) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your online store at a glance.
        </p>
      </div>

      {/* Store status banner */}
      {isLoading || !data ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <StoreStatusCard
          published={data.published}
          displayName={data.displayName}
          subdomainUrl={subdomainUrl}
          customDomain={data.customDomain}
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Today's orders"
          value={isLoading ? null : String(data?.stats.todayOrders ?? 0)}
        />
        <StatCard
          icon={<Banknote className="h-4 w-4" />}
          label="Today's revenue"
          value={
            isLoading
              ? null
              : formatMoney(data?.stats.todayRevenue ?? 0, currency)
          }
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Awaiting confirmation"
          value={isLoading ? null : String(data?.stats.pendingCount ?? 0)}
          href="/ecommerce/orders?status=pending"
          highlight={!!data && data.stats.pendingCount > 0}
        />
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Online products live"
          value={isLoading ? null : String(data?.stats.liveProducts ?? 0)}
          href="/ecommerce/catalog"
        />
        {/* Carts built and left. Links to the full funnel, which computes these
            same numbers from the same aggregate — the tile and the page cannot
            disagree. `abandonedRate` is null until there are carts to divide by;
            rendering that as 0% would report a flawless funnel to a new store. */}
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Abandoned carts"
          value={isLoading ? null : String(data?.stats.abandonedCarts ?? 0)}
          href="/ecommerce/carts"
          highlight={!!data && data.stats.abandonedCarts > 0}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Value left in carts"
          value={
            isLoading
              ? null
              : formatMoney(data?.stats.abandonedCartValue ?? 0, currency)
          }
          href="/ecommerce/carts"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Cart abandonment"
          value={
            isLoading
              ? null
              : data?.stats.abandonedRate == null
                ? "—"
                : `${Math.round(data.stats.abandonedRate * 100)}%`
          }
          href="/ecommerce/carts"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Needs attention */}
        <Card className="p-5 shadow-none">
          <h2 className="mb-4 text-sm font-semibold">Needs attention</h2>
          {isLoading || !data ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-4">
              <Link
                href="/ecommerce/orders?status=pending"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-yellow-50 text-yellow-700">
                  <Clock className="h-4 w-4" />
                </span>
                <div className="flex-1 text-sm">
                  <div className="font-medium">
                    {data.stats.pendingCount} order
                    {data.stats.pendingCount === 1 ? "" : "s"} awaiting
                    confirmation
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confirm to commit stock and start fulfillment.
                  </div>
                </div>
              </Link>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" /> Low-stock online
                  products
                </div>
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No low-stock listed products.
                  </p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {data.lowStockProducts.map((p) => (
                      <li
                        key={p._id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span className="truncate pr-2">{p.name}</span>
                        <span
                          className={cn(
                            "flex-none rounded-full border px-2 py-0.5 text-xs font-semibold",
                            p.availableQuantity === 0
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-yellow-200 bg-yellow-50 text-yellow-800",
                          )}
                        >
                          {p.availableQuantity} left
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Recent orders */}
        <Card className="p-5 shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link
              href="/ecommerce/orders"
              className="text-xs font-semibold text-primary"
            >
              View all
            </Link>
          </div>
          {isLoading || !data ? (
            <Skeleton className="h-48 w-full" />
          ) : data.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y">
              {data.recentOrders.map((o) => (
                <li key={o._id}>
                  <Link
                    href={`/ecommerce/orders/${o._id}`}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{o.orderNumber}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {o.shippingAddress?.name} · {shortDate(o.createdAt)}
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold tabular-nums">
                      {formatMoney(o.totalAmount, currency)}
                    </div>
                    <StatusBadge
                      status={ORDER_STATUS_BADGE[o.status] ?? "info"}
                      size="sm"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <Card
      className={cn(
        "p-4 shadow-none transition-colors",
        href && "hover:border-primary/40 hover:bg-muted/30",
        highlight && "border-yellow-300",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        {label}
      </div>
      {value === null ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      )}
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
