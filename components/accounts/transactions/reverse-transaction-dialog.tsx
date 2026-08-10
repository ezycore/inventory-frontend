"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ApiTransaction } from "@/types/api";
import { getErrorMessage } from "@/lib/error-handling";
import { useCurrency } from "@/lib/currency";
import { useReverseTransaction } from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";

/**
 * Correct a posted ledger line.
 *
 * The ledger is append-only — there is no edit and no delete — so the correction is a **new**
 * opposite line linked to the original. That is worth saying in the dialog: users reach for this
 * expecting the row to disappear, and it will not.
 */
export function ReverseTransactionDialog({
  transaction,
  onClose,
}: {
  transaction: ApiTransaction | null;
  onClose: () => void;
}) {
  const t = useTranslations("accounts.transactions.reverse");
  const { format } = useCurrency();
  const [reason, setReason] = useState("");
  const reverse = useReverseTransaction();

  const close = () => {
    setReason("");
    onClose();
  };

  const confirm = async () => {
    if (!transaction) return;
    try {
      await reverse.mutateAsync({
        id: transaction._id,
        reason: reason.trim() || undefined,
      });
      toast.success(t("success"));
      close();
    } catch (error) {
      // The API refuses a settlement line, a transfer leg and a second reversal. The action is
      // hidden for those, but a stale list can still hold a row someone else just reversed —
      // show what the server said rather than a generic failure.
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {transaction
              ? t("description", { amount: format(transaction.amount) })
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reverse-reason">{t("reasonLabel")}</Label>
          <Textarea
            id="reverse-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">{t("reasonHint")}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={reverse.isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={confirm} disabled={reverse.isPending}>
            {reverse.isPending ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
