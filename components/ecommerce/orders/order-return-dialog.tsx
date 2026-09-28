"use client";
// coding-standard: maintained
import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/ui/components/radio-group";
import { SimpleSelect } from "@/ui/components/simple-select";

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
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();

  const [open, setOpen] = useState(false);
  const [returnCharge, setReturnCharge] = useState<number | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number | null>(null);
  const [accountId, setAccountId] = useState("");
  const [refundMode, setRefundMode] = useState<"account" | "credit">("account");
  const [refundAccountId, setRefundAccountId] = useState("");

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
  const hasLegs = !!returnCharge || !!collectedAmount;

  const submit = () => {
    returnOrder.mutate(
      {
        id: order._id,
        // Guarded, not merely hidden: state can hold a value typed before the
        // feature was switched off mid-session, and the API accepts and drops
        // it silently rather than rejecting it.
        returnCharge: showLegs ? returnCharge ?? undefined : undefined,
        collectedAmount: showLegs ? collectedAmount ?? undefined : undefined,
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
          <DialogTitle>Return the whole order</DialogTitle>
          <DialogDescription>
            {stockTracked
              ? "Reverses the sale with a full return — stock is restocked and the goods refund is processed."
              // A return on a stock-free workspace moves money and nothing else:
              // there is no quantity to put back (QA-L3).
              : "Reverses the sale with a full return — the goods refund is processed."}{" "}
            This can&apos;t be undone.
            {/* Only where that button exists: it is offered on an unpaid COD
                order, because a part-refused parcel is a collection, not a
                return of everything. */}
            {!neverDispatched &&
            order.paymentMethod === "cod" &&
            order.paymentStatus !== "paid" ? (
              <>
                {" "}
                If only part of the parcel came back, use{" "}
                <b>Collected a different amount…</b> instead.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Goods refund (net)</span>
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
                <span className="text-muted-foreground">
                  Delivery kept (not refunded)
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {money(preview.shippingRetained)}
                </span>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {previewLoading
                ? "Working out what this return moves…"
                : needsRefundMode
                  ? // Says what is true of the MONEY rather than of the order.
                    // "The order is paid" was the old line, and it was wrong for
                    // the case that needs this most: a COD order with an advance
                    // is not paid, and the advance is exactly what needs routing.
                    `${money(preview?.refundRemainder ?? 0)} of this is money the shopper has already parted with — choose where it goes below.`
                  : preview?.refundToClearing
                    ? // Settled into the courier's account at delivery, then reported
                      // returned: the courier never collected it, so it comes back out.
                      "The courier reported this parcel returned, so this comes back out of their account — no shopper paid it and no cash moves."
                    : "This cancels what was unpaid; no cash moves."}
            </p>
          </div>

          {needsRefundMode && accountsEnabled && (
            <div className="space-y-2">
              <Label>Refund the paid amount</Label>
              <RadioGroup
                value={refundMode}
                onValueChange={(v) => setRefundMode(v as "account" | "credit")}
                className="gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="account" id="rm-account" />
                  <Label htmlFor="rm-account" className="font-normal">
                    Refund to an account (cash out)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="credit" id="rm-credit" />
                  <Label htmlFor="rm-credit" className="font-normal">
                    Store credit (customer balance)
                  </Label>
                </div>
              </RadioGroup>
              {refundMode === "account" && accountOptions.length > 0 && (
                <SimpleSelect
                  value={refundAccountId}
                  onValueChange={setRefundAccountId}
                  options={accountOptions}
                  placeholder="Refund from account (default)"
                />
              )}
            </div>
          )}

          {/*
            Both of these become Transactions, and the service writes neither
            without `accounts` — `storefront-order-money.service.ts` wraps the
            whole money step in `if (accountsOn)`. The order model holds only
            `rtoChargeTxnId`, a pointer to that Transaction, and no amount field
            of its own, so with accounts off the figure has nowhere to land.

            Rendering the inputs anyway meant the merchant typed what they paid
            the courier, saved, and lost it: no transaction, no field, no
            warning. The refund-account picker below was already gated for the
            same reason; these two were simply missed.
          */}
          {showLegs && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Return courier charge</Label>
              <NumberField
                value={returnCharge}
                onChange={setReturnCharge}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Collected at door</Label>
              <NumberField
                value={collectedAmount}
                onChange={setCollectedAmount}
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </div>
          </div>
          )}

          {showLegs && accountOptions.length > 0 && hasLegs ? (
            <div className="space-y-1.5">
              <Label>Account for the return charge / collection</Label>
              <SimpleSelect
                value={accountId}
                onValueChange={setAccountId}
                options={accountOptions}
                placeholder="Account (default)"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={returnOrder.isPending}
            onClick={submit}
          >
            {returnOrder.isPending ? "Processing…" : "Process return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
