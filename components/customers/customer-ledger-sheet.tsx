"use client";
// coding-standard: maintained

import { ChevronLeft, ChevronRight, FileText, HandCoins } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/config";
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
  useCustomerOutstanding,
  useCustomerStatement,
  useReceiveCustomerPayment,
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
  ReceiveCustomerPaymentDto,
} from "@/types";
import { CustomerLedgerEntries, type LedgerEntry } from "./customer-ledger-entries";
import { EmailStatementButton } from "./email-statement-button";
import { CustomerBulkPaymentForm } from "./customer-bulk-payment-form";
import { CustomerLedgerSummary } from "./customer-ledger-summary";
import { CustomerPaymentForm } from "./customer-payment-form";
import { groupLedgerPayments } from "./group-ledger-payments";

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
  const t = useTranslations("customers.ledger");
  const tBulk = useTranslations("customers.bulkPayment");
  const tStatement = useTranslations("common.statement");
  const tPrintDoc = useTranslations("common.printDoc");
  const locale = useLocale() as AppLocale;
  const { format: formatCurrency } = useCurrency();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const limit = 20;

  // "ledger" is the history; "invoice" pays one bill; "bulk" is a customer-level
  // receipt settling several invoices at once.
  const [mode, setMode] = useState<"ledger" | "invoice" | "bulk">("ledger");
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
  // Only fetched while the bulk form is open — it must reflect the dues as they
  // are at that moment, not a value cached from opening the sheet.
  const { data: outstandingResp, isLoading: isOutstandingLoading } =
    useCustomerOutstanding(customer?._id ?? null, mode === "bulk");
  const outstanding = outstandingResp?.data;
  const addPaymentMutation = useAddSalePayment();
  const receivePaymentMutation = useReceiveCustomerPayment();

  const printStatementDoc = (paper: PaperSize) => {
    if (!statement) return false;
    return printStatement(
      {
        title: t("statementTitle"),
        partyLabel: t("statementPartyLabel"),
        partyName: statement.customer.name || customer?.name || "",
        partyPhone: statement.customer.phone || customer?.phone,
        transactions: statement.transactions,
        summary: [
          { label: tStatement("totalBilled"), value: statement.summary.totalBilled },
          { label: tStatement("totalPaid"), value: statement.summary.totalPaid },
          { label: tStatement("totalReturned"), value: statement.summary.totalReturned },
          { label: tStatement("outstandingDue"), value: statement.summary.totalDue, strong: true },
          ...(statement.summary.creditBalance > 0
            ? [{ label: tStatement("creditBalance"), value: statement.summary.creditBalance }]
            : []),
        ],
      },
      {
        paper,
        currency: formatCurrency,
        header: orgToPrintHeader(user?.organization),
        t: tPrintDoc,
        locale,
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
    setMode("invoice");
    setPaymentSale(sale);
    setPaymentAmount(sale.dueAmount.toFixed(2));
    setPaymentAccountId("");
    setPaymentNotes("");
    setUseCreditBalance(false);
  };

  const handleCancelPayment = () => {
    setMode("ledger");
    setPaymentSale(null);
    setPaymentAmount("");
    setPaymentAccountId("");
    setPaymentNotes("");
    setUseCreditBalance(false);
  };

  const handleReceivePayment = async (data: ReceiveCustomerPaymentDto) => {
    if (!customer) return;
    try {
      await receivePaymentMutation.mutateAsync({ customerId: customer._id, ...data });
      setMode("ledger");
    } catch {
      // Error handled by mutation
    }
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

  // A multi-invoice receipt writes one payment row per invoice; the ledger shows
  // it as the single handover it was.
  const { singles: singlePayments, receipts } = groupLedgerPayments(payments);

  const ledgerEntries: LedgerEntry[] = [
    ...sales.map((sale) => ({
      type: "sale" as const,
      data: sale,
      date: new Date(sale.createdAt),
    })),
    ...singlePayments.map((payment) => ({
      type: "payment" as const,
      data: payment,
      date: new Date(payment.createdAt),
    })),
    ...receipts.map((receipt) => ({
      type: "receipt" as const,
      data: receipt,
      date: new Date(receipt.createdAt),
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
          {/* Title first, actions on their own row: three action buttons plus the
              title never fit side-by-side in the 550px sheet, and side-by-side
              squeezed the title to one word per line. */}
          <div className="space-y-1 pr-8">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 shrink-0" />
              {mode === "invoice" && paymentSale
                ? `Pay — ${paymentSale.invoiceNumber}`
                : mode === "bulk"
                  ? `${tBulk("receivePaymentTitle")} — ${customer?.name}`
                  : `Customer Ledger - ${customer?.name}`}
            </SheetTitle>
            <SheetDescription>
              {mode === "invoice"
                ? "Record a payment for this sale"
                : mode === "bulk"
                  ? tBulk("receivePaymentDescription")
                  : "Transaction history and account summary"}
            </SheetDescription>
          </div>
          {mode === "ledger" && statement && customer && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {isAccountsEnabled && statement.summary.totalDue > 0 && (
                <Button
                  size="sm"
                  className="gap-1 whitespace-nowrap"
                  onClick={() => setMode("bulk")}
                >
                  <HandCoins className="h-4 w-4" />
                  {tBulk("receivePayment")}
                </Button>
              )}
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

          {mode === "bulk" ? (
            <CustomerBulkPaymentForm
              sales={outstanding?.sales ?? []}
              totalDue={outstanding?.totalDue ?? 0}
              creditBalance={outstanding?.creditBalance ?? creditBalance}
              accounts={accounts}
              formatCurrency={formatCurrency}
              isLoading={isOutstandingLoading}
              isSubmitting={receivePaymentMutation.isPending}
              onCancel={() => setMode("ledger")}
              onSubmit={handleReceivePayment}
            />
          ) : mode === "invoice" && paymentSale ? (
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
                    {t("page", { page, totalPages: ledger.totalPages })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!ledger.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!ledger.hasNext}
                    >
                      {t("next")}
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
