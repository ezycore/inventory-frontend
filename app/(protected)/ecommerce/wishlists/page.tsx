"use client";
// coding-standard: maintained

import { BadgeCheck, Bookmark, Heart, Users } from "lucide-react";
import { useWishlistStats } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { WishedProductsCard } from "@/components/ecommerce/wishlists/wished-products-card";
import { WishlistAlertsCard } from "@/components/ecommerce/wishlists/wishlist-alerts-card";
import StatsCard from "@/ui/components/StatsCard";

/**
 * Wishlists — what shoppers have saved for later (backend `docs/plan/wishlist.md`,
 * Phases 3–4). The numbers are read-only — a wishlist is the shopper's — and
 * the one setting here is the alerts switch. Guests count everywhere but never
 * get a row of their own: there is nobody to name.
 */
export default function WishlistsPage() {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { data: stats, isLoading } = useWishlistStats();
  const days = stats?.days ?? 30;

  const tiles = [
    {
      label: "Wishlists",
      value: stats?.lists ?? 0,
      icon: Users,
      variant: "primary" as const,
      description: stats
        ? `${stats.signedIn} signed in · ${stats.guests} guest${stats.guests === 1 ? "" : "s"}`
        : undefined,
    },
    {
      label: "Products saved",
      value: stats?.itemsSaved ?? 0,
      icon: Heart,
      variant: "default" as const,
      description: "Across every wishlist",
    },
    {
      label: "Saved recently",
      value: stats?.savedInWindow ?? 0,
      icon: Bookmark,
      variant: "default" as const,
      description: `In the last ${days} days`,
    },
    {
      label: "Bought after saving",
      value: stats?.purchasedInWindow ?? 0,
      icon: BadgeCheck,
      variant: "success" as const,
      description: `Ordered in the last ${days} days`,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wishlists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Products shoppers tapped the heart on to buy later — signed-in customers and
          guests alike.
        </p>
      </div>

      <StatsCard data={tiles} isLoading={isLoading} minCardWidth={220} />

      <div className="grid gap-5 lg:grid-cols-2">
        <WishedProductsCard
          title="Most wished"
          hint="Saved by the most shoppers. A product high here and low in your sales is worth a closer look at its price or photos."
          empty="Nobody has saved a product yet."
          products={stats?.mostWished ?? []}
          currency={currency}
          isLoading={isLoading}
        />
        <WishedProductsCard
          title="Wished but sold out"
          hint="Shoppers are waiting for these. Restock them first."
          empty="Nothing wished is sold out."
          products={stats?.wishedSoldOut ?? []}
          currency={currency}
          isLoading={isLoading}
        />
      </div>

      <WishlistAlertsCard />
    </div>
  );
}
