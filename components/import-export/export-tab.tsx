"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getInventoryFilterConfig } from "@/components/inventory/filters";
import { getProductFilterConfig } from "@/components/products/filters";
import { ExportData } from "@/components/reports/export-data";
import { inventoryApi, productsApi } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { ExportOption } from "@/types/DataTable";
import { ExportCard } from "./export-card";
import { useActiveLocationName } from "./use-active-location-name";

interface ExportTabProps {
  allowed: { products: boolean; stock: boolean; records: boolean };
}

/**
 * Everything the workspace can export. Products and Stock come out in their
 * import template's format, with the list pages' own filters and choices; the
 * business records are Reports → Export Data, which moved in here.
 */
export function ExportTab({ allowed }: ExportTabProps) {
  const t = useTranslations("importExport.export");
  const tProducts = useTranslations("products.products");
  const tInventory = useTranslations("inventory");
  const location = useActiveLocationName();
  const expiryEnabled = useAuthStore((s) => s.user?.organization?.features?.expiryTracking ?? false);

  const productFilters = useMemo(() => getProductFilterConfig(tProducts), [tProducts]);
  const stockFilters = useMemo(() => getInventoryFilterConfig(tInventory), [tInventory]);

  const productChoices: ExportOption[] = [
    { key: "all", label: t("products.allColumns"), description: t("products.allColumnsDesc") },
    {
      key: "essential",
      label: t("products.essentialColumns"),
      description: t("products.essentialColumnsDesc"),
      params: { columns: "essential" },
    },
  ];
  // The same three choices Current Stock offered, lots only when expiry is tracked.
  const stockChoices: ExportOption[] = [
    { key: "stock-all", label: tInventory("stock.exportStockAll"), description: tInventory("stock.exportStockAllDesc") },
    {
      key: "stock-essential",
      label: tInventory("stock.exportStockEssential"),
      description: tInventory("stock.exportStockEssentialDesc"),
      params: { columns: "essential" },
    },
    ...(expiryEnabled
      ? [
          {
            key: "batch",
            label: tInventory("stock.exportBatch"),
            description: tInventory("stock.exportBatchDesc"),
            params: { dataset: "batch" },
          },
        ]
      : []),
  ];

  if (!allowed.products && !allowed.stock && !allowed.records) {
    return <p className="text-sm text-muted-foreground">{t("nothing")}</p>;
  }

  return (
    <div className="space-y-8">
      {(allowed.products || allowed.stock) && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t("filesTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("filesHint")}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {allowed.products && (
              <ExportCard
                title={t("products.title")}
                description={t("products.description")}
                filterConfig={productFilters}
                choices={productChoices}
                note={tProducts("page.exportNote")}
                download={productsApi.exportCsv}
              />
            )}
            {allowed.stock && (
              <ExportCard
                title={t("stock.title")}
                description={t("stock.description", { location })}
                filterConfig={stockFilters}
                choices={stockChoices}
                note={tInventory("stock.exportNote")}
                download={(params) =>
                  params.dataset === "batch" ? inventoryApi.exportBatchCsv(params) : inventoryApi.exportCsv(params)
                }
              />
            )}
          </div>
        </section>
      )}
      {allowed.records && <ExportData />}
    </div>
  );
}
