"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { SoldCountsEditor } from "@/components/products/sold-counts/sold-counts-editor";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useNavLabels } from "@/hooks/use-nav-labels";
import { useProductSoldCounts } from "@/services/api";
import PageHeader from "@/ui/components/header";
import { Skeleton } from "@/ui/components/skeleton";

/**
 * Sold counts — each product's opening sold count beside its online sales (backend
 * `GET/PUT /products/sold-counts`). Reached from Store settings → Social proof, so it has no
 * sidebar row of its own; the trail says where it belongs. A literal segment beside
 * `/products/[slug]`; Next routes the static one first.
 */
export default function SoldCountsPage() {
  const t = useTranslations("products.products.soldCounts");
  const { itemLabel } = useNavLabels();
  const { data, isLoading } = useProductSoldCounts();
  usePageBreadcrumbs([
    { title: itemLabel("All products"), link: "/products" },
    { title: t("title") },
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subTitle={t("subtitle")} />
      {isLoading || !data ? <Skeleton className="h-64 w-full" /> : <SoldCountsEditor data={data} />}
    </div>
  );
}
