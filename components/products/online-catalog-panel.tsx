"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { Star, Pencil, ImageIcon } from "lucide-react";
import {
  type BulkStorefrontDto,
  CatalogProduct,
  useCatalogProducts,
  useUpdateCatalogListing,
  useBulkUpdateCatalogListing,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Switch } from "@/ui/components/switch";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Badge } from "@/ui/components/badge";
import { SimpleSelect } from "@/ui/components/simple-select";
import { SafeImage } from "@/ui/components/safeImage";
import { ListPagination } from "@/components/ecommerce/list-pagination";
import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { onlineBlockReason } from "@/components/ecommerce/catalog/online-block-reason";
import { ProductOnlineEditor } from "@/components/ecommerce/catalog/product-online-editor";

type ListedFilter = "all" | "listed" | "unlisted";

type BulkOutOfStockChoice = NonNullable<
  BulkStorefrontDto["patch"]["outOfStockBehavior"]
>;

/** Bulk sold-out policy. "inherit" is a request-only sentinel that CLEARS the
 *  per-product override — see `BulkStorefrontDto`. */
const BULK_OUT_OF_STOCK_OPTIONS: { value: BulkOutOfStockChoice; label: string }[] = [
  { value: "inherit", label: "Use store default" },
  { value: "show", label: 'Show as "Out of stock"' },
  { value: "hide", label: "Hide from store" },
  { value: "backorder", label: "Allow backorder" },
];

/** Base-price cell text. VARIABLE products have no product-level price (it lives
 *  per-variant), so show the variant price range — collapsing to a single value
 *  when every variant matches, and a dash when no variant is priced. */
function basePriceLabel(p: CatalogProduct, currency?: string): string {
  if (p.priceRange) {
    const { min, max } = p.priceRange;
    return min === max
      ? formatMoney(min, currency)
      : `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  }
  if (p.productType === "variable") return "—";
  return formatMoney(p.price, currency);
}

/**
 * The storefront listing view of the product catalog — which products appear in
 * the online store, at what online price, and which are featured.
 *
 * This operates on the *same* product records as the main Products table; it is
 * a projection, not a second catalog. That is why it lives here as a tab on
 * Products rather than as its own destination: two sidebar entries for one set
 * of records is the complexity this workspace work exists to remove
 * (docs/plan/onboarding-workspace.md §6.3).
 *
 * The caller is responsible for gating on the `storefront` feature and the
 * `storefront.view` permission.
 */
export function OnlineCatalogPanel() {
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const [search, setSearch] = useState("");
  const [listed, setListed] = useState<ListedFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<CatalogProduct | null>(null);

  const { data, isLoading, isFetching } = useCatalogProducts({
    search: search || undefined,
    listed,
    featured: featuredOnly || undefined,
    page,
    limit,
  });
  const updateListing = useUpdateCatalogListing();
  const bulkUpdate = useBulkUpdateCatalogListing();

  const products = useMemo(() => data?.items ?? [], [data]);
  const pagination = data?.pagination;

  const allOnPageSelected =
    products.length > 0 && products.every((p) => selected.has(p._id));
  const toggleAll = () =>
    setSelected(
      allOnPageSelected ? new Set() : new Set(products.map((p) => p._id)),
    );
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const runBulk = async (patch: BulkStorefrontDto["patch"]) => {
    if (selected.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: [...selected], patch });
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ListSearchInput
          placeholder="Search products…"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <SimpleSelect
          value={listed}
          onValueChange={(v) => {
            setListed(v as ListedFilter);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All products" },
            { value: "listed", label: "Listed online" },
            { value: "unlisted", label: "Hidden" },
          ]}
          className="w-40"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={featuredOnly}
            onCheckedChange={(v) => {
              setFeaturedOnly(!!v);
              setPage(1);
            }}
          />
          Featured only
        </label>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
          <span className="px-1 font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => runBulk({ isListed: true })}>
            List
          </Button>
          <Button size="sm" variant="outline" onClick={() => runBulk({ isListed: false })}>
            Unlist
          </Button>
          <Button size="sm" variant="outline" onClick={() => runBulk({ featured: true })}>
            Feature
          </Button>
          <Button size="sm" variant="outline" onClick={() => runBulk({ featured: false })}>
            Unfeature
          </Button>
          {/* "inherit" CLEARS the per-product override — that is the only way to
              put a batch back under the store-wide default once someone has set
              them one by one. See `BulkStorefrontDto`. */}
          <SimpleSelect
            value=""
            onValueChange={(v) =>
              runBulk({ outOfStockBehavior: v as BulkOutOfStockChoice })
            }
            options={BULK_OUT_OF_STOCK_OPTIONS}
            placeholder="When out of stock…"
            className="w-52"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="w-10 p-3">
                <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} />
              </th>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Online stock</th>
              <th className="p-3 font-medium">Base price</th>
              <th className="p-3 font-medium">Online price</th>
              <th className="p-3 font-medium">Listed</th>
              <th className="p-3 font-medium">Featured</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const sf = p.storefront ?? {};
                const isListed = sf.isListed !== false;
                const blockReason = onlineBlockReason(p);
                return (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <Checkbox
                        checked={selected.has(p._id)}
                        onCheckedChange={() => toggleOne(p._id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                          {p.images?.[0]?.url ? (
                            <SafeImage
                              src={p.images[0].thumbnailUrl || p.images[0].url}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                            {blockReason && (
                              <Badge
                                variant="outline"
                                className="border-amber-300 text-[10px] capitalize text-amber-700"
                                title="This product will not appear on the public store regardless of the Listed toggle."
                              >
                                {blockReason}
                              </Badge>
                            )}
                          </div>
                          {p.base_sku && (
                            <div className="text-xs text-muted-foreground">
                              {p.base_sku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 tabular-nums">
                      {/*
                        An untracked workspace has no count and no out-of-stock
                        state: `availableQuantity` is the sentinel, so the badge
                        never fires and the cell would print
                        9007199254740991. An em dash says "not applicable here"
                        without claiming a level.
                      */}
                      {p.tracked === false ? (
                        <span className="text-muted-foreground">&mdash;</span>
                      ) : (p.availableQuantity ?? 0) <= 0 ? (
                        <Badge
                          variant="outline"
                          className="border-red-300 text-[10px] text-red-600"
                        >
                          Out of stock
                        </Badge>
                      ) : (
                        <span>{p.availableQuantity}</span>
                      )}
                    </td>
                    <td className="p-3 tabular-nums text-muted-foreground">
                      {basePriceLabel(p, currency)}
                    </td>
                    <td className="p-3 tabular-nums">
                      {typeof sf.onlinePrice === "number" ? (
                        formatMoney(sf.onlinePrice, currency)
                      ) : (
                        <span
                          className="italic text-muted-foreground"
                          title="Inherits the base price. Set an online price to override."
                        >
                          {basePriceLabel(p, currency)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={isListed}
                        disabled={updateListing.isPending}
                        onCheckedChange={(v) =>
                          updateListing.mutate({ id: p._id, isListed: v })
                        }
                      />
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        aria-label="Toggle featured"
                        disabled={updateListing.isPending}
                        onClick={() =>
                          updateListing.mutate({ id: p._id, featured: !sf.featured })
                        }
                      >
                        <Star
                          className={`h-5 w-5 ${
                            sf.featured
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-3">
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <ListPagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={limit}
          isFetching={isFetching}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
      )}

      <ProductOnlineEditor
        product={editing}
        onClose={() => setEditing(null)}
        currency={currency}
      />
    </div>
  );
}
