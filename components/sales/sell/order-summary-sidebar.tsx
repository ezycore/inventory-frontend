"use client";
// coding-standard: maintained
import { CheckCircleIcon, ClipboardList, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import DynamicForm from "@/ui/components/form";
import { NumberField } from "@/ui/components/number-field";
import { Separator } from "@/ui/components/separator";
import { formatCurrency } from "@/components/sales";
import { TaxSummaryLines } from "@/components/shared/tax-summary-lines";
import { CustomerBalanceChips } from "./customer-balance-chips";
import { LastSaleReceipt } from "./last-sale-receipt";
import { PaymentBreakdown } from "./payment-breakdown";
import { StoreCreditToggle } from "./store-credit-toggle";
import type { SellPageContext } from "./use-sell-page";

export function OrderSummarySidebar({ ctx }: { ctx: SellPageContext }) {
  const t = useTranslations("sales.sell.summary");
  const {
    localAdditionalDiscount,
    itemsSubtotal,
    addedTax,
    includedTax,
    taxTotal,
    totalSalePrice,
    customerForm,
    paymentFormConfig,
    handleFieldChange,
    handleMarkAsSold,
    handleSaveAsDraft,
    handleAdditionalDiscountChange,
    items,
    isPending,
    isSavingDraft,
    isFinalizing,
    isDraftMode,
    symbol,
  } = ctx;

  return (
    <div className="sticky top-20">
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-base">{t("orderSummary")}</h3>
          </div>

          <CustomerBalanceChips ctx={ctx} className="-mt-1" />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span className="tabular-nums">{formatCurrency(itemsSubtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">{t("additionalDiscount")}</span>
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
            totalLabel={t("totalAmount")}
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

          <StoreCreditToggle ctx={ctx} />
          <PaymentBreakdown ctx={ctx} />

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
                ? t("processing")
                : isDraftMode
                  ? t("finalizeSale")
                  : t("confirmOrder")}
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
                ? t("saving")
                : isDraftMode
                  ? t("updateDraft")
                  : t("saveAsDraft")}
            </Button>
          </div>

          {/* Reprint the just-completed sale's receipt (hidden without the feature). */}
          <LastSaleReceipt ctx={ctx} className="rounded-md border bg-muted/40 p-2.5" />
        </CardContent>
      </Card>
    </div>
  );
}
