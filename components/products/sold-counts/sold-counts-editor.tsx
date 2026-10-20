"use client";
// coding-standard: maintained

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ProductSoldCountList, ProductSoldCountRow } from "@/types/api";
import { useSetProductSoldCounts } from "@/services/api";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { CategoryPath } from "@/components/shared/category-path";
import { TaxonomyFilterBar } from "@/components/products/catalog-filters/taxonomy-filter-bar";
import { NO_TAXONOMY_FILTER, type TaxonomyFilter } from "@/components/products/catalog-filters/taxonomy-filter";
import { filterSoldRows, soldCountsToSave } from "./sold-counts-helpers";

/**
 * Every product's opening sold count on one page — the sales a shop made before (or outside) its
 * online store, which the storefront's "120 sold" chip adds to its online orders
 * (docs/plan/social-proof.md). Editable at any time; only changed rows are sent.
 */
export function SoldCountsEditor({ data }: { data: ProductSoldCountList }) {
  const t = useTranslations("products.products.soldCounts");
  const save = useSetProductSoldCounts();
  const [edits, setEdits] = useState<Record<string, number | null>>({});
  const [search, setSearch] = useState("");
  const [taxonomy, setTaxonomy] = useState<TaxonomyFilter>(NO_TAXONOMY_FILTER);
  const [fill, setFill] = useState<number | null>(null);
  const shown = useMemo(
    () => filterSoldRows(data.items, { search, taxonomy }),
    [data.items, search, taxonomy],
  );
  const changes = soldCountsToSave(data.items, edits);
  useUnsavedChangesWarning(changes.length > 0);

  const openingOf = (row: ProductSoldCountRow) =>
    row.productId in edits ? edits[row.productId] : row.openingSold || null;

  // Filter to a category, set them all, then fix the odd ones — the Cost prices pattern. Held as
  // edits until Save, like a typed number.
  const applyFill = () => {
    if (fill === null) return;
    setEdits((prev) => ({ ...prev, ...Object.fromEntries(shown.map((row) => [row.productId, fill])) }));
  };

  const onSave = async () => {
    try {
      const res = await save.mutateAsync(changes);
      toast.success(t("saved", { count: res.data.updated }));
      setEdits({});
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const columns: SimpleColumn<ProductSoldCountRow>[] = [
    {
      key: "product",
      header: t("columns.product"),
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-medium">{row.productName}</div>
          {row.hasVariants && <div className="text-xs text-muted-foreground">{t("allVariants")}</div>}
        </div>
      ),
    },
    {
      key: "category",
      header: t("columns.category"),
      cell: (row) => (
        <CategoryPath
          category={row.categoryName}
          subcategory={row.subcategoryName}
          fallback="—"
          className="text-muted-foreground"
        />
      ),
    },
    {
      key: "opening",
      header: t("columns.opening"),
      align: "right",
      cell: (row) => (
        <NumberField
          value={openingOf(row)}
          onChange={(value) => setEdits((prev) => ({ ...prev, [row.productId]: value }))}
          min={0}
          max={10_000_000}
          precision={0}
          size="sm"
          className="ml-auto w-28"
          aria-label={`${t("columns.opening")} — ${row.productName}`}
        />
      ),
    },
    {
      key: "online",
      header: t("columns.online"),
      align: "right",
      cell: (row) => row.onlineSold.toLocaleString("en-US"),
    },
    {
      key: "total",
      header: t("columns.total"),
      align: "right",
      cell: (row) => {
        const total = (openingOf(row) ?? 0) + row.onlineSold;
        // Below the minimum the shop shows no chip at all — greyed so the merchant can see why.
        return total >= data.minToShow && total > 0 ? (
          <span className="font-medium">{total.toLocaleString("en-US")}</span>
        ) : (
          <span className="text-muted-foreground">{t("hidden", { total })}</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-4 shadow-none">
        <p className="text-sm">{t(`countFrom.${data.countFrom}`)}</p>
        <p className="text-xs text-muted-foreground">
          {t("minimum", { min: data.minToShow })}{" "}
          <Link href="/ecommerce/settings" className="underline underline-offset-2">
            {t("settingsLink")}
          </Link>
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:w-64"
        />
        <TaxonomyFilterBar rows={data.items} value={taxonomy} onChange={setTaxonomy} />
      </div>

      {shown.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
          <span>{t("fillLabel", { count: shown.length })}</span>
          <NumberField
            value={fill}
            onChange={setFill}
            min={0}
            max={10_000_000}
            precision={0}
            size="sm"
            className="w-28"
            aria-label={t("fillLabel", { count: shown.length })}
          />
          <Button size="sm" variant="outline" onClick={applyFill} disabled={fill === null}>
            {t("fillApply")}
          </Button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <SimpleTable columns={columns} rows={shown} getRowKey={(row) => row.productId} />
      )}

      <div className="sticky bottom-0 flex justify-end border-t bg-background py-3">
        <Button onClick={onSave} disabled={changes.length === 0 || save.isPending}>
          {changes.length === 0 ? t("nothingToSave") : t("save", { count: changes.length })}
        </Button>
      </div>
    </div>
  );
}
