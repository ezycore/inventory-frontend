"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { SegmentedField } from "@/ui/components/segmented-field";
import { useBulkUpdateProducts } from "@/services/api";
import type { ProductBulkTarget } from "@/services/api/modules/products/api";
import { getErrorMessage } from "@/lib/error-handling";
import {
  BulkActionFields,
  emptyBulkFields,
  toBulkAction,
  type BulkFieldsValue,
  type BulkOp,
} from "./bulk-action-fields";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ProductBulkTarget;
  /** Products the target covers — shown in the title and on the button. */
  count: number;
  initialOp: BulkOp;
  /** Hide the add / remove / move switch (e.g. the category page's "move products"). */
  lockOp?: boolean;
  /** Replaces the default "Add tags to N products" title. */
  title?: string;
  description?: string;
  /** Called after a successful update — clear the selection, close a parent. */
  onDone?: () => void;
}

/**
 * Confirm-and-apply for one bulk taxonomy edit. The count is in the title and on
 * the button, so the merchant sees exactly how many products they are about to
 * change before they change them.
 */
export function BulkEditDialog({
  open,
  onOpenChange,
  target,
  count,
  initialOp,
  lockOp,
  title,
  description,
  onDone,
}: BulkEditDialogProps) {
  const t = useTranslations("products.products.bulk");
  // Callers mount this dialog per use (`{target && <BulkEditDialog open … />}`),
  // so each opening starts clean on the action the merchant clicked.
  const [op, setOp] = useState<BulkOp>(initialOp);
  const [value, setValue] = useState<BulkFieldsValue>(emptyBulkFields);
  const mutation = useBulkUpdateProducts();

  const action = toBulkAction(op, value);

  const apply = async () => {
    if (!action) return;
    try {
      const res = await mutation.mutateAsync({ target, action });
      const { matched, modified } = res.data;
      if (modified === 0) toast.info(t("doneNone"));
      else toast.success(t("done", { modified, matched }));
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(getErrorMessage(error) || t("failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title ?? t(`title.${op}`, { count })}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          {!lockOp && (
            <SegmentedField
              label={t("actionLabel")}
              value={op}
              onChange={(next) => {
                setOp(next as BulkOp);
                setValue(emptyBulkFields);
              }}
              options={[
                { value: "addTags", label: t("addTags") },
                { value: "removeTags", label: t("removeTags") },
                { value: "setCategory", label: t("setCategory") },
              ]}
            />
          )}
          <BulkActionFields op={op} value={value} onChange={setValue} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={apply} disabled={!action || mutation.isPending || count === 0}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("apply", { count })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
