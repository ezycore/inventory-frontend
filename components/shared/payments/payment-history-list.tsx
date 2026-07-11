"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { CreditCard, Printer, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import type { PaymentDoc } from "./types";

export interface PaymentHistoryItem {
  _id: string;
  amount: number;
  createdAt: string | Date;
  paymentMethod: string;
  accountName?: string;
  notes?: string;
}

interface PaymentHistoryListProps {
  doc: PaymentDoc;
  payments: PaymentHistoryItem[];
  isLoading: boolean;
  /** When `false`, hides the "Add Payment" button regardless of due. */
  canAddPayment: boolean;
  /** Hide the add button while the drawer is in payment-entry mode. */
  isInPaymentMode: boolean;
  formatCurrency: (n: number) => string;
  onAddPayment: () => void;
  /** Optional override for the empty-state node. */
  emptyState?: ReactNode;
  /**
   * When provided, each payment shows a Print button that prints a money receipt.
   * The parent owns the print (it has the populated counterparty / doc context)
   * and the feature gate — pass `undefined` to hide the button entirely.
   */
  onPrintReceipt?: (payment: PaymentHistoryItem) => void;
  /**
   * Render only the list content (no card, title or Add button) for embedding
   * inside a detail-sheet SectionFold, which supplies its own header/action.
   */
  bare?: boolean;
}

export function PaymentHistoryList({
  doc,
  payments,
  isLoading,
  canAddPayment,
  isInPaymentMode,
  formatCurrency,
  onAddPayment,
  emptyState,
  onPrintReceipt,
  bare = false,
}: PaymentHistoryListProps) {
  const t = useTranslations("common.payments");
  const showAddButton =
    canAddPayment && doc.dueAmount > 0 && doc.status !== "cancelled" && !isInPaymentMode;

  const content = (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        emptyState ??
        (bare ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            {t("noPayments")}
          </p>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Wallet className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>{t("noPayments")}</p>
          </div>
        ))
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment._id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-green-600">
                    +{formatCurrency(payment.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(payment.createdAt), "dd MMM yyyy hh:mm aa")}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="capitalize">
                    {payment.paymentMethod}
                  </Badge>
                  {onPrintReceipt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => onPrintReceipt(payment)}
                      aria-label={t("printReceipt")}
                      title={t("printReceipt")}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-3 w-3" />
                {payment.accountName || t("unknownAccount")}
              </div>

              {payment.notes && (
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (bare) return content;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-medium">{t("historyTitle")}</div>
        {showAddButton && (
          <Button variant="outline" size="sm" onClick={onAddPayment}>
            <CreditCard className="mr-2 h-4 w-4" />
            {t("addPayment")}
          </Button>
        )}
      </div>

      <Separator />

      {content}
    </div>
  );
}
