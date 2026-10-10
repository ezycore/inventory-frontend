"use client";
// coding-standard: maintained
import { useState } from "react";
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
  REJECTION_REASON_OPTIONS,
  type RejectionReason,
} from "./helpers";

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
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const stockTracked = useStockTracked();
  const cancel = useCancelOrder();
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();

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
  const [accountId, setAccountId] = useState("");
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
  const verb = reject ? "Reject" : "Cancel";

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
          <DialogTitle>{verb} this order?</DialogTitle>
          <DialogDescription>
            {reject
              ? "The shopper is notified the order was rejected. "
              : stockTracked
                ? "Reserved stock is released back to inventory. "
                // Confirm reserved nothing on a stock-free workspace, so there
                // is no hold to give back (QA-N13). The half that stays true at
                // both tiers is the sentence below.
                : ""}
            This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        {reject && (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Why are you rejecting it?</Label>
            <SimpleSelect
              value={reason}
              onValueChange={setReason}
              options={REJECTION_REASON_OPTIONS}
              placeholder="Pick a reason"
              className="w-full"
            />
            {/* Required, and the button below stays disabled until it is
                answered. This is the only moment the answer is actually known,
                and a shop rejecting most of what it receives cannot tell fake
                numbers from stock-outs later without it. */}
            {reason === "other" && (
              <Input
                aria-label="What was the reason?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={280}
                placeholder="What was the reason? (required)"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Counted on your rejection report, so you can see what you are
              actually turning away.
            </p>
          </div>
        )}

        {hasPrepayment && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Prepayment collected
                </span>
                <span className="font-semibold tabular-nums">
                  {money(prepaid)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>What happens to the money?</Label>
              <RadioGroup
                value={choice}
                onValueChange={(v) => setChoice(v as "refund" | "keep")}
                className="gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="refund" id="prepaid-refund" />
                  <Label htmlFor="prepaid-refund" className="font-normal">
                    Refund {money(prepaid)} to the customer
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="keep" id="prepaid-keep" />
                  <Label htmlFor="prepaid-keep" className="font-normal">
                    Keep the prepayment
                  </Label>
                </div>
              </RadioGroup>
              {choice === "keep" && keptGoodsLeg > 0 && (
                <p className="text-xs text-amber-700">
                  {money(keptGoodsLeg)} of this was collected against the goods.
                  The cash stays in your account, but it is not counted in your order
                  revenue — add it as other income if you want it counted as profit.
                </p>
              )}
              {choice === "refund" &&
                accountsEnabled &&
                accountOptions.length > 0 && (
                  <SimpleSelect
                    value={accountId}
                    onValueChange={setAccountId}
                    options={accountOptions}
                    placeholder="Refund from account (received into)"
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
            disabled={cancel.isPending || (reject && !reason) || needsNote}
            onClick={submit}
          >
            {cancel.isPending
              ? "Processing…"
              : reject
                ? "Reject order"
                : stockTracked
                  ? "Cancel & release stock"
                  : "Cancel order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
