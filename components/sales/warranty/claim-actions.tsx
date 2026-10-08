"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useHasPermission } from "@/hooks/use-has-permission";
import {
  useReplaceWarrantyClaim,
  useUpdateWarrantyClaimStatus,
  type UpdateWarrantyClaimStatusInput,
  type WarrantyClaim,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { SerialEntryDialog } from "@/components/sales/serials/serial-entry-dialog";
import { useSerialKindOfProduct } from "@/components/sales/serials/use-serial-kinds";
import { CLAIM_TRANSITIONS, canReplace } from "./claim-status";

type NextStatus = UpdateWarrantyClaimStatusInput["status"];

/**
 * Move a claim along, or hand a replacement out of stock. Shown only to
 * `warranty.edit`; the choices come from the transition table, and the server
 * refuses anything outside it regardless.
 */
export function ClaimActions({ claim }: { claim: WarrantyClaim }) {
  const t = useTranslations("sales.warranty");
  const canEdit = useHasPermission("warranty.edit");
  const next = CLAIM_TRANSITIONS[claim.status] as NextStatus[];
  const [status, setStatus] = useState<NextStatus | "">("");
  const [note, setNote] = useState("");
  const [serviceCharge, setServiceCharge] = useState<number | null>(claim.serviceCharge ?? null);
  const update = useUpdateWarrantyClaimStatus();
  const replace = useReplaceWarrantyClaim();
  // A claim that named the faulty units' codes asks for the new units' codes too.
  const [askSerials, setAskSerials] = useState(false);
  const tracksSerials = (claim.serials?.length ?? 0) > 0;
  const kindOfProduct = useSerialKindOfProduct();

  if (!canEdit || (next.length === 0 && !canReplace(claim.status))) return null;

  const handOver = (serials?: string[]) =>
    replace.mutate(
      {
        id: claim._id,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(serials?.length ? { serials } : {}),
      },
      { onSuccess: () => setAskSerials(false) },
    );

  const submit = () => {
    if (!status) return;
    update.mutate(
      {
        id: claim._id,
        status,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(serviceCharge != null ? { serviceCharge } : {}),
      },
      {
        onSuccess: () => {
          setStatus("");
          setNote("");
        },
      },
    );
  };

  return (
    <div className="space-y-4 rounded-md border p-3">
      {next.length > 0 && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("detail.moveTo")}</Label>
              <SimpleSelect
                value={status}
                onValueChange={(value) => setStatus(value as NextStatus)}
                options={next.map((value) => ({ label: t(`status.${value}`), value }))}
              />
            </div>
            {!claim.coveredAtIntake && (
              <div className="space-y-1.5">
                <Label htmlFor="warranty-service-charge">{t("detail.serviceCharge")}</Label>
                <NumberField
                  id="warranty-service-charge"
                  value={serviceCharge}
                  onChange={setServiceCharge}
                  min={0}
                  precision={2}
                />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warranty-status-note">{t("detail.note")}</Label>
            <Input
              id="warranty-status-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
            />
          </div>
          <Button onClick={submit} disabled={!status || update.isPending}>
            {t("detail.update")}
          </Button>
        </div>
      )}

      {canReplace(claim.status) && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">{t("detail.replaceHint")}</p>
          <Button
            variant="outline"
            onClick={() => (tracksSerials ? setAskSerials(true) : handOver())}
            disabled={replace.isPending}
          >
            {t("detail.replace")}
          </Button>
          {tracksSerials && (
            <SerialEntryDialog
              open={askSerials}
              onOpenChange={setAskSerials}
              productName={claim.productName}
              kind={kindOfProduct(String(claim.productId), claim.variantId ? String(claim.variantId) : null)}
              quantity={claim.quantity}
              otherCodes={claim.serials}
              otherCodesMessage={t("detail.sameAsFaulty")}
              saving={replace.isPending}
              description={t("detail.replaceSerialsPrompt")}
              onSave={(slots) => handOver(slots.filter((slot) => slot.trim().length > 0))}
            />
          )}
        </div>
      )}
    </div>
  );
}
