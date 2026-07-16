"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { Star, Pencil, ImageIcon } from "lucide-react";
import {
  CatalogProduct,
  useCatalogProducts,
  useUpdateCatalogListing,
  useBulkUpdateCatalogListing,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { isFeatureEnabled } from "@/lib/feature-utils";
import { formatMoney } from "@/components/storefront/format";
import { Switch } from "@/ui/components/switch";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Checkbox } from "@/ui/components/checkbox";
import { Badge } from "@/ui/components/badge";
import { cn } from "@/ui/lib/utils";
import { SimpleSelect } from "@/ui/components/simple-select";
import PageHeader from "@/ui/components/header";
import { SafeImage } from "@/ui/components/safeImage";
import { DataCardPagination } from "@/ui/components/dataCard/pagination";
import { CollectionsTab } from "@/components/ecommerce/catalog/collections-tab";
import { onlineBlockReason } from "@/components/ecommerce/catalog/online-block-reason";
import { ProductOnlineEditor } from "@/components/ecommerce/catalog/product-online-editor";

type ListedFilter = "all" | "listed" | "unlisted";

export default function EcommerceCatalogPage() {
  const features = useAuthStore((s) => s.user?.organization?.features);
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const [search, setSearch] = useState("");
  const [listed, setListed] = useState<ListedFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [tab, setTab] = useState<"products" | "collections">("products");

  const { data, isLoading } = useCatalogProducts({
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

  if (!isFeatureEnabled(features, "storefront")) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          The online store is not enabled on your plan.
        </div>
      </div>
    );
  }

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

  const runBulk = async (patch: { isListed?: boolean; featured?: boolean }) => {
    if (selected.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: [...selected], patch });
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Catalog"
        subTitle="Control which products and collections appear in your online store."
      />

      <div className="flex gap-1 border-b">
        {(["products", "collections"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "collections" ? (
        <CollectionsTab />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search products…"
              className="w-52"
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
                          {(p.availableQuantity ?? 0) <= 0 ? (
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
                          {formatMoney(p.price, currency)}
                        </td>
                        <td className="p-3 tabular-nums">
                          {typeof sf.onlinePrice === "number"
                            ? formatMoney(sf.onlinePrice, currency)
                            : "—"}
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
            <DataCardPagination
              paginationState={{ pageIndex: page - 1, pageSize: limit }}
              totalItems={pagination.total}
              onPaginationChange={({ pageIndex, pageSize }) => {
                if (pageSize !== limit) {
                  setLimit(pageSize);
                  setPage(1);
                } else {
                  setPage(pageIndex + 1);
                }
              }}
              pagination={{
                pageIndex: page - 1,
                pageSize: limit,
                totalPages: pagination.totalPages,
                totalItems: pagination.total,
                hasNext: page < pagination.totalPages,
                hasPrev: page > 1,
                manualPagination: true,
                pageSizeOptions: [20, 50, 100],
                onPaginationChange: () => {},
              }}
            />
          )}
        </>
      )}

      <ProductOnlineEditor
        product={editing}
        onClose={() => setEditing(null)}
        currency={currency}
      />
    </div>
  );
}
