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

  // Add all fields except images, variants, and _id
  for (const key in data) {
    if (key !== 'images' && key !== 'variants' && key !== '_id' && data[key] !== undefined) {
      formData.append(key, data[key])
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
    const variantsData = data.variants.map((v: any, idx: number) => {
      // Separate existing images (server objects) from new File uploads
      const allImages = v.images || []
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
        costPrice: v.costPrice,
        price: v.price,
        images: existingImages, // only existing images go in JSON
        status: v.enabled ? 'active' : 'inactive',
      }
    })
    formData.append('variants', JSON.stringify(variantsData))
  }

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