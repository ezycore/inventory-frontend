import { Brand } from "@/types";
import { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, ShoppingBag, Tags, XCircle } from "lucide-react";
import type { Translator } from "@/i18n/config";

export const prepareSubmitData = (
  data: Brand,
  isEdit: boolean,
  item?: Brand,
) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("status", data.status);
  if (data.isDefault) {
    formData.append("isDefault", "true");
  } else {
    formData.append("isDefault", "false");
  }
  if (data.description) {
    formData.append("description", data.description);
  }

  if (isEdit && item) {
    // EDIT MODE: Handle image changes
    const existingImages = item.images || [];
    const currentImages = data.images || [];

    // Detect removed images (compare publicIds)
    const existingPublicIds = existingImages.map((img: any) => img.publicId);
    const currentPublicIds = currentImages
      .filter((img: any) => typeof img === "object" && img.publicId)
      .map((img: any) => img.publicId);

    const removedImageIds = existingPublicIds.filter(
      (id: string) => !currentPublicIds.includes(id),
    );

    if (removedImageIds.length > 0) {
      formData.append("removeImages", JSON.stringify(removedImageIds));
    }

    // Append new files (File objects) - use a type guard so currentImages narrows to File[]
    const newFiles = (currentImages as unknown[]).filter(
      (img): img is File => img instanceof File,
    );
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

  return formData;
};

export const getBrandStats = (
  stats: Record<string, any> | undefined,
  t: Translator,
): StatData[] => [
  {
    label: t("stats.total"),
    value: stats?.total || 0,
    icon: Tags,
    variant: "primary",
    description: t("stats.totalDescription"),
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
    variant: "warning",
    description: t("stats.inactiveDescription"),
  },
  {
    label: t("stats.totalProducts"),
    value: stats?.totalProducts || 0,
    icon: ShoppingBag,
    variant: "info",
    description: t("stats.totalProductsDescription"),
  },
];
