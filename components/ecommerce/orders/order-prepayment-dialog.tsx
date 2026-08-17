"use client";
// coding-standard: maintained
import { useState } from "react";
import { useRecordPrepayment, type AdminStorefrontOrder } from "@/services/api";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
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

/**
 * Record money the shopper paid **before the order ships** — a delivery-charge
 * advance, or the whole order value on a bank transfer (the storefront sells bank
 * with no gateway, so this is where the merchant confirms the money arrived).
 *
 * Capped at the order total, which the backend enforces too
 * (`PREPAYMENT_INVALID_AMOUNT`). It shrinks what the courier collects at the door —
 * a full prepayment ships with no COD at all — and the preview below shows both the
 * split the ledger will book and the resulting door collection.
 *
 * Rendered only for pre-dispatch, unpaid delivery orders: the same window the
 * backend allows.
 */
export function OrderPrepaymentDialog({
  order,
  trigger,
}: {
  order: AdminStorefrontOrder;
  trigger: React.ReactNode;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const recordPrepayment = useRecordPrepayment();
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();

  const total = order.totalAmount ?? 0;
  const shippingCharged = order.shippingCharged ?? 0;
  // A bank order is prepaid in full by definition — that is what the shopper was
  // asked to transfer — so it opens on the total rather than an empty field.
  const [amount, setAmount] = useState<number | null>(
    order.paymentMethod === "bank" ? total : null,
  );
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");

  const money = (n: number) => formatMoney(n, currency);
  const entered = amount ?? 0;
  const overCap = entered > total;
  // The same split the backend books: delivery charge first, the rest against the
  // goods. Mirrors `recordPrepayment`'s shippingLeg / goodsLeg.
  const shippingLeg = Math.min(entered, shippingCharged);
  const goodsLeg = Math.max(0, entered - shippingLeg);
  // What the courier collects at the door afterwards (mirrors the backend's
  // `createConsignment` codAmount = max(0, total − prepaid)).
  const codToCollect = Math.max(0, total - entered);

  const submit = () => {
    if (!amount || amount <= 0 || overCap) return;
    recordPrepayment.mutate(
      { id: order._id, amount, accountId: accountId || undefined },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record prepayment</DialogTitle>
          <DialogDescription>
            Money collected before shipping — a delivery-charge advance, or a bank
            transfer for the whole order. It is deducted from what the courier
            collects at the door.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount received</Label>
            <NumberField
              value={amount}
              onChange={setAmount}
              min={0}
              max={total}
              precision={2}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Up to the order total of {money(total)}.
            </p>
            {overCap && (
              <p className="text-xs font-medium text-red-600">
                Can&apos;t exceed the order total ({money(total)}).
              </p>
            )}
          </div>

          {accountsEnabled && accountOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label>Receiving account</Label>
              <SimpleSelect
                value={accountId}
                onValueChange={setAccountId}
                options={accountOptions}
                placeholder="Receiving account (default)"
              />
            </div>
          )}

          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order total</span>
              <span className="tabular-nums">{money(total)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Received now</span>
              <span className="tabular-nums">−{money(entered)}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t pt-1.5 font-semibold">
              <span>COD to collect at door</span>
              <span className="tabular-nums">{money(codToCollect)}</span>
            </div>
            {/* How the ledger will file it. Shown only once the amount runs past the
                delivery charge, since below that the whole thing is the advance and
                a two-line split would be noise. */}
            {goodsLeg > 0 && (
              <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                Booked as {money(shippingLeg)} delivery charge and{" "}
                {money(goodsLeg)} toward the goods.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              !amount || amount <= 0 || overCap || recordPrepayment.isPending
            }
            onClick={submit}
          >
            {recordPrepayment.isPending ? "Recording…" : "Record prepayment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
