"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";

import { useApplyCategoryDefaultTax, useSelectOptions } from "@/services/api";
import { TAX_OPTIONS_API } from "./form-config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/alert-dialog";

export interface ApplyVatTarget {
  _id: string;
  name: string;
  defaultTaxId?: string | null;
  productCount?: number;
}

interface ApplyVatDialogProps {
  category: ApplyVatTarget | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirm re-pointing every product in a category at the category's default rate.
 *
 * This is the answer to "the Finance Act moved cosmetics from 5% to 6%".
 * Superseding creates a new rate and retires the old one, but each product stores
 * its own — so without this they all keep charging the retired rate.
 *
 * The confirmation is not decoration: the action **overwrites** each product's
 * current rate, including a product deliberately set to something else. The count
 * and the target rate are both shown so the number is checkable before it runs.
 */
export function ApplyVatDialog({ category, onOpenChange }: ApplyVatDialogProps) {
  const t = useTranslations("products.categories.applyVat");
  const { mutateAsync, isPending } = useApplyCategoryDefaultTax();
  const { data: taxOptions = [] } = useSelectOptions(
    category ? TAX_OPTIONS_API : null,
  );

  const rate = taxOptions.find((opt) => opt.value === category?.defaultTaxId) as
    | { label?: string; rate?: number }
    | undefined;
  const rateLabel = rate?.label ?? "—";

  const handleApply = async () => {
    if (!category) return;
    try {
      await mutateAsync(category._id);
      onOpenChange(false);
    } catch {
      // surfaced by the mutation's onError toast
    }
  };

  return (
    <AlertDialog open={!!category} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {t("body", {
                  count: category?.productCount ?? 0,
                  category: category?.name ?? "",
                  rate: rateLabel,
                })}
              </p>
              <p className="rounded-md border bg-muted/40 p-3 text-sm">
                {t("overwrites")}
              </p>
              <p className="font-medium">{t("postedSafe")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleApply} disabled={isPending}>
            {isPending ? t("applying") : t("apply")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
