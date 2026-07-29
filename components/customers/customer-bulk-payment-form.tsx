"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, CreditCard, Wand2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { ScrollArea } from "@/ui/components/scroll-area";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";
import type {
  CustomerOutstandingSale,
  ReceiveCustomerPaymentDto,
} from "@/types";
import { PaymentAllocationTable } from "./payment-allocation-table";
import {
  PaymentSourceFields,
  type AccountOption,
} from "./payment-source-fields";
import { useBulkPaymentAllocation } from "./use-bulk-payment-allocation";

interface CustomerBulkPaymentFormProps {
  sales: CustomerOutstandingSale[];
  totalDue: number;
  creditBalance: number;
  accounts: AccountOption[];
  formatCurrency: (n: number) => string;
  isLoading: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (data: ReceiveCustomerPaymentDto) => void;
}

/**
 * Customer-level "Receive Payment": one amount, one receipt, many invoices.
 *
 * The per-invoice form (`CustomerPaymentForm`) still exists for paying a single
 * bill; this is the path for a customer settling their account.
 */
export function CustomerBulkPaymentForm({
  sales,
  totalDue,
  creditBalance,
  accounts,
  formatCurrency,
  isLoading,
  isSubmitting,
  onCancel,
  onSubmit,
}: CustomerBulkPaymentFormProps) {
  const t = useTranslations("customers.bulkPayment");
  const tForm = useTranslations("customers.paymentForm");
  const tPayments = useTranslations("common.payments");
  const tActions = useTranslations("common.actions");

  const [amount, setAmount] = useState(totalDue > 0 ? totalDue.toFixed(2) : "");
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [useCreditBalance, setUseCreditBalance] = useState(false);

  const numericAmount = Number(amount) || 0;
  const {
    allocations,
    isManual,
    unallocated,
    changeAllocation,
    resetToAuto,
    payload,
  } = useBulkPaymentAllocation(sales, numericAmount);

  const hasUnallocated = Math.abs(unallocated) > 0.01;
  const canSubmit =
    !isSubmitting &&
    numericAmount > 0 &&
    !hasUnallocated &&
    payload.length > 0 &&
    (useCreditBalance ? creditBalance >= numericAmount : !!accountId);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      amount: numericAmount,
      notes: notes || undefined,
      ...(useCreditBalance
        ? { useCreditBalance: true }
        : { accountId, paymentMethod: "cash" }),
      // An untouched split is exactly the server's oldest-first fill, so let it
      // re-derive against the live dues instead of pinning a stale preview.
      ...(isManual ? { autoAllocate: false, allocations: payload } : {}),
    });
  };

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
          {tForm("backToLedger")}
        </Button>

        <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("openInvoices")}</span>
            <span className="font-medium">{sales.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("totalOutstanding")}</span>
            <span className="font-medium text-red-600">{formatCurrency(totalDue)}</span>
          </div>
        </div>

        <Separator />

        <PaymentSourceFields
          idPrefix="cust-bulk-pay"
          accounts={accounts}
          creditBalance={creditBalance}
          formatCurrency={formatCurrency}
          maxAmount={totalDue}
          amount={amount}
          setAmount={setAmount}
          accountId={accountId}
          setAccountId={setAccountId}
          notes={notes}
          setNotes={setNotes}
          useCreditBalance={useCreditBalance}
          setUseCreditBalance={setUseCreditBalance}
          disabled={isSubmitting}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("allocation")}</span>
            {isManual && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={resetToAuto}
                disabled={isSubmitting}
              >
                <Wand2 className="h-3.5 w-3.5" />
                {t("autoAllocate")}
              </Button>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <PaymentAllocationTable
              sales={sales}
              allocations={allocations}
              onChangeAllocation={changeAllocation}
              formatCurrency={formatCurrency}
              disabled={isSubmitting}
            />
          )}

          <div
            className={cn(
              "flex justify-between text-sm px-1",
              hasUnallocated ? "text-red-600" : "text-muted-foreground",
            )}
          >
            <span>{unallocated < 0 ? t("overAllocated") : t("unallocated")}</span>
            <span className="font-medium">{formatCurrency(Math.abs(unallocated))}</span>
          </div>
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
          <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit}>
            <CreditCard className="h-4 w-4 mr-2" />
            {isSubmitting ? tPayments("processing") : t("receivePayment")}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
