"use client";
// coding-standard: maintained
import { useId, useState } from "react";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CheckCircleIcon, Save } from "lucide-react";
import { formatCurrency } from "@/components/sales";
import { PaymentBreakdown } from "@/components/sales/sell/payment-breakdown";
import { StoreCreditToggle } from "@/components/sales/sell/store-credit-toggle";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import { TaxSummaryLines } from "@/components/shared/tax-summary-lines";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { Separator } from "@/ui/components/separator";
import { Textarea } from "@/ui/components/textarea";
import { PosKbd } from "./pos-kbd";
import { PosPaymentMethods } from "./pos-payment-methods";

/**
 * The counter's money column — New Sale's Order Summary, field for field:
 * subtotal, additional discount, VAT lines, total; payment method, paid
 * amount, store credit; Paid / Due / Change; notes; Confirm and Draft. Every
 * value and handler comes from `useSellPage`, so the sale it posts is the one
 * New Sale would post.
 */
export function PosCheckoutPanel({ ctx }: { ctx: SellPageContext }) {
  const t = useTranslations("sales.sell.summary");
  const tForm = useTranslations("sales.sell.form");
  const tPos = useTranslations("sales.pos");
  const paidId = useId();
  const notesId = useId();
  const notes = useWatch({ control: ctx.customerForm.control, name: "notes" }) ?? "";
  const [notesOpen, setNotesOpen] = useState(false);
  const {
    itemsSubtotal,
    localAdditionalDiscount,
    handleAdditionalDiscountChange,
    addedTax,
    includedTax,
    taxTotal,
    totalSalePrice,
    isAccountsEnabled,
    paidAmount,
    customerForm,
    handleFieldChange,
    handleMarkAsSold,
    handleSaveAsDraft,
    items,
    isPending,
    isSavingDraft,
    isFinalizing,
    isDraftMode,
    symbol,
  } = ctx;

  const setPaid = (value: number | null) => {
    customerForm.setValue("paidAmount", value ?? 0);
    handleFieldChange("paidAmount", value ?? 0);
  };
  const setNotes = (value: string) => {
    customerForm.setValue("notes", value);
    handleFieldChange("notes", value);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="tabular-nums">{formatCurrency(itemsSubtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("additionalDiscount")}</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{symbol}</span>
            <NumberField
              precision={2}
              min={0}
              value={localAdditionalDiscount || null}
              onChange={(v) => handleAdditionalDiscountChange(v ?? 0)}
              placeholder="0"
              className="h-8 w-24 text-right text-sm"
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
      </div>

      <Separator />

      {isAccountsEnabled && (
        <>
          <PosPaymentMethods ctx={ctx} />
          <div className="space-y-1.5">
            <Label htmlFor={paidId}>{tForm("paidAmount")}</Label>
            <NumberField
              id={paidId}
              precision={2}
              min={0}
              value={paidAmount}
              onChange={setPaid}
              placeholder="0.00"
              className="h-11 text-right text-lg font-semibold tabular-nums"
            />
          </div>
          <StoreCreditToggle ctx={ctx} />
          <PaymentBreakdown ctx={ctx} emphasizeChange />
        </>
      )}

      {notesOpen || notes ? (
        <div className="space-y-1.5">
          <Label htmlFor={notesId}>{tForm("notes")}</Label>
          <Textarea
            id={notesId}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tForm("addNotes")}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="link"
          className="h-auto self-start p-0 text-sm"
          onClick={() => setNotesOpen(true)}
        >
          + {tPos("addNote")}
        </Button>
      )}

      <div className="grid grid-cols-[2fr_3fr] gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleSaveAsDraft}
          disabled={isPending || isSavingDraft || items.length === 0}
          className="h-12 font-semibold"
        >
          <Save className="size-4" />
          <span className="truncate">
            {isSavingDraft ? t("saving") : isDraftMode ? t("updateDraft") : t("saveAsDraft")}
          </span>
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleMarkAsSold}
          disabled={isPending || isFinalizing || items.length === 0}
          className="h-12 text-base font-semibold"
        >
          <CheckCircleIcon className="size-5" />
          <span className="truncate">
            {isPending || isFinalizing
              ? t("processing")
              : isDraftMode
                ? t("finalizeSale")
                : t("confirmOrder")}
          </span>
          <PosKbd className="hidden border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground lg:inline-flex">
            F8
          </PosKbd>
        </Button>
      </div>
    </div>
  );
}
