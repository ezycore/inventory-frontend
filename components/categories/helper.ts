import { Category } from "@/types";
import { StatData } from "@/ui/components/StatsCard";
import { CheckCircle2, ShoppingBag, Tag, XCircle } from "lucide-react";
import type { Translator } from "@/i18n/config";

export const prepareSubmitData = (
  data: Category,
  isEdit: boolean,
  item?: Category,
) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("status", data.status);
  formData.append("isDefault", data.isDefault ? "true" : "false");
  // Always sent, including empty: the validator maps "" to null, which is how a
  // category's default VAT rate gets cleared. Omitting the key would mean
  // "leave unchanged" and the rate could never be removed once set.
  formData.append("defaultTaxId", data.defaultTaxId ?? "");
  // Always sent, including empty, for the same reason as defaultTaxId above: the
  // validator maps "" to null, which is how a sub-category is promoted back to
  // top level. Omitting the key would mean "leave unchanged".
  formData.append("parentId", (data as { parentId?: string }).parentId ?? "");
  if (data.description) {
    formData.append("description", data.description);
  }

  if (isEdit && item) {
    // EDIT MODE: reconcile existing images against the current field value
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

    // Append newly added files (File objects)
    const newFiles = (currentImages as unknown[]).filter(
      (img): img is File => img instanceof File,
    );
    newFiles.forEach((file) => {
      formData.append("images", file);
    });
  } else {
    // ADD MODE: upload new files
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

export function getCategoryStats(
  stats: Record<string, any> | undefined,
  t: Translator,
): StatData[] {
  return [
    {
      label: t("stats.total"),
      value: stats?.total || 0,
      icon: Tag,
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
  ]
}