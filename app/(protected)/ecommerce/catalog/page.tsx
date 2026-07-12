"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Star, Pencil, ImageIcon } from "lucide-react";
import {
  CatalogProduct,
  StorefrontCollection,
  useCatalogProducts,
  useUpdateCatalogListing,
  useBulkUpdateCatalogListing,
  useReorderCollections,
  useStorefrontCollections,
  useUpdateCollection,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { isFeatureEnabled } from "@/lib/feature-utils";
import { formatMoney } from "@/components/storefront/format";
import { Switch } from "@/ui/components/switch";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { Checkbox } from "@/ui/components/checkbox";
import { Badge } from "@/ui/components/badge";
import { cn } from "@/ui/lib/utils";
import { SimpleSelect } from "@/ui/components/simple-select";
import PageHeader from "@/ui/components/header";
import { SafeImage } from "@/ui/components/safeImage";
import { DataCardPagination } from "@/ui/components/dataCard/pagination";
import {
  ImageGalleryUpload,
  type GalleryImage,
  type UploadedImage,
} from "@/components/shared/image-gallery-upload";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";

type ListedFilter = "all" | "listed" | "unlisted";

/**
 * Why a product can't appear online even when "Listed". The public store only
 * serves active products (variable products sell per-variant via the PDP
 * variant selector). Returns null if it can appear.
 */
function onlineBlockReason(p: CatalogProduct): string | null {
  if (p.status !== "active") return `${p.status} — won't show online`;
  return null;
}

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
      <div className="container mx-auto p-6">
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
    <div className="container mx-auto space-y-4 p-6">
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

function CollectionsTab() {
  const { data: collections, isLoading } = useStorefrontCollections();
  const updateCollection = useUpdateCollection();
  const reorder = useReorderCollections();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Loading collections…
      </div>
    );
  }

  const items = collections ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No categories yet. Create categories under Products → Categories; they
        appear here as storefront collections.
      </div>
    );
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((c) => c._id));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose which categories appear as collections on your store, set their
        display name, and drag them into order.
      </p>
      <div className="overflow-hidden rounded-lg border bg-card">
        {items.map((c, i) => (
          <CollectionRow
            key={c._id}
            collection={c}
            isFirst={i === 0}
            isLast={i === items.length - 1}
            disabled={reorder.isPending}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            onToggle={(isListed) =>
              updateCollection.mutate({ id: c._id, isListed })
            }
            onRename={(displayName) =>
              updateCollection.mutate({ id: c._id, displayName })
            }
          />
        ))}
      </div>
    </div>
  );
}

