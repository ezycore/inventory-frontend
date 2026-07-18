"use client";
// coding-standard: maintained
import { useState } from "react";
import { useCancelOrder, type AdminStorefrontOrder } from "@/services/api";
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
import { RadioGroup, RadioGroupItem } from "@/ui/components/radio-group";
import { SimpleSelect } from "@/ui/components/simple-select";

/**
 * Cancel or reject a pre-commit order (no Sale yet). Reserved stock is released
 * and any coupon usage is restored server-side. When a COD delivery-charge
 * advance was recorded, this adds the one decision the backend needs — refund it
 * to the shopper (books the reversing expense, order → `refunded`) or keep it
 * (default backend behaviour). With no advance it's a plain confirm, so the
 * refund section stays hidden. `reject` only swaps the wording — both route
 * through the same cancel endpoint.
 */
export function OrderCancelDialog({
  order,
  reject,
  trigger,
}: {
  order: AdminStorefrontOrder;
  reject?: boolean;
  trigger: React.ReactNode;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const cancel = useCancelOrder();
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();

  const [open, setOpen] = useState(false);
  // Fair default when a customer's order is cancelled: give the advance back.
  const [choice, setChoice] = useState<"refund" | "keep">("refund");
  const [accountId, setAccountId] = useState("");

  const advance = order.advanceAmount ?? 0;
  const hasAdvance = advance > 0;
  const money = (n: number) => formatMoney(n, currency);
  const verb = reject ? "Reject" : "Cancel";

  const submit = () => {
    cancel.mutate(
      {
        id: order._id,
        reject,
        refundAdvance: hasAdvance ? choice === "refund" : undefined,
        accountId:
          hasAdvance && choice === "refund" ? accountId || undefined : undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{verb} this order?</DialogTitle>
          <DialogDescription>
            {reject
              ? "The shopper is notified the order was rejected. "
              : "Reserved stock is released back to inventory. "}
            No sale has been booked yet. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        {hasAdvance && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Delivery-charge advance collected
                </span>
                <span className="font-semibold tabular-nums">
                  {money(advance)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>What happens to the advance?</Label>
              <RadioGroup
                value={choice}
                onValueChange={(v) => setChoice(v as "refund" | "keep")}
                className="gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="refund" id="adv-refund" />
                  <Label htmlFor="adv-refund" className="font-normal">
                    Refund {money(advance)} to the customer
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="keep" id="adv-keep" />
                  <Label htmlFor="adv-keep" className="font-normal">
                    Keep the advance
                  </Label>
                </div>
              </RadioGroup>
              {choice === "refund" &&
                accountsEnabled &&
                accountOptions.length > 0 && (
                  <SimpleSelect
                    value={accountId}
                    onValueChange={setAccountId}
                    options={accountOptions}
                    placeholder="Refund from account (advance account)"
                  />
                )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep order
          </Button>
          <Button
            variant="destructive"
            disabled={cancel.isPending}
            onClick={submit}
          >
            {cancel.isPending
              ? "Processing…"
              : reject
                ? "Reject order"
                : "Cancel & release stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
