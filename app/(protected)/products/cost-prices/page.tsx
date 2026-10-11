"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { formatMoney } from "@/components/storefront/format";
import { CostPricesEditor } from "@/components/products/costs/cost-prices-editor";
import { useProductCosts } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import PageHeader from "@/ui/components/header";
import { Skeleton } from "@/ui/components/skeleton";

/**
 * Cost prices — every product's buying price on one page (backend `GET/PUT /products/costs`).
 *
 * The dashboard's "Set cost prices to see profit" links here. A literal segment beside
 * `/products/[slug]`; Next routes the static one first.
 */
export default function CostPricesPage() {
  const t = useTranslations("products.products.costs");
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { data, isLoading } = useProductCosts();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subTitle={t("subtitle")} />
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <CostPricesEditor
          rows={data.items}
          readOnly={data.costOwned}
          money={(n) => formatMoney(n, currency)}
        />
      )}
    </div>
  );
}
