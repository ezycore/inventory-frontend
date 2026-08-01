"use client";
// coding-standard: maintained

import { useState } from "react";
import { useGetStorefrontSettings } from "@/services/api";
import type { StorefrontSettings } from "@/types";
import { CourierSettings } from "@/components/ecommerce/courier-settings";
import { CheckoutTab } from "@/components/ecommerce/settings/checkout-tab";
import { GeneralTab } from "@/components/ecommerce/settings/general-tab";
import { NotificationsTab } from "@/components/ecommerce/settings/notifications-tab";
import { PaymentsTab } from "@/components/ecommerce/settings/payments-tab";
import { PublishTab } from "@/components/ecommerce/settings/publish-tab";
import { ShippingTab } from "@/components/ecommerce/settings/shipping-tab";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";

/**
 * Store Settings — the tab shell only. Each tab is its own component under
 * `components/ecommerce/settings/`, along with the shared primitives they build
 * from (`settings-primitives.tsx`). Keep it that way: this page held all seven
 * tabs inline and had reached 939 lines.
 */
const TABS = [
  { id: "general", label: "General" },
  { id: "publish", label: "Publish" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping" },
  { id: "couriers", label: "Couriers" },
  { id: "checkout", label: "Checkout" },
  { id: "notifications", label: "Notifications" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function StoreSettingsPage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();
  const [tab, setTab] = useState<TabId>("general");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational configuration for your online store.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading || !settings ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        // `key={tab}` remounts on every tab change, so each tab re-seeds its local
        // state from `settings`. Without it, switching away and back would show the
        // previous tab's edits as if they had been saved.
        <SettingsTab key={tab} tab={tab} settings={settings} />
      )}
    </div>
  );
}

function SettingsTab({
  tab,
  settings,
}: {
  tab: TabId;
  settings: StorefrontSettings;
}) {
  switch (tab) {
    case "general":
      return <GeneralTab settings={settings} />;
    case "publish":
      return <PublishTab settings={settings} />;
    case "payments":
      return <PaymentsTab settings={settings} />;
    case "shipping":
      return <ShippingTab settings={settings} />;
    case "couriers":
      return <CourierSettings />;
    case "checkout":
      return <CheckoutTab settings={settings} />;
    case "notifications":
      return <NotificationsTab settings={settings} />;
  }
}