function CollectionRow({
  collection,
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  onToggle,
  onRename,
}: {
  collection: StorefrontCollection;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: (isListed: boolean) => void;
  onRename: (displayName: string) => void;
}) {
  const sf = collection.storefront ?? {};
  const [name, setName] = useState(sf.displayName ?? "");

  const commitName = () => {
    const v = name.trim();
    if (v !== (sf.displayName ?? "")) onRename(v);
  };

  return (
    <div className="flex items-center gap-3 border-b p-3 last:border-0">
      <div className="flex flex-col">
        <button
          type="button"
          disabled={isFirst || disabled}
          onClick={onMoveUp}
          className="text-muted-foreground disabled:opacity-30"
          aria-label="Move up"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={isLast || disabled}
          onClick={onMoveDown}
          className="text-muted-foreground disabled:opacity-30"
          aria-label="Move down"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{collection.name}</div>
        <div className="text-xs text-muted-foreground">/{collection.slug}</div>
      </div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        placeholder={collection.name}
        className="h-9 w-48"
        aria-label="Display name"
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          checked={sf.isListed !== false}
          onCheckedChange={onToggle}
        />
        Listed
      </label>
    </div>
  );
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const OUT_OF_STOCK_OPTIONS = [
  { value: "show", label: 'Show as "Out of stock"' },
  { value: "hide", label: "Hide from store" },
  { value: "backorder", label: "Allow backorder" },
];

function ProductOnlineEditor({
  product,
  onClose,
  currency,
}: {
  product: CatalogProduct | null;
  onClose: () => void;
  currency?: string;
}) {
  const update = useUpdateCatalogListing();
  const [isListed, setIsListed] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [onlinePrice, setOnlinePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [slug, setSlug] = useState("");
  const [onlineTitle, setOnlineTitle] = useState("");
  const [onlineDescription, setOnlineDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [outOfStock, setOutOfStock] = useState("show");
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Re-seed local state when a different product opens.
  const key = product?._id ?? "";
  useEffect(() => {
    const sf = product?.storefront ?? {};
    setIsListed(sf.isListed !== false);
    setFeatured(!!sf.featured);
    setOnlinePrice(typeof sf.onlinePrice === "number" ? String(sf.onlinePrice) : "");
    setCompareAtPrice(
      typeof sf.compareAtPrice === "number" ? String(sf.compareAtPrice) : "",
    );
    setSlug(sf.slug ?? "");
    setOnlineTitle(sf.onlineTitle ?? "");
    setOnlineDescription(sf.onlineDescription ?? "");
    setSeoTitle(sf.seo?.title ?? "");
    setSeoDescription(sf.seo?.description ?? "");
    setOutOfStock(sf.outOfStockBehavior ?? "show");
    setImages((product?.images ?? []) as GalleryImage[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!product) return null;

  const blockReason = onlineBlockReason(product);
  const stock = product.availableQuantity ?? 0;

  const save = async () => {
    const fd = new FormData();
    fd.append("isListed", String(isListed));
    fd.append("featured", String(featured));
    fd.append("outOfStockBehavior", outOfStock);
    if (onlinePrice !== "") fd.append("onlinePrice", String(Number(onlinePrice)));
    if (compareAtPrice !== "")
      fd.append("compareAtPrice", String(Number(compareAtPrice)));
    if (slug.trim()) fd.append("slug", slug.trim());
    if (onlineTitle.trim()) fd.append("onlineTitle", onlineTitle.trim());
    if (onlineDescription.trim())
      fd.append("onlineDescription", onlineDescription.trim());
    if (seoTitle.trim()) fd.append("seoTitle", seoTitle.trim());
    if (seoDescription.trim()) fd.append("seoDescription", seoDescription.trim());

    // Diff images against the product's current set: existing ones the user
    // removed go in `removeImages` (publicIds); new File objects are uploaded.
    const keptPublicIds = images
      .filter((img): img is UploadedImage => !(img instanceof File))
      .map((img) => img.publicId)
      .filter((id): id is string => !!id);
    const removed = (product.images ?? [])
      .map((img) => img.publicId)
      .filter((id): id is string => !!id && !keptPublicIds.includes(id));
    if (removed.length) fd.append("removeImages", JSON.stringify(removed));
    images
      .filter((img): img is File => img instanceof File)
      .forEach((file) => fd.append("images", file));

    await update.mutateAsync({ id: product._id, formData: fd });
    onClose();
  };

  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Online listing</SheetTitle>
          <SheetDescription>{product.name}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {/* Publish + featured */}
          <div className="space-y-3 rounded-lg border p-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">List on store</span>
                <span className="block text-xs text-muted-foreground">
                  Show this product in your online store.
                </span>
              </span>
              <Switch checked={isListed} onCheckedChange={setIsListed} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Featured</span>
                <span className="block text-xs text-muted-foreground">
                  Surface in homepage featured rails.
                </span>
              </span>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </label>
            {blockReason && (
              <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                {blockReason} — it won&apos;t appear online regardless of this toggle.
              </p>
            )}
          </div>

          {/* Stock (read-only) */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">
              Live stock at fulfillment location
            </span>
            <span className="font-semibold tabular-nums">
              {stock > 0 ? `${stock} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Online price ({currency})</Label>
              <Input
                type="number"
                min={0}
                value={onlinePrice}
                onChange={(e) => setOnlinePrice(e.target.value)}
                placeholder="Base price"
              />
            </div>
            <div className="space-y-1">
              <Label>Compare-at price</Label>
              <Input
                type="number"
                min={0}
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Title + slug */}
          <div className="space-y-1">
            <Label>Online title</Label>
            <Input
              value={onlineTitle}
              onChange={(e) => setOnlineTitle(e.target.value)}
              placeholder={product.name}
              maxLength={200}
            />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugify(product.name)}
              maxLength={140}
            />
            <p className="text-xs text-muted-foreground">
              The product&apos;s online URL. Leave empty to auto-generate from the
              name.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Online description</Label>
            <Textarea
              value={onlineDescription}
              onChange={(e) => setOnlineDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Shown on the product's storefront page"
            />
          </div>

          {/* Gallery */}
          <div className="space-y-1">
            <Label>Online gallery</Label>
            <p className="text-xs text-muted-foreground">
              First image is the primary one shown on the storefront. Up to 5.
            </p>
            <ImageGalleryUpload value={images} onChange={setImages} maxFiles={5} />
          </div>

          {/* Out of stock behavior */}
          <div className="space-y-1">
            <Label>When out of stock</Label>
            <SimpleSelect
              value={outOfStock}
              onValueChange={setOutOfStock}
              options={OUT_OF_STOCK_OPTIONS}
            />
          </div>

          {/* SEO */}
          <div className="space-y-3 rounded-lg border p-3">
            <div className="text-sm font-medium">SEO</div>
            <div className="space-y-1">
              <Label>Meta title</Label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={product.name}
                maxLength={70}
              />
            </div>
            <div className="space-y-1">
              <Label>Meta description</Label>
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="A short summary for search engines"
              />
            </div>
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save listing"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
