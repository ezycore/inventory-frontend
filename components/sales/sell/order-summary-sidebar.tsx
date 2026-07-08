"use client";

import { CheckCircleIcon, ClipboardList, Save, WalletIcon } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import DynamicForm from "@/ui/components/form";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import { Separator } from "@/ui/components/separator";
import { Switch } from "@/ui/components/switch";
import { formatCurrency } from "@/components/sales";
import { TaxSummaryLines } from "@/components/shared/tax-summary-lines";
import { PrintMenu } from "@/components/shared/print/print-menu";
import { EmailReceiptButton } from "@/components/sales/history/email-receipt-button";
import type { SellPageContext } from "./use-sell-page";

export function OrderSummarySidebar({ ctx }: { ctx: SellPageContext }) {
  const {
    paidAmount,
    localAdditionalDiscount,
    useCreditBalance,
    creditBalanceAmount,
    setUseCreditBalance,
    setCreditBalanceAmount,
    customerOutstandingDue,
    customerCreditBalance,
    itemsSubtotal,
    addedTax,
    includedTax,
    taxTotal,
    totalSalePrice,
    appliedCredit,
    dueAmount,
    showCustomerBalances,
    maxCreditApplicable,
    customerForm,
    paymentFormConfig,
    handleFieldChange,
    handleMarkAsSold,
    handleSaveAsDraft,
    handleAdditionalDiscountChange,
    lastCompletedSale,
    printLastReceipt,
    receiptDefaultPaper,
    items,
    isPending,
    isSavingDraft,
    isFinalizing,
    isDraftMode,
    isAccountsEnabled,
    symbol,
  } = ctx;

  return (
    <div className="sticky top-20">
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-base">Order Summary</h3>
          </div>

          {showCustomerBalances && (
            <div className="flex flex-wrap gap-2 -mt-1">
              {customerOutstandingDue > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                  Due: {formatCurrency(customerOutstandingDue)}
                </span>
              )}
              {customerCreditBalance > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <WalletIcon className="h-3 w-3" />
                  Credit: {formatCurrency(customerCreditBalance)}
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(itemsSubtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Additional Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-base text-muted-foreground">{symbol}</span>
              <NumberField
                precision={2}
                min={0}
                value={localAdditionalDiscount || null}
                onChange={(v) => handleAdditionalDiscountChange(v ?? 0)}
                placeholder="0"
                className="w-20 h-7 text-right text-sm"
              />
            </div>
          </div>

          <TaxSummaryLines
            show
            addedTax={addedTax}
            includedTax={includedTax}
            taxTotal={taxTotal}
            total={totalSalePrice}
            totalLabel="Total Amount"
            totalSize="lg"
            formatCurrency={formatCurrency}
          />

          <Separator />

          <DynamicForm
            form={customerForm}
            config={paymentFormConfig}
            onFieldChange={handleFieldChange}
            hideCancel
          />

          {isAccountsEnabled && customerCreditBalance > 0 && totalSalePrice > 0 && (
            <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="use-store-credit" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <WalletIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Use store credit
                </Label>
                <Switch
                  id="use-store-credit"
                  checked={useCreditBalance}
                  onCheckedChange={(checked) => {
                    setUseCreditBalance(checked);
                    if (!checked) setCreditBalanceAmount(0);
                    else setCreditBalanceAmount(maxCreditApplicable);
                  }}
                />
              </div>
              {useCreditBalance && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Available {formatCurrency(customerCreditBalance)}
                  </span>
                  <NumberField
                    precision={2}
                    min={0}
                    max={maxCreditApplicable}
                    value={creditBalanceAmount}
                    onChange={(next) =>
                      setCreditBalanceAmount(Math.max(0, Math.min(maxCreditApplicable, next ?? 0)))
                    }
                    className="w-28 h-8 text-right text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {isAccountsEnabled && (paidAmount > 0 || appliedCredit > 0) && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-semibold text-green-600 dark:text-green-500 tabular-nums">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
              {appliedCredit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Store credit applied</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    −{formatCurrency(appliedCredit)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due</span>
                <span
                  className={`font-semibold tabular-nums ${
                    dueAmount > 0
                      ? "text-orange-600 dark:text-orange-500"
                      : "text-green-600 dark:text-green-500"
                  }`}
                >
                  {formatCurrency(dueAmount)}
                </span>
              </div>
              {paidAmount > totalSalePrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Change</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatCurrency(paidAmount - totalSalePrice)}
                  </span>
                </div>
              )}
            </div>
          )}

          <Separator />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleMarkAsSold}
              disabled={isPending || isFinalizing || items.length === 0}
              size="lg"
              className="w-full font-semibold"
            >
              <CheckCircleIcon className="h-5 w-5" />
              {isPending || isFinalizing
                ? "Processing..."
                : isDraftMode
                  ? "Finalize Sale"
                  : "Confirm Order"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={isPending || isSavingDraft || items.length === 0}
              size="lg"
              className="w-full font-semibold"
            >
              <Save className="h-5 w-5" />
              {isSavingDraft
                ? "Saving..."
                : isDraftMode
                  ? "Update Draft"
                  : "Save as Draft"}
            </Button>
          </div>

          {/* Reprint the just-completed sale's receipt (hidden without the feature). */}
          {lastCompletedSale && (
            <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                Last sale · {lastCompletedSale.invoiceNumber}
              </span>
              <div className="flex items-center gap-2">
                <PrintMenu
                  appearance="solid"
                  a4Label="Invoice"
                  defaultPaper={receiptDefaultPaper}
                  onPrint={printLastReceipt}
                />
                <EmailReceiptButton sale={lastCompletedSale} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
