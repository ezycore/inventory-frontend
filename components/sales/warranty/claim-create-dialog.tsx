"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  useCreateWarrantyClaim,
  type WarrantyLookupLine,
  type WarrantyLookupSale,
} from "@/services/api";
import { Alert, AlertDescription } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { Textarea } from "@/ui/components/textarea";

/**
 * Log a claim against one looked-up sale line. The quantity is capped at what
 * the server says is still claimable; the server checks it again inside the
 * write, so this cap is a convenience, not the rule.
 */
export function ClaimCreateDialog({
  sale,
  line,
  open,
  onOpenChange,
}: {
  sale: WarrantyLookupSale;
  line: WarrantyLookupLine;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("sales.warranty");
  const [quantity, setQuantity] = useState<number | null>(1);
  const [issue, setIssue] = useState("");
  const [notes, setNotes] = useState("");
  const create = useCreateWarrantyClaim();
  const valid = !!quantity && quantity >= 1 && quantity <= line.claimableQuantity && issue.trim() !== "";

  const submit = () => {
    if (!valid) return;
    create.mutate(
      {
        saleId: sale.saleId,
        lineIndex: line.lineIndex,
        quantity: quantity as number,
        issue: issue.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("claim.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {sale.invoiceNumber} · {line.productName}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {!line.active && (
            <Alert>
              <AlertDescription>{t("claim.outOfWarranty")}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="warranty-claim-quantity">{t("claim.quantity")}</Label>
            <NumberField
              id="warranty-claim-quantity"
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={line.claimableQuantity}
              precision={0}
              showSteppers
            />
            <p className="text-xs text-muted-foreground">
              {t("claim.maxQuantity", { max: line.claimableQuantity })}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warranty-claim-issue">{t("claim.issue")}</Label>
            <Textarea
              id="warranty-claim-issue"
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
              placeholder={t("claim.issuePlaceholder")}
              maxLength={1000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warranty-claim-notes">{t("claim.notes")}</Label>
            <Textarea
              id="warranty-claim-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("claim.notesPlaceholder")}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("claim.cancel")}
          </Button>
          <Button onClick={submit} disabled={!valid || create.isPending}>
            {t("claim.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
