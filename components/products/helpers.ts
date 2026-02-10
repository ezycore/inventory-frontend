export const prepareSubmitData = (data: any, isEdit: boolean, item?: any) => {
  const formData = new FormData()
  if(data.enableUOMConversion){
    const purchaseUnit = {
      unitId: data.purchaseUnitId || null,
      conversionFactor: data.purchaseConversionFactor || 1,
  }
    const saleUnit = {
      unitId: data.saleUnitId || null,
      conversionFactor: data.saleConversionFactor || 1,
    }

    if(!purchaseUnit.unitId && !saleUnit.unitId){
      throw new Error("At least one unit (purchase or sale) must be configured when UOM conversion is enabled")
    }
    formData.append("purchaseUnit", JSON.stringify(purchaseUnit))
    formData.append("saleUnit", JSON.stringify(saleUnit))
    delete data.purchaseUnitId
    delete data.purchaseConversionFactor
    delete data.saleUnitId
    delete data.saleConversionFactor
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
    const variantsData = data.variants.map((v: any) => ({
      attributes: {
        [v.attributeName]: v.value
      },
      costPrice: v.costPrice,
      price: v.price,
      status: v.enabled ? 'active' : 'inactive',
    }))
    formData.append('variants', JSON.stringify(variantsData))
  }

  return formData
}
