"use client";
// coding-standard: maintained

import { useAuthStore } from "@/services/stores/use-auth-store";
import { isFeatureEnabled } from "@/lib/feature-utils";
import PageHeader from "@/ui/components/header";
import { CollectionsTab } from "@/components/ecommerce/catalog/collections-tab";

/**
 * Collections stayed behind when the catalog's product listing moved to
 * Products → Online. It is storefront-only taxonomy with no Products
 * equivalent — grouping products for the shop, not editing the products
 * themselves — so it keeps its own destination under Online Store
 * (docs/plan/onboarding-workspace.md §6.3).
 */
export default function EcommerceCollectionsPage() {
  const features = useAuthStore((s) => s.user?.organization?.features);

  if (!isFeatureEnabled(features, "storefront")) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        The online store is not enabled for your organization.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Collections"
        subTitle="Group products into collections shoppers can browse in your online store."
      />
      <CollectionsTab />
    </div>
  );
}
