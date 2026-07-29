"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";

export interface AccountOption {
  _id: string;
  name: string;
  type?: string;
}

interface PaymentSourceFieldsProps {
  /** Prefix for the field ids so two forms can render on one page. */
  idPrefix: string;
  accounts: AccountOption[];
  creditBalance: number;
  formatCurrency: (n: number) => string;
  /** Ceiling for the amount field before the store-credit cap is applied. */
  maxAmount: number;
  amount: string;
  setAmount: (v: string) => void;
  accountId: string;
  setAccountId: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  useCreditBalance: boolean;
  setUseCreditBalance: (v: boolean) => void;
  disabled?: boolean;
}

/**
 * Amount + funding source + notes — shared by the single-invoice payment form
 * and the customer-level receipt form. A receipt draws from one source: either
 * an account or store credit, never both.
 */
export function PaymentSourceFields({
  idPrefix,
  accounts,
  creditBalance,
  formatCurrency,
  maxAmount,
  amount,
  setAmount,
  accountId,
  setAccountId,
  notes,
  setNotes,
  useCreditBalance,
  setUseCreditBalance,
  disabled = false,
}: PaymentSourceFieldsProps) {
  const t = useTranslations("customers.paymentForm");
  const tPayments = useTranslations("common.payments");

  return (
    <>
      {creditBalance > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-blue-50 px-3 py-2 dark:bg-blue-950/20">
          <div className="text-sm">
            <div className="font-medium">{t("useStoreCredit")}</div>
            <div className="text-xs text-muted-foreground">
              {t("available", { amount: formatCurrency(creditBalance) })}
            </div>
          </div>
          <Switch
            checked={useCreditBalance}
            onCheckedChange={setUseCreditBalance}
            disabled={disabled}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-amount`}>{tPayments("paymentAmount")}</Label>
          <NumberField
            id={`${idPrefix}-amount`}
            precision={2}
            min={0}
            max={useCreditBalance ? Math.min(maxAmount, creditBalance) : maxAmount}
            value={amount === "" ? null : Number(amount)}
            onChange={(v) => setAmount(v == null ? "" : String(v))}
            placeholder={tPayments("enterAmount")}
          />
        </div>

        {!useCreditBalance && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-account`}>{tPayments("paymentAccount")}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id={`${idPrefix}-account`}>
                <SelectValue placeholder={tPayments("selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.name}
                    {account.type ? ` (${account.type})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-notes`}>{t("notesOptional")}</Label>
          <Textarea
            id={`${idPrefix}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={2}
          />
        </div>
      </div>
    </>
  );
}
