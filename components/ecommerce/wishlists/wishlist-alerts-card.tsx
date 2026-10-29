"use client";
// coding-standard: maintained

import { useGetStorefrontSettings, useUpdateStorefrontSettings } from "@/services/api";
import { useHasPermission } from "@/hooks/use-has-permission";
import type { StorefrontSettings } from "@/types";
import { Card } from "@/ui/components/card";
import { Switch } from "@/ui/components/switch";

type Alerts = NonNullable<StorefrontSettings["wishlistAlerts"]>;

/**
 * Wishlist alerts — the merchant's switch for back-in-stock and price-drop
 * emails (backend `docs/plan/wishlist.md`, Phase 4). The notification matrix
 * shows both events read-only and links here: one owner per decision.
 *
 * Each switch saves on its own, like the shop-page switches: it is a choice
 * about live mail, not a draft. The whole object is sent every time, because
 * the backend replaces it.
 */
export function WishlistAlertsCard() {
  const { data: settings } = useGetStorefrontSettings();
  const update = useUpdateStorefrontSettings();
  const canManage = useHasPermission("storefront.manage");

  const alerts: Required<Alerts> = {
    enabled: settings?.wishlistAlerts?.enabled ?? false,
    backInStock: settings?.wishlistAlerts?.backInStock ?? true,
    priceDrop: settings?.wishlistAlerts?.priceDrop ?? true,
  };
  const save = (patch: Partial<Alerts>) =>
    update.mutate({ wishlistAlerts: { ...alerts, ...patch } });
  const disabled = !settings || update.isPending || !canManage;

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <label className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-medium">Email shoppers about their wishlist</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            One email when something they saved is back in stock or cheaper. Only signed-in
            shoppers who turned on &ldquo;Wishlist alerts&rdquo; in their account&apos;s
            notification settings get it (it starts off) — guests can&apos;t be emailed, and
            every email has an unsubscribe link.
          </span>
        </span>
        <Switch
          checked={alerts.enabled}
          disabled={disabled}
          onCheckedChange={(enabled) => save({ enabled })}
          aria-label="Email shoppers about their wishlist"
        />
      </label>

      {alerts.enabled ? (
        <div className="space-y-3 border-t pt-4">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Back in stock</span>
            <Switch
              checked={alerts.backInStock}
              disabled={disabled}
              onCheckedChange={(backInStock) => save({ backInStock })}
              aria-label="Back-in-stock emails"
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Price drop</span>
            <Switch
              checked={alerts.priceDrop}
              disabled={disabled}
              onCheckedChange={(priceDrop) => save({ priceDrop })}
              aria-label="Price-drop emails"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Checked every hour. A product sends once when it comes back, and a price drop has to
            beat the last one announced, so nobody gets the same news twice.
          </p>
        </div>
      ) : null}

      {!canManage ? (
        <p className="text-xs text-muted-foreground">
          You need permission to manage the online store to change this.
        </p>
      ) : null}
    </Card>
  );
}
