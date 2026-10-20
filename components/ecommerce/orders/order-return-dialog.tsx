"use client";
// coding-standard: maintained
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useOrderReturnPreview,
  useReturnOrder,
  type AdminStorefrontOrder,
} from "@/services/api";
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
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { OrderRefundDestination, type RefundMode } from "./order-refund-destination";

/**
 * Return (RTO / post-delivery) a committed delivery order. It reverses the sale
 * with a full Sales Return (restock + goods refund) and books the courier return
 * legs.
 *
 * **Every figure here comes from the server**, through `useOrderReturnPreview`.
 * This screen used to work them out itself — the refund as
 * `subtotal - discountAmount` off the ORDER, and whether to offer a refund
 * destination from `order.paymentStatus === "paid"` — while `returnOrder`
 * computed the refund from the SALE's lines and asked whether it overshoots the
 * Sale's outstanding due.
 *
 * Those are different questions, and a COD order carrying an advance answers
 * them differently: nobody has collected the balance, so the order reads
 * unpaid and no destination was offered, while the Sale is part-paid so the
 * refund overshoots the due by exactly the advance and the server refused
 * without one. The return was impossible — and COD-with-advance is the ordinary
 * f-commerce order, not an edge case.
 */
export function OrderReturnDialog({
  order,
  trigger,
}: {
  order: AdminStorefrontOrder;
  trigger: React.ReactNode;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const stockTracked = useStockTracked();
  const returnOrder = useReturnOrder();
  const {
    accountsEnabled,
    options: accountOptions,
    defaultAccountId: defaultOrderAccountId,
  } = useOrderAccountOptions(order.paymentMethod);

  const t = useTranslations("ecommerce.wholeReturn");
  const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;
  const [open, setOpen] = useState(false);
  const [returnCharge, setReturnCharge] = useState<number | null>(null);
  // Starts from what the courier reported collecting on a refused parcel (a paid return), so the
  // merchant confirms the figure rather than having to find it in the courier's panel.
  const [collectedAmount, setCollectedAmount] = useState<number | null>(
    order.courier?.paidReturn ? (order.courier.collectedAmount ?? null) : null,
  );
  const [pickedAccountId, setAccountId] = useState("");
  const [refundMode, setRefundMode] = useState<RefundMode>("account");
  const [pickedRefundAccountId, setRefundAccountId] = useState("");
  // The merchant's pick, else the account this order's payment method maps to, else
  // the org default (`useOrderAccountOptions`).
  const accountId = pickedAccountId || defaultOrderAccountId;
  const refundAccountId = pickedRefundAccountId || defaultOrderAccountId;

  // Fetched only while the dialog is open — the preview reads the Sale, and an
  // order list has no business fetching one per row.
  const { data: preview, isLoading: previewLoading } = useOrderReturnPreview(
    order._id,
    open,
  );

  const netRefund = preview?.goodsRefund ?? 0;
  // The server's own question — "is there money the shopper has parted with?" —
  // not a proxy for it.
  const needsRefundMode = !!preview?.refundModeRequired;
  const money = (n: number) => formatMoney(n, currency);
  // Sale booked, courier booking failed: no parcel left, so there is no return
  // charge and nothing collected at a door — the server refuses both.
  const neverDispatched = order.status === "processing";
  const showLegs = accountsEnabled && !neverDispatched;
  // Money paid at the door is recorded in every mode (shadow test S22): it is a figure on
  // the order and on the courier's card, not only a ledger entry, so a custom courier's paid
  // return reaches the delivery margin with Cash & Bank off too.
  const showDoor = !neverDispatched && !!order.courier;

  const submit = () => {
    returnOrder.mutate(
      {
        id: order._id,
        // Guarded, not merely hidden: state can hold a value typed before the
        // feature was switched off mid-session, and the API accepts and drops
        // it silently rather than rejecting it.
        returnCharge: showLegs ? returnCharge ?? undefined : undefined,
        collectedAmount: showDoor ? collectedAmount ?? undefined : undefined,
        accountId: accountId || undefined,
        // Sent when the SERVER says money needs a destination, which is the
        // same test it will apply. Keyed off `paymentStatus` it was absent on
        // exactly the orders that needed it.
        refund: needsRefundMode
          ? {
              mode: refundMode,
              accountId:
                refundMode === "account"
                  ? refundAccountId || undefined
                  : undefined,
            }
          : undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {/* A return on a stock-free workspace moves money and nothing else: there is no
                quantity to put back (QA-L3). */}
            {t(stockTracked ? "bodyStock" : "body")}
            {/* Return items sits beside this button on every dispatched order. */}
            {!neverDispatched ? <> {t.rich("partHint", { b: bold })}</> : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* The courier said the customer kept part of it. Returning everything would reverse
              goods that were sold and paid for — found live on three UriiBaba orders. */}
          {order.courier?.partialDelivery && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {t.rich("partialDelivery", { b: bold })}
            </p>
          )}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("goodsRefund")}</span>
              <span className="font-semibold tabular-nums">
                {money(netRefund)}
              </span>
            </div>
            {/*
              Delivery is not refunded, and never was: the refund is the Sale's
              goods lines, and what the shopper paid to have the order delivered
              was earned when it was dispatched. Stated outright because the
              silence was the problem — a merchant looking at a ৳1,000 order and
              a ৳900 refund could not tell a deliberate exclusion from a bug.
            */}
            {!!preview?.shippingRetained && (
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-muted-foreground">{t("deliveryKept")}</span>
                <span className="tabular-nums text-muted-foreground">
                  {money(preview.shippingRetained)}
                </span>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {previewLoading
                ? t("working")
                : needsRefundMode
                  ? // Says what is true of the MONEY rather than of the order.
                    // "The order is paid" was the old line, and it was wrong for
                    // the case that needs this most: a COD order with an advance
                    // is not paid, and the advance is exactly what needs routing.
                    t("refundRequired", { amount: money(preview?.refundRemainder ?? 0) })
                  : preview?.refundToClearing
                    ? // Settled into the courier's account at delivery, then reported
                      // returned: the courier never collected it, so it comes back out.
                      t("toClearing")
                    : t("cancelsUnpaid")}
            </p>
          </div>

          {needsRefundMode && accountsEnabled && (
            <OrderRefundDestination
              idPrefix="rm-whole"
              mode={refundMode}
              onModeChange={setRefundMode}
              accountId={refundAccountId}
              onAccountChange={setRefundAccountId}
              accountOptions={accountOptions}
            />
          )}

          {/*
            The return charge becomes a Transaction and nothing else — the order
            holds only `rtoChargeTxnId` — so it is shown only with `accounts`;
            typed with the ledger off it would be saved nowhere.

            Money collected at the door is different since S22: the server keeps it
            on the order (`courier.collectedAmount`, `paidReturn`) and on the
            courier's card in every mode, and with the ledger on posts it to the
            courier's clearing account, never to a picked one. So it shows for any
            parcel that left with a courier, and the account picker is the charge's.
          */}
          {(showLegs || showDoor) && (
          <div className="grid grid-cols-2 gap-3">
            {showLegs && (
            <div className="space-y-1.5">
              <Label>{t("returnCharge")}</Label>
              <NumberField
                value={returnCharge}
                onChange={setReturnCharge}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </div>
            )}
            {showDoor && (
            <div className="space-y-1.5">
              <Label>{t("collectedAtDoor")}</Label>
              <NumberField
                value={collectedAmount}
                onChange={setCollectedAmount}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </div>
            )}
          </div>
          )}
          {showDoor && !!collectedAmount && (
            <p className="text-xs text-muted-foreground">{t("doorHint")}</p>
          )}

          {showLegs && accountOptions.length > 0 && !!returnCharge ? (
            <div className="space-y-1.5">
              <Label>{t("chargeAccount")}</Label>
              <SimpleSelect
                value={accountId}
                onValueChange={setAccountId}
                options={accountOptions}
                placeholder={t("accountDefault")}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={returnOrder.isPending}
            onClick={submit}
          >
            {returnOrder.isPending ? t("processing") : t("process")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
