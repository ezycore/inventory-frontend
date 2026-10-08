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
import { Checkbox } from "@/ui/components/checkbox";
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
 *
 * A line that recorded serial / IMEI codes asks WHICH unit came back: ticking
 * codes sets the quantity. Units sold without a code can still be claimed by
 * quantity, but never mixed with named ones in one claim (the server's rule).
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
  const hasSerials = line.serials.length > 0;
  const [picked, setPicked] = useState<string[]>(() =>
    line.matchedSerial && line.claimableSerials.includes(line.matchedSerial) ? [line.matchedSerial] : [],
  );
  const byCode = picked.length > 0;
  // Without codes ticked, only units sold without a code may be claimed by quantity.
  const maxQuantity = hasSerials ? line.claimableWithoutSerial : line.claimableQuantity;
  const count = byCode ? picked.length : quantity ?? 0;
  const valid =
    count >= 1 &&
    count <= line.claimableQuantity &&
    (byCode || count <= maxQuantity) &&
    issue.trim() !== "";

  const toggle = (code: string, on: boolean) =>
    setPicked((prev) => (on ? [...prev, code] : prev.filter((c) => c !== code)));

  const submit = () => {
    if (!valid) return;
    create.mutate(
      {
        saleId: sale.saleId,
        lineIndex: line.lineIndex,
        quantity: count,
        ...(byCode ? { serials: picked } : {}),
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
          {hasSerials && (
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">{t("claim.pickSerials")}</legend>
              <p className="text-xs text-muted-foreground">{t("claim.pickSerialsHint")}</p>
              <ul className="space-y-1">
                {line.serials.map((code) => {
                  const claimable = line.claimableSerials.includes(code);
                  const reason = line.returnedSerials.includes(code)
                    ? t("claim.serialReturned")
                    : line.claimedSerials.includes(code)
                      ? t("claim.serialInClaim")
                      : undefined;
                  return (
                    <li key={code}>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={picked.includes(code)}
                          disabled={!claimable}
                          onCheckedChange={(on) => toggle(code, on === true)}
                        />
                        <span className="font-mono">{code}</span>
                        {reason && <span className="text-xs text-muted-foreground">({reason})</span>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}
          {!byCode && (!hasSerials || maxQuantity > 0) && (
            <div className="space-y-1.5">
              <Label htmlFor="warranty-claim-quantity">
                {hasSerials ? t("claim.withoutSerial") : t("claim.quantity")}
              </Label>
              <NumberField
                id="warranty-claim-quantity"
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={maxQuantity}
                precision={0}
                showSteppers
              />
              <p className="text-xs text-muted-foreground">
                {t("claim.maxQuantity", { max: maxQuantity })}
              </p>
            </div>
          )}
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
