"use client";
// coding-standard: maintained
import { useState } from "react";
import { useReturnOrder, type AdminStorefrontOrder } from "@/services/api";
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
import { RadioGroup, RadioGroupItem } from "@/ui/components/radio-group";
import { SimpleSelect } from "@/ui/components/simple-select";

/**
 * Return (RTO / post-delivery) a committed delivery order. It reverses the sale
 * with a full Sales Return (restock + goods refund) and books the courier return
 * legs. The refund-mode picker appears **only when the order is already paid** — an
 * unpaid COD order's refund just clears the sale's due, so nothing needs routing.
 */
export function OrderReturnDialog({
  order,
  trigger,
}: {
  order: AdminStorefrontOrder;
  trigger: React.ReactNode;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const returnOrder = useReturnOrder();
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();

  const [open, setOpen] = useState(false);
  const [returnCharge, setReturnCharge] = useState<number | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number | null>(null);
  const [accountId, setAccountId] = useState("");
  const [refundMode, setRefundMode] = useState<"account" | "credit">("account");
  const [refundAccountId, setRefundAccountId] = useState("");

  const isPaid = order.paymentStatus === "paid";
  // What the backend refunds: goods net of the order's own discount (never > due).
  const netRefund = Math.max(0, (order.subtotal ?? 0) - (order.discountAmount ?? 0));
  const money = (n: number) => formatMoney(n, currency);
  const hasLegs = !!returnCharge || !!collectedAmount;

  const submit = () => {
    returnOrder.mutate(
      {
        id: order._id,
        returnCharge: returnCharge ?? undefined,
        collectedAmount: collectedAmount ?? undefined,
        accountId: accountId || undefined,
        refund: isPaid
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
          <DialogTitle>Return this order</DialogTitle>
          <DialogDescription>
            Reverses the sale with a full return — stock is restocked and the goods
            refund is processed. This can&apos;t be undone.
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
            <p className="mt-1 text-xs text-muted-foreground">
              {isPaid
                ? "The order is paid — choose how to return this amount below."
                : "The order is unpaid — this clears the outstanding due; no cash moves."}
            </p>
          </div>

          {isPaid && accountsEnabled && (
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

          {accountsEnabled && accountOptions.length > 0 && hasLegs ? (
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
