"use client";

import React from "react";
import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Separator } from "@/ui/components/separator";
import { ClipboardList, CheckCircleIcon } from "lucide-react";
import { TaxSummaryLines } from "@/components/shared/tax-summary-lines";

type Props = {
  formatCurrency: (value: number) => string;
  sellersCount: number;
  totalItemCount: number;
  grandTotal: number;
  grandTax: number;
  grandAddedTax: number;
  grandIncludedTax: number;
  grandPaid: number;
  grandCreditApplied: number;
  grandDue: number;
  isAccountsEnabled: boolean;
  isPending: boolean;
  isDraftMode: boolean;
  isFinalizing: boolean;
  isSaving: boolean;
  onComplete: () => void;
  onSaveDraft: () => void;
};

export default function OrderSummary({
  formatCurrency,
  sellersCount,
  totalItemCount,
  grandTotal,
  grandTax,
  grandAddedTax,
  grandIncludedTax,
  grandPaid,
  grandCreditApplied,
  grandDue,
  isAccountsEnabled,
  isPending,
  isDraftMode,
  isFinalizing,
  isSaving,
  onComplete,
  onSaveDraft,
}: Props) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-20">
        <Card>
          <CardContent className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-base">Order Summary</h3>
            </div>

            {/* Seller count & item count */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Suppliers</span>
              <span className="tabular-nums">{sellersCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Items</span>
              <span className="tabular-nums">{totalItemCount}</span>
            </div>

            {/* Aggregate tax across suppliers (added on top + inclusive memo). */}
            <TaxSummaryLines
              show
              addedTax={grandAddedTax}
              includedTax={grandIncludedTax}
              taxTotal={grandTax}
              total={grandTotal}
              totalLabel="Grand Total"
              totalSize="lg"
              formatCurrency={formatCurrency}
            />

            <Separator />

            {/* Aggregate Payment Summary */}
            {isAccountsEnabled && (grandPaid > 0 || grandCreditApplied > 0) && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-semibold text-green-600 dark:text-green-500 tabular-nums">
                    {formatCurrency(grandPaid)}
                  </span>
                </div>
                {grandCreditApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credit Applied</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      −{formatCurrency(grandCreditApplied)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Due</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      grandDue > 0
                        ? "text-orange-600 dark:text-orange-500"
                        : "text-green-600 dark:text-green-500"
                    }`}
                  >
                    {formatCurrency(grandDue)}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            {/* Complete Order Button */}
            <Button
              onClick={onComplete}
              disabled={isPending || isFinalizing || sellersCount === 0}
              size="lg"
              className="w-full font-semibold"
            >
              <CheckCircleIcon className="h-5 w-5" />
              {isPending || isFinalizing
                ? "Processing..."
                : isDraftMode
                ? "Finalize Order"
                : "Complete Order"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isPending || isSaving || sellersCount === 0}
              size="lg"
              className="w-full font-semibold mt-2"
            >
              {isSaving ? "Saving..." : isDraftMode ? "Update Draft" : "Save as Draft"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
