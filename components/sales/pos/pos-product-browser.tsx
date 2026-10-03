"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ExtractedProduct } from "@/components/sales/types";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import { SimpleSelect } from "@/ui/components/simple-select";
import { cn } from "@ui/lib/utils";
import { sortGroups, type PosCategory, type PosProductGroup, type PosSort } from "./pos-catalog";
import { ALL_CATEGORIES, PosCategoryNav } from "./pos-category-nav";
import { PosProductTile } from "./pos-product-tile";
import { PosVariantPicker } from "./pos-variant-picker";

/**
 * Browse the shop's products by category and tap to add.
 *
 * Everything sizes to the BROWSER's width (`@container`), not the screen's:
 * the category rail appears once the browser is wide enough and becomes chips
 * when it isn't, and the tile grid fills whatever width it has. One component
 * therefore serves a phone, a 1366 px counter and a wide monitor.
 *
 * A tap goes through `handleProductSelect` — the same path as picking from the
 * search box — so customer discount, stock limits and FEFO all apply unchanged.
 */
export function PosProductBrowser({
  ctx,
  groups,
  categories,
  isLoading,
}: {
  ctx: SellPageContext;
  groups: PosProductGroup[];
  categories: PosCategory[];
  isLoading: boolean;
}) {
  const t = useTranslations("sales.pos.browse");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sub, setSub] = useState<string | null>(null);
  const [sort, setSort] = useState<PosSort>("name");
  const [picking, setPicking] = useState<PosProductGroup | null>(null);

  const inCartByRow = useMemo(
    () => new Map(ctx.items.map((line) => [line.inventoryId, line.quantity])),
    [ctx.items],
  );
  const current = categories.find((c) => c.id === category);
  const visible = useMemo(
    () =>
      sortGroups(
        groups.filter(
          (g) =>
            (category === ALL_CATEGORIES || g.categoryId === category) &&
            (!sub || g.subcategoryId === sub),
        ),
        sort,
      ),
    [groups, category, sub, sort],
  );

  const selectCategory = (id: string) => {
    setCategory(id);
    setSub(null);
  };
  const pick = (group: PosProductGroup) => {
    if (group.rows.length > 1) setPicking(group);
    else ctx.handleProductSelect(group.rows[0]);
  };
  const add = (row: ExtractedProduct) => ctx.handleProductSelect(row);

  const navProps = { categories, total: groups.length, selected: category, onSelect: selectCategory };

  return (
    <section className="@container flex h-full min-h-0 overflow-hidden rounded-xl border bg-card shadow-xs">
      <PosCategoryNav variant="rail" {...navProps} />

      <div className="flex min-w-0 flex-1 flex-col">
        <PosCategoryNav variant="chips" {...navProps} />

        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2 pt-2.5">
          <h2 className="mr-1 text-sm font-semibold">{current?.name ?? t("allProducts")}</h2>
          {current?.subs.length ? (
            <>
              <SubChip active={!sub} onClick={() => setSub(null)}>{t("allInCategory")}</SubChip>
              {current.subs.map((s) => (
                <SubChip key={s.id} active={sub === s.id} onClick={() => setSub(s.id)}>
                  {s.name}
                </SubChip>
              ))}
            </>
          ) : null}
          <SimpleSelect
            size="sm"
            value={sort}
            onValueChange={(v) => setSort(v as PosSort)}
            title={t("sort.label")}
            className="ml-auto w-auto min-w-36"
            options={[
              { value: "name", label: t("sort.name") },
              { value: "priceLow", label: t("sort.priceLow") },
              { value: "stockLow", label: t("sort.stockLow") },
            ]}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("loading")}</p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {groups.length === 0 ? t("noneAtAll") : t("empty")}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2 @4xl:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
              {visible.map((group) => (
                <PosProductTile
                  key={group.key}
                  group={group}
                  inCart={group.rows.reduce((n, r) => n + (inCartByRow.get(r.value) ?? 0), 0)}
                  onPick={pick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PosVariantPicker
        group={picking}
        inCartByRow={inCartByRow}
        onAdd={add}
        onClose={() => setPicking(null)}
      />
    </section>
  );
}

function SubChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-7 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        active ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
