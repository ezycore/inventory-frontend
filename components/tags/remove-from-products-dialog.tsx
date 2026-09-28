"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EasyAlertDialog } from "@/ui/components/custom/easy-alert-dialog";
import { useBulkUpdateProducts } from "@/services/api";
import { getErrorMessage } from "@/lib/error-handling";

export interface RemoveTagTarget {
  _id: string;
  name: string;
  productCount?: number;
}

/**
 * "The campaign is over": take one tag off every product carrying it, in one
 * step. The tag itself stays (reuse it next time, or delete it now that nothing
 * holds it — deleting was blocked while products still did).
 */
export function RemoveFromProductsDialog({
  tag,
  onOpenChange,
}: {
  tag: RemoveTagTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("products.tags.removeFromProducts");
  const mutation = useBulkUpdateProducts();
  const count = tag?.productCount ?? 0;

  const confirm = async () => {
    if (!tag) return;
    try {
      const res = await mutation.mutateAsync({
        target: { filter: { tags: [tag._id] } },
        action: { op: "removeTags", tagIds: [tag._id] },
      });
      toast.success(t("done", { count: res.data.modified, name: tag.name }));
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <EasyAlertDialog
      open={!!tag}
      onOpenChange={onOpenChange}
      title={t("title", { name: tag?.name ?? "", count })}
      description={t("description")}
      confirmLabel={t("confirm")}
      onConfirm={confirm}
      isConfirming={mutation.isPending}
    />
  );
}
