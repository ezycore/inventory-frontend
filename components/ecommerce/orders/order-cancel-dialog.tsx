"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCancelOrder, type AdminStorefrontOrder } from "@/services/api";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import { useStockTracked } from "@/hooks/use-stock-tracked";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@/ui/components/radio-group";
import { SimpleSelect } from "@/ui/components/simple-select";
import {
  rejectionReasonOptions,
  type RejectionReason,
} from "./helpers";
import { holdsReservedStock } from "./order-detail-helpers";

/**
 * Cancel or reject a pre-commit order (no Sale yet). Reserved stock is released
 * and any coupon usage is restored server-side. When a prepayment was recorded,
 * this adds the one decision the backend needs — refund it to the shopper (each
 * leg reversed out of the category it was booked into, order → `refunded`) or keep
 * it (default backend behaviour). With no prepayment it's a plain confirm, so the
 * refund section stays hidden. `reject` only swaps the wording — both route
 * through the same cancel endpoint.
 */
export function OrderCancelDialog({
  order,
  reject,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  order: AdminStorefrontOrder;
  reject?: boolean;
  /** Omitted when the caller drives the dialog with `open`/`onOpenChange`. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const tAll = useTranslations("ecommerce");
  const t = useTranslations("ecommerce.cancelDialog");
  const reasonOptions = useMemo(() => rejectionReasonOptions(tAll), [tAll]);
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const holdsStock = holdsReservedStock(order, useStockTracked());
  const cancel = useCancelOrder();
  const {
    accountsEnabled,
    options: accountOptions,
    defaultAccountId: defaultOrderAccountId,
  } = useOrderAccountOptions(order.paymentMethod);

  // Uncontrolled unless the caller passes `open` — a dropdown menu item cannot
  // host the trigger, because selecting it unmounts the item and the dialog with it.
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  // Fair default when a customer's order is cancelled: give the money back.
  const [choice, setChoice] = useState<"refund" | "keep">("refund");
  const [reason, setReason] = useState("");
  // What "Other" meant. Required with it — 56 of 78 rejections at one shop said "Other" and
  // nothing else, so the report could not say what to fix (G10).
  const [note, setNote] = useState("");
  const [pickedAccountId, setAccountId] = useState("");
  // The merchant's pick, else the account this order's payment method maps to, else
  // the org default (`useOrderAccountOptions`).
  const accountId = pickedAccountId || defaultOrderAccountId;
  const needsNote = reject && reason === "other" && !note.trim();

  const setOpen = (next: boolean) => {
    setOpenState(next);
    // Every answer is cleared on the way out, so the next order is asked from
    // scratch. The row menu keeps ONE of these mounted per row and reopens it,
    // so a reason picked and then dismissed used to reappear on the next order
    // with the action already enabled — one stray click away from booking a
    // reason nobody chose into the counts the field exists to produce. The money
    // answers go with it for the same reason: `keep` is not a default anyone
    // should inherit from the previous order.
    if (!next) {
      setReason("");
      setNote("");
      setChoice("refund");
      setAccountId("");
    }
    onOpenChange?.(next);
  };

  const prepaid = order.prepaidAmount ?? 0;
  const hasPrepayment = prepaid > 0;
  // The goods leg was booked as settlement against a Sale that will now never
  // exist, so keeping it leaves cash in the ledger that no P&L will ever see.
  const keptGoodsLeg = order.prepaidGoodsAmount ?? 0;
  const money = (n: number) => formatMoney(n, currency);

  const submit = () => {
    cancel.mutate(
      {
        id: order._id,
        reject,
        // Only ever on a rejection: the server refuses a reason on a plain
        // cancel, because a cancelled order records the merchant's own change of
        // mind and would poison the counts this field exists to produce.
        reason: reject ? (reason as RejectionReason) : undefined,
        note: reject && reason === "other" ? note.trim() : undefined,
        refundPrepayment: hasPrepayment ? choice === "refund" : undefined,
        accountId:
          hasPrepayment && choice === "refund"
            ? accountId || undefined
            : undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(reject ? "rejectTitle" : "cancelTitle")}</DialogTitle>
          <DialogDescription>
            {/* "Stock is released" only where this order holds some: not on a new
                order (reserved at confirm), not on a stock-free workspace (QA-N13). */}
            {t(reject ? "rejectBody" : holdsStock ? "cancelBodyStock" : "cancelBody")}
          </DialogDescription>
        </DialogHeader>

        {reject && (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">{t("whyReject")}</Label>
            <SimpleSelect
              value={reason}
              onValueChange={setReason}
              options={reasonOptions}
              placeholder={t("pickReason")}
              className="w-full"
            />
            {/* Required, and the button below stays disabled until it is
                answered. This is the only moment the answer is actually known,
                and a shop rejecting most of what it receives cannot tell fake
                numbers from stock-outs later without it. */}
            {reason === "other" && (
              <Input
                aria-label={t("otherReason")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={280}
                placeholder={t("otherReasonRequired")}
              />
            )}
            <p className="text-xs text-muted-foreground">{t("reportHint")}</p>
          </div>
        )}

        {hasPrepayment && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("prepaid")}</span>
                <span className="font-semibold tabular-nums">
                  {money(prepaid)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("moneyQuestion")}</Label>
              <RadioGroup
                value={choice}
                onValueChange={(v) => setChoice(v as "refund" | "keep")}
                className="gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="refund" id="prepaid-refund" />
                  <Label htmlFor="prepaid-refund" className="font-normal">
                    {t("refund", { amount: money(prepaid) })}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="keep" id="prepaid-keep" />
                  <Label htmlFor="prepaid-keep" className="font-normal">
                    {t("keep")}
                  </Label>
                </div>
              </RadioGroup>
              {choice === "keep" && keptGoodsLeg > 0 && (
                <p className="text-xs text-amber-700">
                  {t("keptGoods", { amount: money(keptGoodsLeg) })}
                </p>
              )}
              {choice === "refund" &&
                accountsEnabled &&
                accountOptions.length > 0 && (
                  <SimpleSelect
                    value={accountId}
                    onValueChange={setAccountId}
                    options={accountOptions}
                    placeholder={t("refundAccount")}
                  />
                )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("keepOrder")}
          </Button>
          <Button
            variant="destructive"
            disabled={cancel.isPending || (reject && !reason) || needsNote}
            onClick={submit}
          >
            {cancel.isPending
              ? t("processing")
              : reject
                ? t("rejectAction")
                : holdsStock
                  ? t("cancelReleaseAction")
                  : t("cancelAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
