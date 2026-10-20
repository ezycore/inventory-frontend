"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ProductCostRow } from "@/types/api";
import { useSetProductCosts } from "@/services/api";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Switch } from "@/ui/components/switch";
import { CategoryPath } from "@/components/shared/category-path";
import { TaxonomyFilterBar } from "@/components/products/catalog-filters/taxonomy-filter-bar";
import { NO_TAXONOMY_FILTER, type TaxonomyFilter } from "@/components/products/catalog-filters/taxonomy-filter";
import { costRowKey, costsToSave, filterCostRows, marginPercent } from "./cost-prices-helpers";

/**
 * Every product's cost on one page, saved together.
 *
 * Built for a shop with hundreds of products and no cost on any of them (live: UriiBaba, 0 of
 * 443) — the per-product cost button exists, and nobody opens 443 product pages. Most catalogues
 * price by kind, so the fastest path is "filter to a category, set them all, fix the odd ones":
 * two numbers instead of 443.
 *
 * Edits are held here until Save, and only changed rows are sent. The backend applies the
 * product cost rule to each (`productCostService.setCost`): sales and orders sent from now on take
 * the cost; past ones keep theirs.
 */
export function CostPricesEditor({
  rows,
  readOnly,
  money,
}: {
  rows: ProductCostRow[];
  /** Purchases own the cost (stock + purchases on) — shown, never edited. */
  readOnly: boolean;
  money: (n: number) => string;
}) {
  const t = useTranslations("products.products.costs");
  const save = useSetProductCosts();
  const [edits, setEdits] = useState<Record<string, number | null>>({});
  const [search, setSearch] = useState("");
  const [taxonomy, setTaxonomy] = useState<TaxonomyFilter>(NO_TAXONOMY_FILTER);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [fill, setFill] = useState<number | null>(null);

  const shown = useMemo(
    () => filterCostRows(rows, { search, taxonomy, onlyMissing }),
    [rows, search, taxonomy, onlyMissing],
  );
  const changes = costsToSave(rows, edits);
  const missing = rows.filter((row) => row.costPrice <= 0).length;
  useUnsavedChangesWarning(changes.length > 0);

  const costOf = (row: ProductCostRow) => {
    const key = costRowKey(row);
    return key in edits ? edits[key] : row.costPrice > 0 ? row.costPrice : null;
  };

  const applyFill = () => {
    if (fill === null) return;
    setEdits((prev) => ({
      ...prev,
      ...Object.fromEntries(shown.map((row) => [costRowKey(row), fill])),
    }));
  };

  const onSave = async () => {
    try {
      const res = await save.mutateAsync(changes);
      const { updated, failed } = res.data;
      if (failed.length) {
        toast.warning(t("partlySaved", { updated, failed: failed.length }));
        const failedKeys = new Set(failed.map((f) => `${f.productId}:${f.variantId ?? ""}`));
        setEdits((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => failedKeys.has(key))));
      } else {
        toast.success(t("saved", { count: updated }));
        setEdits({});
      }
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  const columns: SimpleColumn<ProductCostRow>[] = [
    {
      key: "product",
      header: t("columns.product"),
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-medium">{row.productName}</div>
          {row.variantName && <div className="text-xs text-muted-foreground">{row.variantName}</div>}
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
      key: "price",
      header: t("columns.price"),
      align: "right",
      // The price it really sells at; a live campaign or online price shows the list under it (S39).
      cell: (row) =>
        row.onlinePrice == null ? (
          money(row.price)
        ) : (
          <div>
            <div>{money(row.onlinePrice)}</div>
            <div className="text-xs text-muted-foreground">
              {t("listPrice", { price: money(row.price) })}
            </div>
          </div>
        ),
    },
    {
      key: "cost",
      header: t("columns.cost"),
      align: "right",
      cell: (row) =>
        readOnly ? (
          row.costPrice > 0 ? money(row.costPrice) : <span className="text-muted-foreground">{t("noCost")}</span>
        ) : (
          <NumberField
            value={costOf(row)}
            onChange={(value) => setEdits((prev) => ({ ...prev, [costRowKey(row)]: value }))}
            min={0}
            precision={2}
            size="sm"
            className="ml-auto w-28"
            aria-label={`${t("columns.cost")} — ${row.productName}`}
          />
        ),
    },
    {
      key: "margin",
      header: t("columns.margin"),
      align: "right",
      cell: (row) => {
        const margin = marginPercent(row, costOf(row));
        if (margin === null) return <span className="text-muted-foreground">—</span>;
        return <span className={margin < 0 ? "font-medium text-red-600" : ""}>{margin}%</span>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-4 shadow-none">
        <p className="text-sm font-medium">
          {missing > 0 ? t("missingCount", { missing, total: rows.length }) : t("allCosted")}
        </p>
        <p className="text-xs text-muted-foreground">{readOnly ? t("costOwned") : t("futureOnly")}</p>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:w-64"
        />
        <TaxonomyFilterBar rows={rows} value={taxonomy} onChange={setTaxonomy} />
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={onlyMissing} onCheckedChange={setOnlyMissing} />
          {t("onlyMissing")}
        </label>
      </div>

      {!readOnly && shown.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
          <span>{t("fillLabel", { count: shown.length })}</span>
          <NumberField
            value={fill}
            onChange={setFill}
            min={0}
            precision={2}
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
        <SimpleTable columns={columns} rows={shown} getRowKey={(row) => costRowKey(row)} />
      )}

      {!readOnly && (
        <div className="sticky bottom-0 flex justify-end border-t bg-background py-3">
          <Button onClick={onSave} disabled={changes.length === 0 || save.isPending}>
            {changes.length === 0 ? t("nothingToSave") : t("save", { count: changes.length })}
          </Button>
        </div>
      )}
    </div>
  );
}
