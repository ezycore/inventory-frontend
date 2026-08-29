"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import SimpleSelect from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import type { AccountPaymentOption } from "@/types";
import type { CreditConfig, PaymentDoc } from "./types";

interface PaymentEntryFormProps {
  doc: PaymentDoc;
  /** The minimal accounts.routes.ts payment-options list, not the full
   * Account — this only ever reads _id/name/type/isDefault, and the
   * permission that gates a "record a payment" screen is never
   * accounts.view alone. See accountPaymentOptionDto (backend). */
  accounts: AccountPaymentOption[];
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  /** Pass `undefined` for flows that do not support counterparty credit. */
  credit?: CreditConfig;
}

export function PaymentEntryForm({
  doc,
  accounts,
  isAccountsEnabled,
  formatCurrency,
  paymentAmount,
  setPaymentAmount,
  paymentAccountId,
  setPaymentAccountId,
  paymentNotes,
  setPaymentNotes,
  isSubmitting,
  onCancel,
  onSubmit,
  credit,
}: PaymentEntryFormProps) {
  const t = useTranslations("common.payments");
  const tActions = useTranslations("common.actions");
  if (!isAccountsEnabled || doc.dueAmount <= 0 || doc.status === "cancelled") return null;

  const creditEnabled = credit?.enabled ?? false;
  const maxPayableViaCredit = credit ? Math.min(doc.dueAmount, credit.available) : 0;
  const maxAmount = creditEnabled ? maxPayableViaCredit : doc.dueAmount;
  const canToggleCredit = !!credit && credit.available > 0;

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{t("entryTitle")}</div>
          <div className="text-sm text-muted-foreground">
            {t("dueAmountLine", { amount: formatCurrency(doc.dueAmount) })}
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {doc.status}
        </Badge>
      </div>

      {canToggleCredit && credit && (
        <div className="flex items-start justify-between gap-3 rounded-md border bg-background p-3">
          <div className="space-y-0.5">
            <Label htmlFor="use-credit" className="text-sm font-medium">
              {credit.label}
            </Label>
            <p className="text-xs text-muted-foreground">
              {credit.description ??
                t("creditAvailableUpTo", {
                  available: formatCurrency(credit.available),
                  max: formatCurrency(maxPayableViaCredit),
                })}
            </p>
          </div>
          <Switch
            id="use-credit"
            checked={credit.enabled}
            onCheckedChange={(checked) => {
              credit.setEnabled(checked);
              if (checked) setPaymentAmount(maxPayableViaCredit.toFixed(2));
            }}
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pay-amount">{t("paymentAmount")}</Label>
          <NumberField
            id="pay-amount"
            precision={2}
            min={0}
            max={maxAmount}
            value={paymentAmount === "" ? null : Number(paymentAmount)}
            onChange={(v) => setPaymentAmount(v == null ? "" : String(v))}
            placeholder={t("enterAmount")}
          />
        </div>

        {!creditEnabled && (
          <div className="space-y-2">
              <Label htmlFor="pay-account">{t("paymentAccount")}</Label>
              <SimpleSelect
                id="pay-account"
                value={paymentAccountId}
                onValueChange={setPaymentAccountId}
                options={accounts.map((a) => ({
                  value: a._id,
                  label: `${a.name}${a.type ? ` (${a.type})` : ""}`,
                }))}
                placeholder={t("selectAccount")}
                disabled={isSubmitting}
              />
            </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="pay-notes">{t("notes")}</Label>
          <Textarea
            id="pay-notes"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {tActions("cancel")}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !(Number(paymentAmount) > 0) || (!creditEnabled && !paymentAccountId)}
        >
          {isSubmitting ? t("processing") : t("recordPayment")}
        </Button>
      </div>
    </div>
  );
}
