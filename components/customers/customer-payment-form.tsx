"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/ui/components/button";
import { ScrollArea } from "@/ui/components/scroll-area";
import { Separator } from "@/ui/components/separator";
import type { CustomerLedgerSale } from "@/types";
import {
  PaymentSourceFields,
  type AccountOption,
} from "./payment-source-fields";

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

        <PaymentSourceFields
          idPrefix="cust-pay"
          accounts={accounts}
          creditBalance={creditBalance}
          formatCurrency={formatCurrency}
          maxAmount={paymentSale.dueAmount}
          amount={paymentAmount}
          setAmount={setPaymentAmount}
          accountId={paymentAccountId}
          setAccountId={setPaymentAccountId}
          notes={paymentNotes}
          setNotes={setPaymentNotes}
          useCreditBalance={useCreditBalance}
          setUseCreditBalance={setUseCreditBalance}
          disabled={isSubmitting}
        />

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
              isSubmitting ||
              !(Number(paymentAmount) > 0) ||
              (!useCreditBalance && !paymentAccountId)
            }
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isSubmitting ? tPayments("processing") : tPayments("recordPayment")}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
