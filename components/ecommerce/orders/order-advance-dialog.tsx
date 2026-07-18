"use client";
// coding-standard: maintained
import { useState } from "react";
import { useRecordAdvance, type AdminStorefrontOrder } from "@/services/api";
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
 * Record a COD delivery-charge advance — cash the merchant collects before
 * shipping. It's booked as `shipping` income now, and later shrinks both the
 * courier's COD leg and the shipping income posted at mark-paid, so it's never
 * double-counted. Capped at the order's shipping charge (the backend enforces the
 * same bound, throwing `ADVANCE_INVALID_AMOUNT`); the "COD to collect" preview
 * shows what the door collection drops to. Rendered only for pre-dispatch,
 * unpaid, delivery orders — the same window the backend allows.
 */
export function OrderAdvanceDialog({
  order,
  trigger,
}: {
  order: AdminStorefrontOrder;
  trigger: React.ReactNode;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const recordAdvance = useRecordAdvance();
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [accountId, setAccountId] = useState("");

  const shippingCharged = order.shippingCharged ?? 0;
  const money = (n: number) => formatMoney(n, currency);
  // What the courier collects at the door after this advance (mirrors the
  // backend's `createConsignment` codAmount = max(0, total − advance)).
  const codToCollect = Math.max(0, (order.totalAmount ?? 0) - (amount ?? 0));
  const overCap = (amount ?? 0) > shippingCharged;

  const submit = () => {
    if (!amount || amount <= 0 || overCap) return;
    recordAdvance.mutate(
      { id: order._id, amount, accountId: accountId || undefined },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record delivery-charge advance</DialogTitle>
          <DialogDescription>
            Cash collected up front toward the delivery charge. It&apos;s booked as
            shipping income now and deducted from the COD collected at the door.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Advance amount</Label>
            <NumberField
              value={amount}
              onChange={setAmount}
              min={0}
              max={shippingCharged}
              precision={2}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Up to the shipping charge of {money(shippingCharged)}.
            </p>
            {overCap && (
              <p className="text-xs font-medium text-red-600">
                Can&apos;t exceed the shipping charge ({money(shippingCharged)}).
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
              <span className="tabular-nums">{money(order.totalAmount ?? 0)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Advance now</span>
              <span className="tabular-nums">−{money(amount ?? 0)}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t pt-1.5 font-semibold">
              <span>COD to collect at door</span>
              <span className="tabular-nums">{money(codToCollect)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!amount || amount <= 0 || overCap || recordAdvance.isPending}
            onClick={submit}
          >
            {recordAdvance.isPending ? "Recording…" : "Record advance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
