"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import { ScrollArea } from "@/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Separator } from "@/ui/components/separator";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import type { CustomerLedgerSale } from "@/types";

interface AccountOption {
  _id: string;
  name: string;
  type?: string;
}

interface CustomerPaymentFormProps {
  paymentSale: CustomerLedgerSale;
  accounts: AccountOption[];
  creditBalance: number;
  formatCurrency: (n: number) => string;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  useCreditBalance: boolean;
  setUseCreditBalance: (v: boolean) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function CustomerPaymentForm({
  paymentSale,
  accounts,
  creditBalance,
  formatCurrency,
  paymentAmount,
  setPaymentAmount,
  paymentAccountId,
  setPaymentAccountId,
  paymentNotes,
  setPaymentNotes,
  useCreditBalance,
  setUseCreditBalance,
  isSubmitting,
  onCancel,
  onSubmit,
}: CustomerPaymentFormProps) {
  const t = useTranslations("customers.paymentForm");
  const tPayments = useTranslations("common.payments");
  const tActions = useTranslations("common.actions");
  return (
    <ScrollArea className="flex-1 px-6 overflow-y-auto">
      <div className="py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToLedger")}
        </Button>

        <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("invoice")}</span>
            <span className="font-mono font-medium">{paymentSale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("total")}</span>
            <span className="font-medium">{formatCurrency(paymentSale.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("paid")}</span>
            <span className="font-medium text-green-600">
              {formatCurrency(paymentSale.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("due")}</span>
            <span className="font-medium text-red-600">
              {formatCurrency(paymentSale.dueAmount)}
            </span>
          </div>
        </div>

        <Separator />

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
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cust-pay-amount">{tPayments("paymentAmount")}</Label>
            <NumberField
              id="cust-pay-amount"
              precision={2}
              min={0}
              max={
                useCreditBalance
                  ? Math.min(paymentSale.dueAmount, creditBalance)
                  : paymentSale.dueAmount
              }
              value={paymentAmount === "" ? null : Number(paymentAmount)}
              onChange={(v) => setPaymentAmount(v == null ? "" : String(v))}
              placeholder={tPayments("enterAmount")}
            />
          </div>

          {!useCreditBalance && (
            <div className="space-y-2">
              <Label htmlFor="cust-pay-account">{tPayments("paymentAccount")}</Label>
              <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                <SelectTrigger id="cust-pay-account">
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
            <Label htmlFor="cust-pay-notes">{t("notesOptional")}</Label>
            <Textarea
              id="cust-pay-notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {tActions("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={onSubmit}
              disabled={
                isSubmitting || !(Number(paymentAmount) > 0) || (!useCreditBalance && !paymentAccountId)
              }
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isSubmitting ? tPayments("processing") : tPayments("recordPayment")}
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
