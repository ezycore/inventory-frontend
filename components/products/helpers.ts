// coding-standard: maintained
import { StatData } from "@/ui/components/StatsCard"
import { Box, CheckCircle2, XCircle, Layers } from "lucide-react"
import { toast } from "sonner"
import type { Translator } from "@/i18n/config"
import { buildImageOrder, galleryFiles } from "@/lib/image-gallery-order"
import { richDocToPlainText } from "@/lib/storefront-rich-doc"

/** `prepareSubmitData` is called by DataTable/DataCard as `(data, isEdit, item)` — no
 * room for a `t` param, so the page closes over the translator via this factory. */
export const makePrepareSubmitData = (t: Translator) => (data: any, isEdit: boolean, item?: any) => {
  const formData = new FormData()
  if(data.enableUOMConversion){
    if(!data.purchaseUnit?.unitId && !data.saleUnit?.unitId){
      toast.error(t("toasts.uomRequired"))
      throw new Error("Validation error: No units selected for UOM conversion.")
    }
  }
  // Note: ID is automatically injected by DataTable for edit mode

  // Strip UOM payload the backend can't persist (purchaseUnit/saleUnit require a
  // valid unitId; empty objects fail validation). The form engine already drops
  // conditionally-hidden fields — purchaseUnit when conversion is off, and
  // enableUOMConversion for variable products — so we only guard what it can't
  // see: a visible-but-incomplete purchaseUnit (no unitId), and saleUnit, which
  // is populated via copyValueTo and has no field for the engine to strip.
  const skipUOMKeys = new Set<string>()
  if (!data.purchaseUnit?.unitId) skipUOMKeys.add("purchaseUnit")
  if (!data.enableUOMConversion || !data.saleUnit?.unitId) skipUOMKeys.add("saleUnit")

  // The "Publish to store" fields are flat on the form and nested on the wire.
  //
  // `storefrontObjectSchema` parses `storefront` as a JSON object, so these
  // fields have to be collected before the loop below — which would otherwise
  // send them as top-level keys the validator ignores, silently producing a
  // product that saves fine and publishes nothing the merchant typed.
  //
  // Only assembled when the fields are actually present: `useFilteredFormConfig`
  // strips the whole section for every other tier, and sending an empty
  // `storefront` object would overwrite a stocked merchant's listing settings
  // with nothing.
  // `onlineDescription` left this list in the description consolidation — the
  // shop copy is the product's own top-level `description` now.
  const storefrontKeys = [
    "isListed",
    "onlinePrice",
    "featured",
    "weightKg",
  ] as const;
  const storefrontPatch: Record<string, unknown> = {};
  for (const key of storefrontKeys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      storefrontPatch[key] = data[key];
    }
  }
  if (Object.keys(storefrontPatch).length > 0) {
    formData.append("storefront", JSON.stringify(storefrontPatch));
  }

  // An empty rich-text editor serializes to `{"type":"doc","content":[{"type":
  // "paragraph"}]}` — a NON-empty string. Left as-is, clearing the description
  // would store 45 bytes of empty document instead of unsetting the field, and
  // every `description ? …` check downstream would read as "has a description".
  // Normalized here, at the one place the form's value becomes a payload.
  if (typeof data.description === "string" && !richDocToPlainText(data.description)) {
    data = { ...data, description: "" }
  }

  // Add all fields except images, variants, and _id
  for (const key in data) {
    if (
      key !== 'images' &&
      key !== 'variants' &&
      key !== '_id' &&
      // Sent nested as `storefront` above; a duplicate flat key here would be
      // ignored by the validator at best and shadow the object at worst.
      !storefrontKeys.includes(key as (typeof storefrontKeys)[number]) &&
      !skipUOMKeys.has(key) &&
      data[key] !== undefined
    ) {
      const value = data[key]
      if (value instanceof Date) {
        // Date fields resolve to a Date object (the generated date schema pipes
        // string → Date). JSON.stringify would wrap it in quotes, which the
        // backend's z.coerce.date() rejects — send a bare ISO string instead.
        formData.append(key, value.toISOString())
      } else if (value !== null && typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value)
      }
    }
  }

  if (isEdit && item) {
    // EDIT MODE: Handle image changes
    const existingImages = item.images || [];
    const currentImages = data.images || [];

    // Detect removed images (compare publicIds)
    const existingPublicIds = existingImages.map((img: any) => img.publicId);
    const currentPublicIds = currentImages
      .filter((img: any) => typeof img === 'object' && img.publicId)
      .map((img: any) => img.publicId);

    const removedImageIds = existingPublicIds.filter(
      (id: string) => !currentPublicIds.includes(id)
    );

    if (removedImageIds.length > 0) {
      formData.append("removeImages", JSON.stringify(removedImageIds));
    }

    // Append new files (File objects) in GALLERY order — `upload:<n>` in the
    // manifest below indexes into this sequence, so the two must be built from
    // the same array or a replacement lands in the wrong slot.
    galleryFiles(currentImages as unknown[] as (File | { publicId?: string })[])
      .forEach((file) => {
        formData.append("images", file);
      });

    // The order the merchant arranged, so the server can put a replacement back
    // in the slot it replaced instead of appending it. Without this the backend
    // keeps its historical append behaviour.
    const imageOrder = buildImageOrder(
      currentImages as unknown[] as (File | { publicId?: string })[],
    );
    if (imageOrder) {
      formData.append("imageOrder", JSON.stringify(imageOrder));
    }
  } else {
    // ADD MODE: Upload new files
    if (data.images && Array.isArray(data.images)) {
      const newImages = data.images as (File | { publicId?: string })[];
      galleryFiles(newImages).forEach((file) => {
        formData.append("images", file);
      });
      // Create has nothing to keep, so the manifest only fixes the order the
      // uploads land in — which still matters, because image 0 is the cover.
      const imageOrder = buildImageOrder(newImages);
      if (imageOrder) {
        formData.append("imageOrder", JSON.stringify(imageOrder));
      }
    }
  }

  // Handle variants for variable products
  if (data.productType === "variable" && data.variants && data.variants.length > 0) {
    const activeVariants = data.variants.filter((v: any) => v.enabled)
    const variantsData = activeVariants.map((v: any, idx: number) => {
      // Separate existing images (server objects) from new File uploads
      const allImages = v.images || [];
      const existingImages = allImages.filter((img: any) => !(img instanceof File))

      // Append new variant image files with indexed field names, in GALLERY
      // order — `upload:<n>` in this variant's manifest indexes into ITS OWN
      // `variantImages_<idx>` field, not a shared counter.
      galleryFiles(allImages).forEach((file: File) => {
        formData.append(`variantImages_${idx}`, file)
      })
      // Same manifest, per variant: without it a replaced variant picture is
      // appended and the merchant's arrangement is lost, exactly as it was for
      // product images before `imageOrder`.
      const variantImageOrder = buildImageOrder(allImages)

      // Determine _id for smart merge (existing variants have MongoDB _id)
      const variantId = v._id || undefined

      return {
        ...(variantId ? { _id: variantId } : {}),
        attributes: {
          [v.attributeName]: v.value
        },
        price: v.price,
        images: existingImages, // only existing images go in JSON
        ...(variantImageOrder ? { imageOrder: variantImageOrder } : {}),
        status: v.enabled ? 'active' : 'inactive',
        // Barcode VALUE is per variant; the TYPE (symbology) is product-level and
        // shared — stamp the single form choice onto every variant. Sent even when
        // no value is typed so backend-auto-generated barcodes carry the same type.
        ...(v.barcode?.trim() ? { barcode: v.barcode.trim() } : {}),
        ...(data.barcodeSymbology ? { barcodeSymbology: data.barcodeSymbology } : {}),
        enableUOMConversion: !!v.enableUOMConversion,
        ...(v.inventoryAlertLevel !== undefined && { inventoryAlertLevel: v.inventoryAlertLevel }),
        // Per-variant opening stock (backend ignores unless addToInventory && locationId)
        ...(v.openingStock != null && { openingStock: v.openingStock }),
        ...(v.costPrice != null && { costPrice: v.costPrice }),
        ...(v.expiryDate && { expiryDate: v.expiryDate }),
        ...(v.batchNumber && { batchNumber: v.batchNumber }),
        ...(v.enableUOMConversion
          ? {
              ...(v.purchaseUnit?.unitId
                ? { purchaseUnit: { unitId: v.purchaseUnit.unitId, conversionFactor: v.purchaseUnit.conversionFactor ?? 1 } }
                : {}),
              ...(v.saleUnit?.unitId
                ? { saleUnit: { unitId: v.saleUnit.unitId, conversionFactor: v.saleUnit.conversionFactor ?? 1 } }
                : {}),
            }
          : {}),
      }
    })
    formData.append('variants', JSON.stringify(variantsData))
  }
  return formData
}

export const getProductStats = (
  stats: Record<string, any> | undefined,
  t: Translator,
): StatData[] => [
  {
    label: t("stats.total"),
    value: stats?.total || 0,
    icon: Box,
    variant: "primary",
    description: t("stats.totalDescription"),
  },
  {
    label: t("stats.variantProducts"),
    value: stats?.variantProducts || 0,
    icon: Box,
    variant: "default",
    description: t("stats.variantProductsDescription"),
  },
  {
    label: t("stats.active"),
    value: stats?.active || 0,
    icon: CheckCircle2,
    variant: "success",
    description: t("stats.activeDescription"),
  },
  {
    label: t("stats.inactive"),
    value: stats?.inactive || 0,
    icon: XCircle,
    variant: stats?.inactive > 0 ? "warning" : "default",
    description: t("stats.inactiveDescription"),
  },
];