"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { type CatalogProduct, useUpdateCatalogListing } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { SimpleSelect } from "@/ui/components/simple-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import {
  ImageGalleryUpload,
  type GalleryImage,
  type UploadedImage,
} from "@/components/shared/image-gallery-upload";
import { onlineBlockReason } from "@/components/ecommerce/catalog/online-block-reason";
import { formatMoney } from "@/components/storefront/format";

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

/** Catalog → Products: the per-product online listing editor (right sheet). */
export function ProductOnlineEditor({
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
  const [onlinePrice, setOnlinePrice] = useState<number | null>(null);
  const [compareAtPrice, setCompareAtPrice] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
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
    setOnlinePrice(typeof sf.onlinePrice === "number" ? sf.onlinePrice : null);
    setCompareAtPrice(
      typeof sf.compareAtPrice === "number" ? sf.compareAtPrice : null,
    );
    setWeightKg(typeof sf.weightKg === "number" ? sf.weightKg : null);
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

  // Placeholder mirrors the catalog's inherited base price: empty online price
  // falls back to it on the storefront, so show the real value, not a label.
  const basePlaceholder = product.priceRange
    ? product.priceRange.min === product.priceRange.max
      ? formatMoney(product.priceRange.min, currency)
      : `${formatMoney(product.priceRange.min, currency)} – ${formatMoney(product.priceRange.max, currency)}`
    : product.productType === "variable"
      ? "Base price"
      : formatMoney(product.price, currency);

  const save = async () => {
    const fd = new FormData();
    fd.append("isListed", String(isListed));
    fd.append("featured", String(featured));
    fd.append("outOfStockBehavior", outOfStock);
    if (onlinePrice !== null) fd.append("onlinePrice", String(onlinePrice));
    if (compareAtPrice !== null)
      fd.append("compareAtPrice", String(compareAtPrice));
    if (weightKg !== null) fd.append("weightKg", String(weightKg));
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
              <NumberField
                min={0}
                precision={2}
                value={onlinePrice}
                onChange={setOnlinePrice}
                placeholder={basePlaceholder}
              />
            </div>
            <div className="space-y-1">
              <Label>Compare-at price</Label>
              <NumberField
                min={0}
                precision={2}
                value={compareAtPrice}
                onChange={setCompareAtPrice}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Shipping weight */}
          <div className="space-y-1">
            <Label>Shipping weight (kg)</Label>
            <NumberField
              min={0}
              max={10}
              step={0.1}
              value={weightKg}
              onChange={setWeightKg}
              placeholder="Defaults to 0.5 kg at dispatch"
            />
            <p className="text-xs text-muted-foreground">
              Used to bill the courier at the true parcel weight. Left empty, the
              order ships at the 0.5 kg courier minimum.
            </p>
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
