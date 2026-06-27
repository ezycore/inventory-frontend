import { StatData } from "@/ui/components/StatsCard"
import { Box, CheckCircle2, XCircle, Layers } from "lucide-react"
import { toast } from "sonner"

export const prepareSubmitData = (data: any, isEdit: boolean, item?: any) => {
  const formData = new FormData()
  if(data.enableUOMConversion){
    if(!data.purchaseUnit?.unitId && !data.saleUnit?.unitId){
      toast.error("Please select at least one unit (purchase or sale) when UOM conversion is enabled.")
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

  // Add all fields except images, variants, and _id
  for (const key in data) {
    if (
      key !== 'images' &&
      key !== 'variants' &&
      key !== '_id' &&
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

    // Append new files (File objects) - use a type guard so currentImages narrows to File[]
    const newFiles = (currentImages as unknown[]).filter((img): img is File => img instanceof File);
    newFiles.forEach((file) => {
      formData.append("images", file);
    });
  } else {
    // ADD MODE: Upload new files
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((file: any) => {
        if (file instanceof File) {
          formData.append("images", file);
        }
      });
    }
  }

  // Handle variants for variable products
  if (data.productType === "variable" && data.variants && data.variants.length > 0) {
    const activeVariants = data.variants.filter((v: any) => v.enabled)
    const variantsData = activeVariants.map((v: any, idx: number) => {
      // Separate existing images (server objects) from new File uploads
      const allImages = v.images || [];
      const existingImages = allImages.filter((img: any) => !(img instanceof File))
      const newFiles = allImages.filter((img: any) => img instanceof File)

      // Append new variant image files with indexed field names
      newFiles.forEach((file: File) => {
        formData.append(`variantImages_${idx}`, file)
      })

      // Determine _id for smart merge (existing variants have MongoDB _id)
      const variantId = v._id || undefined

      return {
        ...(variantId ? { _id: variantId } : {}),
        attributes: {
          [v.attributeName]: v.value
        },
        price: v.price,
        images: existingImages, // only existing images go in JSON
        status: v.enabled ? 'active' : 'inactive',
        enableUOMConversion: !!v.enableUOMConversion,
        ...(v.sku && { sku: v.sku }),
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
  console.log("Prepared FormData for submission:", formData)
  return formData
}

export const getProductStats = (
  stats: Record<string, any> | undefined,
): StatData[] => [
  {
    label: "Total Products",
    value: stats?.total || 0,
    icon: Box,
    variant: "primary",
    description: "All registered products",
  },
  {
    label: "Variant Products",
    value: stats?.variantProducts || 0,
    icon: Box,
    variant: "default",
    description: "Products with variants",
  },
  {
    label: "Active Products",
    value: stats?.active || 0,
    icon: CheckCircle2,
    variant: "success",
    description: "Currently active",
  },
  {
    label: "Inactive Products",
    value: stats?.inactive || 0,
    icon: XCircle,
    variant: stats?.inactive > 0 ? "warning" : "default",
    description: "Currently inactive",
  },
];