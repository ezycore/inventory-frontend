"use client";
// coding-standard: maintained

import { useState } from "react";
import { useGetStorefrontSettings } from "@/services/api";
import type { StorefrontSettings } from "@/types";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { CourierSettings } from "@/components/ecommerce/courier-settings";
import { OrderStepLabelsSettings } from "@/components/ecommerce/order-step-labels-settings";
import { SeoSettings } from "@/components/ecommerce/seo-settings";
import { NotificationMatrix } from "@/components/notifications/notification-matrix";
import { GeneralSettingsTab } from "@/components/ecommerce/settings/general-settings-tab";
import { ShippingSettingsTab } from "@/components/ecommerce/settings/shipping-settings-tab";
import { CheckoutSettingsTab } from "@/components/ecommerce/settings/checkout-settings-tab";
import { PaymentsSettingsTab, PublishSettingsTab } from "@/components/ecommerce/settings/publish-payment-tabs";
import { MetaSettingsTab } from "@/components/ecommerce/settings/meta-settings-tab";
import { ClaritySettingsTab } from "@/components/ecommerce/settings/clarity-settings-tab";

const TABS = [
  { id: "general", label: "General" }, { id: "publish", label: "Publish" },
  { id: "payments", label: "Payments" }, { id: "shipping", label: "Shipping" },
  { id: "couriers", label: "Couriers" }, { id: "checkout", label: "Checkout" },
  { id: "orderSteps", label: "Order steps" }, { id: "seo", label: "SEO" },
  { id: "notifications", label: "Notifications" }, { id: "meta", label: "Meta pixel" },
  // Beside Meta pixel on purpose: both are third-party measurement the merchant pastes an id
  // into, and a merchant looking for one is looking for the other.
  { id: "clarity", label: "Clarity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function StoreSettingsPage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();
  const [tab, setTab] = useState<TabId>("general");
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold tracking-tight">Store Settings</h1><p className="mt-1 text-sm text-muted-foreground">Operational configuration for your online store.</p></div>
      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn("whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors", tab === item.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{item.label}</button>)}
      </div>
      {isLoading || !settings ? <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div> : <SettingsTab key={tab} tab={tab} settings={settings} />}
    </div>
  );
}

function SettingsTab({ tab, settings }: { tab: TabId; settings: StorefrontSettings }) {
  switch (tab) {
    case "general": return <GeneralSettingsTab settings={settings} />;
    case "publish": return <PublishSettingsTab settings={settings} />;
    case "payments": return <PaymentsSettingsTab settings={settings} />;
    case "shipping": return <ShippingSettingsTab settings={settings} />;
    case "couriers": return <CourierSettings />;
    case "checkout": return <CheckoutSettingsTab settings={settings} />;
    case "orderSteps": return <OrderStepLabelsSettings />;
    case "seo": return <SeoSettings settings={settings} />;
    case "notifications": return <NotificationsTab />;
    case "meta": return <MetaSettingsTab />;
    case "clarity": return <ClaritySettingsTab />;
  }
}

function NotificationsTab() {
  return <div className="space-y-5"><Card className="p-5 shadow-none"><NotificationMatrix domains={["storefront"]} hideDomainTabs /></Card></div>;
}
