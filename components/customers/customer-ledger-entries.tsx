"use client";
// coding-standard: maintained

import { formatInTimeZone } from "date-fns-tz";
import { getOrgTimezone } from "@/hooks/use-org-calendar";
import { useTranslations } from "next-intl";
import {
  CreditCard,
  Receipt,
  RefreshCw,
  Undo2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { ScrollArea } from "@/ui/components/scroll-area";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";
import type {
  CustomerLedgerInboundCredit,
  CustomerLedgerPayment,
  CustomerLedgerReturn,
  CustomerLedgerSale,
} from "@/types";
import type { CustomerLedgerReceiptGroup } from "./group-ledger-payments";
import { LedgerReceiptEntry } from "./ledger-receipt-entry";

/** Status → badge variant + `customers.ledger.status*` message key. */
const statusConfig: Record<
  string,
  { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { labelKey: "statusDraft", variant: "secondary" },
  partial: { labelKey: "statusPartial", variant: "outline" },
  paid: { labelKey: "statusPaid", variant: "default" },
  cancelled: { labelKey: "statusCancelled", variant: "destructive" },
};

export type LedgerEntry =
  | { type: "sale"; data: CustomerLedgerSale; date: Date }
  | { type: "payment"; data: CustomerLedgerPayment; date: Date }
  | { type: "receipt"; data: CustomerLedgerReceiptGroup; date: Date }
  | { type: "return"; data: CustomerLedgerReturn; date: Date }
  | { type: "inboundCredit"; data: CustomerLedgerInboundCredit; date: Date };

interface CustomerLedgerEntriesProps {
  isLoading: boolean;
  isAccountsEnabled: boolean;
  ledgerEntries: LedgerEntry[];
  formatCurrency: (n: number) => string;
  onStartPayment: (sale: CustomerLedgerSale) => void;
  onOpenSale?: (saleId: string, invoiceNumber?: string) => void;
}

export function CustomerLedgerEntries({
  isLoading,
  isAccountsEnabled,
  ledgerEntries,
  formatCurrency,
  onStartPayment,
  onOpenSale,
}: CustomerLedgerEntriesProps) {
  const t = useTranslations("customers.ledger");
  return (
    <ScrollArea className="flex-1 px-6 overflow-y-auto">
      <div className="py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : ledgerEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t("noTransactions")}</p>
          </div>
        ) : (
          ledgerEntries.map((entry, index) => {
            const keyId =
              entry.type === "sale"
                ? entry.data._id
                : entry.type === "return"
                  ? entry.data._id
                  : entry.type === "inboundCredit"
                    ? entry.data.returnId
                    : entry.type === "receipt"
                      ? entry.data.receiptNumber
                      : entry.data._id;
            return (
              <div
                key={`${entry.type}-${keyId}-${index}`}
                className="rounded-lg border p-4 space-y-2"
              >
                {entry.type === "sale" ? (
                  <SaleEntry
                    sale={entry.data}
                    date={entry.date}
                    isAccountsEnabled={isAccountsEnabled}
                    formatCurrency={formatCurrency}
                    onStartPayment={onStartPayment}
                    t={t}
                  />
                ) : entry.type === "inboundCredit" ? (
                  <InboundCreditEntry
                    data={entry.data}
                    date={entry.date}
                    formatCurrency={formatCurrency}
                    onOpenSale={onOpenSale}
                    t={t}
                  />
                ) : entry.type === "receipt" ? (
                  <LedgerReceiptEntry
                    data={entry.data}
                    date={entry.date}
                    formatCurrency={formatCurrency}
                    t={t}
                  />
                ) : entry.type === "return" ? (
                  <ReturnEntry
                    data={entry.data}
                    date={entry.date}
                    isAccountsEnabled={isAccountsEnabled}
                    formatCurrency={formatCurrency}
                    t={t}
                  />
                ) : entry.data.type === "salesRefund" ? (
                  <CashRefundEntry data={entry.data} date={entry.date} formatCurrency={formatCurrency} t={t} />
                ) : (
                  <PaymentEntry data={entry.data} date={entry.date} formatCurrency={formatCurrency} t={t} />
                )}
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}

function SaleEntry({
  sale,
  date,
  isAccountsEnabled,
  formatCurrency,
  onStartPayment,
  t,
}: {
  sale: CustomerLedgerSale;
  date: Date;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  onStartPayment: (sale: CustomerLedgerSale) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const online = sale.channel === "online";
  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{sale.invoiceNumber}</span>
          <Badge variant={statusConfig[sale.status]?.variant || "secondary"}>
            {statusConfig[sale.status] ? t(statusConfig[sale.status].labelKey) : sale.status}
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">{formatInTimeZone(date, getOrgTimezone(), "dd MMM yyyy")}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">{t("amount")}</span>{" "}
          <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
        </div>
        {isAccountsEnabled && (
          <>
            <div>
              <span className="text-muted-foreground">{t("paid")}</span>{" "}
              <span className="font-medium text-green-600">
                {formatCurrency(sale.paidAmount)}
              </span>
            </div>
            {/* An online sale's unpaid part is the courier's to collect — never a debt
                this customer owes, so it is not red and offers no "pay due". */}
            <div>
              <span className="text-muted-foreground">
                {online ? t("codPending") : t("due")}
              </span>{" "}
              <span
                className={cn(
                  "font-medium",
                  online
                    ? "text-muted-foreground"
                    : sale.dueAmount > 0
                      ? "text-red-600"
                      : "text-green-600",
                )}
              >
                {formatCurrency(sale.dueAmount)}
              </span>
            </div>
          </>
        )}
      </div>
      {isAccountsEnabled && !online && sale.dueAmount > 0 && sale.status !== "cancelled" && (
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => onStartPayment(sale)}
          >
            <CreditCard className="h-3.5 w-3.5" />
            {t("payDue")}
          </Button>
        </div>
      )}
    </>
  );
}

function InboundCreditEntry({
  data,
  date,
  formatCurrency,
  onOpenSale,
  t,
}: {
  data: CustomerLedgerInboundCredit;
  date: Date;
  formatCurrency: (n: number) => string;
  onOpenSale?: (saleId: string, invoiceNumber?: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Undo2 className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-600">{t("creditApplied")}</span>
        </div>
        <span className="text-sm text-muted-foreground">{formatInTimeZone(date, getOrgTimezone(), "dd MMM yyyy")}</span>
      </div>
      <div className="text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">{t("fromReturn")}</span>{" "}
          <span className="font-mono">{data.returnNumber}</span>
          {data.sourceInvoiceNumber && (
            <>
              {" "}
              <span className="text-muted-foreground">{t("saleOpenParen")}</span>{" "}
              {onOpenSale && data.sourceSaleId ? (
                <button
                  type="button"
                  onClick={() => onOpenSale(data.sourceSaleId, data.sourceInvoiceNumber)}
                  className="font-mono text-primary hover:underline"
                >
                  {data.sourceInvoiceNumber}
                </button>
              ) : (
                <span className="font-mono">{data.sourceInvoiceNumber}</span>
              )}
              <span className="text-muted-foreground">{t("closeParen")}</span>
            </>
          )}
        </div>
        {data.targetInvoiceNumber && (
          <div>
            <span className="text-muted-foreground">{t("appliedTo")}</span>{" "}
            {onOpenSale && data.targetSaleId ? (
              <button
                type="button"
                onClick={() => onOpenSale(data.targetSaleId, data.targetInvoiceNumber)}
                className="font-mono text-primary hover:underline"
              >
                {data.targetInvoiceNumber}
              </button>
            ) : (
              <span className="font-mono">{data.targetInvoiceNumber}</span>
            )}
          </div>
        )}
        <div>
          <span className="text-muted-foreground">{t("amount")}</span>{" "}
          <span className="font-medium text-blue-600">{formatCurrency(data.amount)}</span>
        </div>
      </div>
    </>
  );
}

function ReturnEntry({
  data,
  date,
  isAccountsEnabled,
  formatCurrency,
  t,
}: {
  data: CustomerLedgerReturn;
  date: Date;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-orange-600">{t("returnPrefix", { number: data.returnNumber })}</span>
        </div>
        <span className="text-sm text-muted-foreground">{formatInTimeZone(date, getOrgTimezone(), "dd MMM yyyy")}</span>
      </div>
      <div className="text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">{t("originalSale")}</span>{" "}
          <span>{data.invoiceNumber}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("refundAmount")}</span>{" "}
          <span className="font-medium text-orange-600">
            {formatCurrency(data.totalRefundAmount)}
          </span>
        </div>
        {isAccountsEnabled && data.refundedAmount > 0 && (
          <div>
            <span className="text-muted-foreground">{t("cashRefunded")}</span>{" "}
            <span className="font-medium text-red-600">
              {formatCurrency(data.refundedAmount)}
            </span>
          </div>
        )}
        {isAccountsEnabled && (data.refundAllocation?.adjustSaleDue ?? 0) > 0 && (
          <div>
            <span className="text-muted-foreground">{t("dueAdjusted")}</span>{" "}
            <span className="font-medium text-blue-600">
              {formatCurrency(data.refundAllocation!.adjustSaleDue!)}
            </span>
          </div>
        )}
        {(data.refundAllocation?.customerCredit?.amount ?? 0) > 0 && (
          <div>
            <span className="text-muted-foreground">{t("creditAdded")}</span>{" "}
            <span className="font-medium text-green-600">
              +{formatCurrency(data.refundAllocation!.customerCredit!.amount)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function CashRefundEntry({
  data,
  date,
  formatCurrency,
  t,
}: {
  data: CustomerLedgerPayment;
  date: Date;
  formatCurrency: (n: number) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-red-600" />
          <span className="font-medium text-red-600">{t("cashRefundIssued")}</span>
        </div>
        <span className="text-sm text-muted-foreground">{formatInTimeZone(date, getOrgTimezone(), "dd MMM yyyy")}</span>
      </div>
      <div className="text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">{t("amount")}</span>{" "}
          <span className="font-medium text-red-600">{formatCurrency(data.amount)}</span>
        </div>
        {data.referenceId && (
          <div>
            <span className="text-muted-foreground">{t("invoice")}</span>{" "}
            <span>{data.referenceId.invoiceNumber}</span>
          </div>
        )}
        {data.accountId && (
          <div>
            <span className="text-muted-foreground">{t("account")}</span>{" "}
            <span>{data.accountId.name}</span>
          </div>
        )}
      </div>
    </>
  );
}

function PaymentEntry({
  data,
  date,
  formatCurrency,
  t,
}: {
  data: CustomerLedgerPayment;
  date: Date;
  formatCurrency: (n: number) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">{t("paymentReceived")}</span>
        </div>
        <span className="text-sm text-muted-foreground">{formatInTimeZone(date, getOrgTimezone(), "dd MMM yyyy")}</span>
      </div>
      <div className="text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">{t("amount")}</span>{" "}
          <span className="font-medium text-green-600">{formatCurrency(data.amount)}</span>
        </div>
        {data.referenceId && (
          <div>
            <span className="text-muted-foreground">{t("invoice")}</span>{" "}
            <span>{data.referenceId.invoiceNumber}</span>
          </div>
        )}
        {data.accountId && (
          <div>
            <span className="text-muted-foreground">{t("account")}</span>{" "}
            <span>{data.accountId.name}</span>
          </div>
        )}
      </div>
    </>
  );
}
