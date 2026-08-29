"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import {
  type CatalogProduct,
  type VariantPricingEntry,
  useCatalogVariants,
  useGetStorefrontSettings,
  useUpdateCatalogListing,
} from "@/services/api";
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
import {
  VariantPricingFields,
  type VariantPriceDraft,
} from "@/components/ecommerce/catalog/variant-pricing-fields";
import { formatMoney } from "@/components/storefront/format";
import { slugify } from "@/utils/slugify";
import { RECOMMENDED } from "@/lib/image-ratio";

/**
 * `INHERIT` is a UI-only sentinel, never a stored value: picking it sends the
 * field in `clearFields` so the backend `$unset`s it and the product falls back
 * to the store-wide default (Ecommerce → Settings → General). A fourth enum
 * value on the model would look the same to a merchant and quietly break that
 * fallback — the product would store "inherit" and resolve to nothing.
 */
const INHERIT = "inherit";

const OUT_OF_STOCK_LABELS: Record<string, string> = {
  show: 'Show as "Out of stock"',
  hide: "Hide from store",
  backorder: "Allow backorder",
};

const outOfStockOptions = (storeDefault?: string) => [
  {
    value: INHERIT,
    label: `Use store default (${OUT_OF_STOCK_LABELS[storeDefault ?? "show"] ?? OUT_OF_STOCK_LABELS.show})`,
  },
  { value: "show", label: OUT_OF_STOCK_LABELS.show },
  { value: "hide", label: OUT_OF_STOCK_LABELS.hide },
  { value: "backorder", label: OUT_OF_STOCK_LABELS.backorder },
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
  // Only to LABEL the inherit option with what it actually resolves to — the
  // editor never writes this. Shared cache with the Settings page, so opening
  // the sheet costs no extra request in practice.
  const { data: storeSettings } = useGetStorefrontSettings();
  const storeDefaultOutOfStock = storeSettings?.defaultOutOfStockBehavior;
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
  const [outOfStock, setOutOfStock] = useState(INHERIT);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [variantDrafts, setVariantDrafts] = useState<
    Record<string, VariantPriceDraft>
  >({});

  // Variable products are priced per variant — load their overlay lazily.
  const isVariableProduct = product?.productType === "variable";
  const { data: variantRows, isLoading: variantsLoading } = useCatalogVariants(
    product?._id ?? null,
    isVariableProduct,
  );

  // Seed the per-variant drafts once the rows arrive (and reset per product).
  useEffect(() => {
    const next: Record<string, VariantPriceDraft> = {};
    for (const v of variantRows ?? []) {
      next[v._id] = {
        onlinePrice: typeof v.onlinePrice === "number" ? v.onlinePrice : null,
        compareAtPrice:
          typeof v.compareAtPrice === "number" ? v.compareAtPrice : null,
      };
    }
    setVariantDrafts(next);
  }, [variantRows]);

  const setVariantDraft = (
    variantId: string,
    patch: Partial<VariantPriceDraft>,
  ) =>
    setVariantDrafts((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] ?? { onlinePrice: null, compareAtPrice: null }),
        ...patch,
      },
    }));

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
    // Unset on the product = following the store default, which is exactly what
    // the sentinel means — do NOT fall back to "show" here or every save would
    // stamp an explicit override onto a product that had none.
    setOutOfStock(sf.outOfStockBehavior ?? INHERIT);
    setImages((product?.images ?? []) as GalleryImage[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!product) return null;

  const blockReason = onlineBlockReason(product);
  const stock = product.availableQuantity ?? 0;
  // Variable products price per variant — the product-level Online price /
  // Compare-at don't apply to them, so those inputs are replaced with the range.
  const isVariable = product.productType === "variable";

  const priceRangeLabel = product.priceRange
    ? product.priceRange.min === product.priceRange.max
      ? formatMoney(product.priceRange.min, currency)
      : `${formatMoney(product.priceRange.min, currency)} – ${formatMoney(product.priceRange.max, currency)}`
    : null;

  // Placeholder mirrors the catalog's inherited base price: empty online price
  // falls back to it on the storefront, so show the real value, not a label.
  const basePlaceholder =
    priceRangeLabel ??
    (isVariable ? "Base price" : formatMoney(product.price, currency));

  const save = async () => {
    const fd = new FormData();
    fd.append("isListed", String(isListed));
    fd.append("featured", String(featured));

    // Optional fields: send the value when present, else mark it cleared so the
    // backend $unsets it (an emptied field falls back to the base product value —
    // sending nothing would leave the old value in place).
    const cleared: string[] = [];
    const optional: [string, string | null][] = [
      // Variable products are priced per variant — leave the (inert) product-level
      // price fields untouched rather than writing or clearing them.
      ...(isVariable
        ? []
        : ([
            ["onlinePrice", onlinePrice !== null ? String(onlinePrice) : null],
            [
              "compareAtPrice",
              compareAtPrice !== null ? String(compareAtPrice) : null,
            ],
          ] as [string, string | null][])),
      // `null` here (the INHERIT sentinel) clears the override — see `INHERIT`.
      ["outOfStockBehavior", outOfStock === INHERIT ? null : outOfStock],
      ["weightKg", weightKg !== null ? String(weightKg) : null],
      ["slug", slug.trim() || null],
      ["onlineTitle", onlineTitle.trim() || null],
      ["onlineDescription", onlineDescription.trim() || null],
      ["seoTitle", seoTitle.trim() || null],
      ["seoDescription", seoDescription.trim() || null],
    ];
    for (const [key, value] of optional) {
      if (value !== null) fd.append(key, value);
      else cleared.push(key);
    }
    if (cleared.length) fd.append("clearFields", JSON.stringify(cleared));

    // Per-variant online price + compare-at (variable products only). null clears
    // the field on the variant; the base variant price then sells online.
    if (isVariable && variantRows?.length) {
      const variantPricing: VariantPricingEntry[] = variantRows.map((v) => {
        const draft = variantDrafts[v._id] ?? {
          onlinePrice: null,
          compareAtPrice: null,
        };
        return {
          variantId: v._id,
          onlinePrice: draft.onlinePrice,
          compareAtPrice: draft.compareAtPrice,
        };
      });
      fd.append("variantPricing", JSON.stringify(variantPricing));
    }

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
              <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
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

          {/* Pricing — variable products are priced per variant */}
          {isVariable ? (
            <div className="space-y-1.5">
              <Label>Per-variant pricing</Label>
              <p className="text-xs text-muted-foreground">
                Set each option&apos;s online price (leave empty to sell at its base
                price) and an optional compare-at &quot;was&quot; price.
              </p>
              <VariantPricingFields
                variants={variantRows ?? []}
                value={variantDrafts}
                onChange={setVariantDraft}
                currency={currency}
                loading={variantsLoading}
              />
            </div>
          ) : (
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
          )}

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
            <ImageGalleryUpload
              value={images}
              onChange={setImages}
              maxFiles={5}
              dropzoneText="Square 1600 × 1600 px works best · PNG, JPG, WEBP up to 5MB · Max 5 images"
              recommended={RECOMMENDED.product}
            />
          </div>

          {/* Out of stock behavior */}
          <div className="space-y-1">
            <Label>When out of stock</Label>
            <SimpleSelect
              value={outOfStock}
              onValueChange={setOutOfStock}
              options={outOfStockOptions(storeDefaultOutOfStock)}
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
