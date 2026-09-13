"use client";
// coding-standard: maintained

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Package, ShoppingCart, TrendingDown, Wallet } from "lucide-react";
import { useEcommerceDashboard } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { StoreLookCard } from "@/components/ecommerce/store-look-card";
import { StoreStatusCard } from "@/components/ecommerce/store-status-card";
import { storefrontUrl } from "@/lib/storefront-url";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";

/**
 * Store operations — the things about the SHOP rather than about the trade.
 *
 * Everything that answers "how is business" moved to `/dashboard`, which composes
 * itself from the org's capabilities and now leads with orders for a merchant who
 * sells online (see `inventory-backend/docs/plan/dashboard-composition.md`).
 * Today's orders, today's revenue, what came back, the queue, the channel mix,
 * low stock and the recent-order list all live there, on one clock and beside the
 * counter figures they have to be read against.
 *
 * What stays here is what has no home-screen equivalent: whether the shop is
 * open and reachable, whether it still looks like every other EzyCore shop, how
 * much of the catalogue is actually listed, and the cart funnel. The main
 * dashboard carries a four-line summary of this and links back.
 *
 * **No period filter, deliberately.** Nothing left on this page is a period
 * figure — published, listed, abandoned-right-now are all current state. Period
 * questions belong to the dashboard's filter, and a second one here would be a
 * second answer to the same question.
 */
export default function EcommerceDashboardPage() {
  const t = useTranslations("dashboard.storeOverview");
  const { data, isLoading } = useEcommerceDashboard();
  const orgCurrency = useAuthStore((s) => s.user?.organization?.currency);
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const currency = data?.currency ?? orgCurrency;
  const subdomainUrl = slug ? storefrontUrl(slug) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
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

      {/* Only while the shop still looks like every other EzyCore shop; the card
          removes itself once it has a theme, a logo and a palette. */}
      <StoreLookCard />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* The online listing is a tab on Products — this deep-links the tab. */}
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label={t("liveProducts")}
          value={isLoading ? null : String(data?.stats.liveProducts ?? 0)}
          href="/products?tab=online"
        />
        {/* Carts built and left. Links to the full funnel, which computes these
            same numbers from the same aggregate — the tile and the page cannot
            disagree. */}
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label={t("abandonedCarts")}
          value={isLoading ? null : String(data?.stats.abandonedCarts ?? 0)}
          href="/ecommerce/carts"
          highlight={!!data && data.stats.abandonedCarts > 0}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label={t("cartValue")}
          value={
            isLoading
              ? null
              : formatMoney(data?.stats.abandonedCartValue ?? 0, currency)
          }
          href="/ecommerce/carts"
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label={t("abandonmentRate")}
          value={
            isLoading
              ? null
              : // Null until there are carts to divide by; rendering that as 0%
                // would report a flawless funnel to a brand-new store.
                data?.stats.abandonedRate == null
                ? "—"
                : `${Math.round(data.stats.abandonedRate * 100)}%`
          }
          href="/ecommerce/carts"
        />
      </div>

      <Card className="p-5 shadow-none">
        <h2 className="text-sm font-semibold">{t("tradeTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("tradeBody")}</p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-sm font-semibold text-primary"
        >
          {t("tradeLink")}
        </Link>
      </Card>
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
        // `h-full`: with an `href` the Link is the grid item and the Card no longer
        // stretches with the row, so a tile whose value wrapped left its neighbour short.
        "h-full p-4 shadow-none transition-colors",
        href && "hover:border-primary/40 hover:bg-muted/30",
        highlight && "border-yellow-300",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="shrink-0 text-muted-foreground/80">{icon}</span>
        {label}
      </div>
      {value === null ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        // A money value at text-2xl is wider than a half-width mobile tile and the card
        // does not clip — shrink it and let a long amount wrap rather than spill out.
        <div className="break-words text-xl font-bold tabular-nums sm:text-2xl">{value}</div>
      )}
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : inner;
}
