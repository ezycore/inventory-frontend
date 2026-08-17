"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, PackageX } from "lucide-react";
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
import { useWriteOffExpiredBatch } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatCurrency } from "@/lib/currency";
import type { ExpiryBatchRow } from "./expiry-report-types";

/**
 * Confirm writing off one expired lot.
 *
 * The expiry report's headline card has always read *"Quantity to write off"*
 * while offering no way to write anything off — the merchant had to leave for
 * Inventory → Adjust and rebuild by hand the row they were already looking at
 * (QA-070). This is that row's action.
 *
 * It states the money before it asks, because that is the number the decision
 * turns on, and it names the stock movement it will write so the merchant knows
 * this lands in their history as expiry rather than as a silent correction.
 */
export function ExpiryWriteOffDialog({
  lot,
  onOpenChange,
}: {
  /** The row being written off, or null when the dialog is closed. */
  lot: ExpiryBatchRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("reports.expiry.writeOff");
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const writeOff = useWriteOffExpiredBatch();

  const productName = lot?.productId?.name ?? "";
  const value = (lot?.costPrice ?? 0) * (lot?.remainingQuantity ?? 0);

  const handleConfirm = async () => {
    if (!lot) return;
    // `inventoryQuantity` comes from the report row. Without it there is no
    // honest `expectedQuantity` to send, and bulk-adjust's `newQuantity` is
    // absolute — guessing would write off against a figure we never read.
    if (lot.inventoryQuantity == null) {
      toast.error(t("noInventoryRow"));
      return;
    }
    try {
      await writeOff.mutateAsync({
        batchId: lot._id,
        productId: lot.productId?._id ?? "",
        variantId: lot.variantId ?? null,
        locationId: lot.locationId?._id ?? "",
        remainingQuantity: lot.remainingQuantity,
        inventoryQuantity: lot.inventoryQuantity,
      });
      toast.success(
        t("done", { qty: lot.remainingQuantity, product: productName }),
      );
      onOpenChange(false);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || t("failed"));
    }
  };

  return (
    <AlertDialog open={!!lot} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <PackageX className="size-5 text-destructive" />
            {t("title")}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {t("body", {
                  qty: lot?.remainingQuantity ?? 0,
                  product: productName,
                  batch: lot?.batchNumber || "—",
                })}
              </p>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">{t("valueLabel")}</span>
                  <span className="font-semibold tabular-nums text-destructive">
                    {formatCurrency(value, currency)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("note")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={writeOff.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // Keep the dialog up while the mutation runs, so a failure can be
              // shown against the row it belongs to.
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={writeOff.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {writeOff.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
