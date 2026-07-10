"use client";

import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Button } from "@/ui/components/button";
import {
  useAccounts,
  useAddSalePayment,
  useCustomerLedger,
  useCustomerStatement,
} from "@/services/api";
import { useAuthStore } from "@/services/stores";
import { useCurrency } from "@/lib/currency";
import { PrintMenu } from "@/components/shared/print/print-menu";
import {
  orgToPrintHeader,
  printStatement,
  resolveDefaultPaper,
  type PaperSize,
} from "@/utils/print-documents";
import type {
  AddPaymentDto,
  Customer,
  CustomerLedgerSale,
} from "@/types";
import { CustomerLedgerEntries, type LedgerEntry } from "./customer-ledger-entries";
import { EmailStatementButton } from "./email-statement-button";
import { CustomerLedgerSummary } from "./customer-ledger-summary";
import { CustomerPaymentForm } from "./customer-payment-form";

interface CustomerLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  isAccountsEnabled: boolean;
  onOpenSale?: (saleId: string, invoiceNumber?: string) => void;
}

export function CustomerLedgerSheet({
  open,
  onOpenChange,
  customer,
  isAccountsEnabled,
  onOpenSale,
}: CustomerLedgerSheetProps) {
  const { format: formatCurrency } = useCurrency();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const limit = 20;

  const [paymentSale, setPaymentSale] = useState<CustomerLedgerSale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [useCreditBalance, setUseCreditBalance] = useState(false);

  const { data: ledgerData, isLoading } = useCustomerLedger(customer?._id ?? null, {
    page,
    limit,
  });
  const { data: accountsData } = useAccounts(
    isAccountsEnabled ? { status: "active", limit: 100 } : undefined,
  );
  // Pre-fetch the account-wide statement while the sheet is open so the print
  // (below) runs synchronously in the click (avoids a popup-blocked async print).
  const { data: statementResp } = useCustomerStatement(
    customer?._id ?? null,
    {},
    open,
  );
  const statement = statementResp?.data;
  const addPaymentMutation = useAddSalePayment();

  const printStatementDoc = (paper: PaperSize) => {
    if (!statement) return false;
    return printStatement(
      {
        title: "Customer Statement",
        partyLabel: "Customer",
        partyName: statement.customer.name || customer?.name || "",
        partyPhone: statement.customer.phone || customer?.phone,
        transactions: statement.transactions,
        summary: [
          { label: "Total billed", value: statement.summary.totalBilled },
          { label: "Total paid", value: statement.summary.totalPaid },
          { label: "Total returned", value: statement.summary.totalReturned },
          { label: "Outstanding due", value: statement.summary.totalDue, strong: true },
          ...(statement.summary.creditBalance > 0
            ? [{ label: "Credit balance", value: statement.summary.creditBalance }]
            : []),
        ],
      },
      {
        paper,
        currency: formatCurrency,
        header: orgToPrintHeader(user?.organization),
      },
    );
  };

  const ledger = ledgerData?.data;
  const sales = ledger?.sales || [];
  const payments = ledger?.payments || [];
  const returns = ledger?.returns || [];
  const inboundCredits = ledger?.inboundCredits || [];
  const creditBalance = ledger?.creditBalance ?? customer?.creditBalance ?? 0;
  const accounts =
    (accountsData as { items?: { _id: string; name: string; type?: string }[] })?.items ?? [];

  const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const totalDue = sales.reduce((sum, sale) => sum + sale.dueAmount, 0);
  const totalRefunded = returns.reduce((sum, r) => sum + (r.refundedAmount ?? 0), 0);
  const totalRefundCredit = returns.reduce(
    (sum, r) => sum + Math.max(0, (r.totalRefundAmount ?? 0) - (r.refundedAmount ?? 0)),
    0,
  );

  const handleStartPayment = (sale: CustomerLedgerSale) => {
    setPaymentSale(sale);
    setPaymentAmount(sale.dueAmount.toFixed(2));
    setPaymentAccountId("");
    setPaymentNotes("");
    setUseCreditBalance(false);
  };

  const handleCancelPayment = () => {
    setPaymentSale(null);
    setPaymentAmount("");
    setPaymentAccountId("");
    setPaymentNotes("");
    setUseCreditBalance(false);
  };

  const handleSubmitPayment = async () => {
    if (!paymentSale) return;
    if (!useCreditBalance && !paymentAccountId) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      const payload: AddPaymentDto & { saleId: string } = useCreditBalance
        ? {
            saleId: paymentSale._id,
            amount,
            useCreditBalance: true,
            notes: paymentNotes || undefined,
          }
        : {
            saleId: paymentSale._id,
            amount,
            accountId: paymentAccountId,
            notes: paymentNotes || undefined,
          };
      await addPaymentMutation.mutateAsync(payload);
      handleCancelPayment();
    } catch {
      // Error handled by mutation
    }
  };

  const ledgerEntries: LedgerEntry[] = [
    ...sales.map((sale) => ({
      type: "sale" as const,
      data: sale,
      date: new Date(sale.createdAt),
    })),
    ...payments.map((payment) => ({
      type: "payment" as const,
      data: payment,
      date: new Date(payment.createdAt),
    })),
    ...returns.map((returnItem) => ({
      type: "return" as const,
      data: returnItem,
      date: new Date(returnItem.createdAt),
    })),
    ...inboundCredits.map((credit) => ({
      type: "inboundCredit" as const,
      data: credit,
      date: new Date(credit.date),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[550px] sm:max-w-[550px] flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {paymentSale
                  ? `Pay — ${paymentSale.invoiceNumber}`
                  : `Customer Ledger - ${customer?.name}`}
              </SheetTitle>
              <SheetDescription>
                {paymentSale
                  ? "Record a payment for this sale"
                  : "Transaction history and account summary"}
              </SheetDescription>
            </div>
            {!paymentSale && statement && customer && (
              <div className="flex items-center gap-2">
                <PrintMenu
                  appearance="solid"
                  a4Label="Statement"
                  defaultPaper={resolveDefaultPaper(user?.organization)}
                  onPrint={printStatementDoc}
                />
                <EmailStatementButton
                  customer={customer}
                  totalDue={statement.summary.totalDue}
                />
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <CustomerLedgerSummary
            isAccountsEnabled={isAccountsEnabled}
            isLoading={isLoading}
            totalPaid={totalPaid}
            totalDue={totalDue}
            totalRefunded={totalRefunded}
            totalRefundCredit={totalRefundCredit}
            creditBalance={creditBalance}
            formatCurrency={formatCurrency}
          />

          {paymentSale ? (
            <CustomerPaymentForm
              paymentSale={paymentSale}
              accounts={accounts}
              creditBalance={creditBalance}
              formatCurrency={formatCurrency}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              paymentAccountId={paymentAccountId}
              setPaymentAccountId={setPaymentAccountId}
              paymentNotes={paymentNotes}
              setPaymentNotes={setPaymentNotes}
              useCreditBalance={useCreditBalance}
              setUseCreditBalance={setUseCreditBalance}
              isSubmitting={addPaymentMutation.isPending}
              onCancel={handleCancelPayment}
              onSubmit={handleSubmitPayment}
            />
          ) : (
            <>
              <CustomerLedgerEntries
                isLoading={isLoading}
                isAccountsEnabled={isAccountsEnabled}
                ledgerEntries={ledgerEntries}
                formatCurrency={formatCurrency}
                onStartPayment={handleStartPayment}
                onOpenSale={onOpenSale}
              />

              {ledger && ledger.totalPages > 1 && (
                <div className="px-6 py-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {ledger.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!ledger.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!ledger.hasNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
