"use client";

import { format } from "date-fns";
import { CreditCard, Wallet } from "lucide-react";
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
}: PaymentHistoryListProps) {
  const showAddButton =
    canAddPayment && doc.dueAmount > 0 && doc.status !== "cancelled" && !isInPaymentMode;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-medium">Payment History</div>
        {showAddButton && (
          <Button variant="outline" size="sm" onClick={onAddPayment}>
            <CreditCard className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        )}
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        emptyState ?? (
          <div className="py-8 text-center text-muted-foreground">
            <Wallet className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>No payments recorded yet</p>
          </div>
        )
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
                    {format(new Date(payment.createdAt), "dd MMM yyyy HH:mm")}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {payment.paymentMethod}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-3 w-3" />
                {payment.accountName || "Unknown Account"}
              </div>

              {payment.notes && (
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
