"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import {
  useOrderReturnPreview,
  useReturnOrder,
  type AdminStorefrontOrder,
  type OrderReturnLine,
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

/** Why items come back after delivery — the reasons that are knowable by asking (G10). */
const ITEM_RETURN_REASONS = [
  { value: "customer_changed_mind", label: "Customer changed mind" },
  { value: "wrong_item", label: "Wrong item / size" },
  { value: "damaged", label: "Damaged" },
  { value: "defective", label: "Defective" },
  { value: "other", label: "Other" },
] as const;
type ItemReturnReason = (typeof ITEM_RETURN_REASONS)[number]["value"];

const lineKey = (line: { productId: string; variantId: string | null }) =>
  `${line.productId}|${line.variantId ?? ""}`;

/**
 * Take back some items of a delivered, paid order (G5, backend `business-modes.md`).
 *
 * Courier delivery marks a COD order paid, and the only line picker the order had lived in
 * "Collected a different amount…", which is offered only while the order is unpaid — so a
 * customer sending one item back after delivery could not be recorded from the order at all.
 *
 * Every number comes from the server's return preview for the ticked lines, including what is
 * still returnable on each line after earlier returns, so this dialog never prices a return the
 * server would price differently.
 */
export function OrderItemsReturnDialog({
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
  /** `productId|variantId` → units coming back. */
  const [returning, setReturning] = useState<Record<string, number>>({});
  const [refundMode, setRefundMode] = useState<RefundMode>("account");
  // No default: a pre-picked reason is the "every return says Other" problem again.
  const [reason, setReason] = useState<ItemReturnReason | "">("");
  const [refundAccountId, setRefundAccountId] = useState("");

  // The unticked preview lists the lines; the ticked one prices them. Both read the Sale.
  const { data: listing } = useOrderReturnPreview(order._id, open);
  const lines = useMemo(() => listing?.lines ?? [], [listing]);
  const selection: OrderReturnLine[] = useMemo(
    () =>
      lines
        .map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: returning[lineKey(line)] ?? 0,
        }))
        .filter((line) => line.quantity > 0),
    [lines, returning],
  );
  const { data: preview, isFetching } = useOrderReturnPreview(
    order._id,
    open && selection.length > 0,
    selection,
  );

  const money = (n: number) => formatMoney(n, currency);
  const priced = selection.length > 0 ? preview : undefined;
  const needsRefundMode = !!priced?.refundModeRequired;

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setReturning({});
      setReason("");
    }
  };

  const submit = () => {
    returnOrder.mutate(
      {
        id: order._id,
        returnLines: selection,
        reason: reason || undefined,
        refund: needsRefundMode
          ? {
              mode: refundMode,
              accountId:
                refundMode === "account" ? refundAccountId || undefined : undefined,
            }
          : undefined,
        // Minted per submission: a retry after a timeout is recognised, a second genuine
        // return of the same item is not swallowed.
        idempotencyKey:
          globalThis.crypto?.randomUUID?.() ??
          `${order._id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      { onSuccess: () => reset(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Return items</DialogTitle>
          <DialogDescription>
            For items the customer sends back after delivery.{" "}
            {stockTracked
              ? "They go back into stock and the sale is reduced by their value."
              : "The sale is reduced by their value."}{" "}
            The delivery charge is not refunded. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Items coming back</Label>
            <div className="space-y-1.5 rounded-md border p-3">
              {lines.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading items…</p>
              )}
              {lines.map((line) => (
                <div key={lineKey(line)} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate">{line.productName}</span>
                    <span className="text-xs text-muted-foreground">
                      {line.returned > 0
                        ? `${line.sold} sold · ${line.returned} already returned`
                        : `${line.sold} sold`}
                    </span>
                  </span>
                  <NumberField
                    precision={0}
                    min={0}
                    max={line.returnable}
                    value={returning[lineKey(line)] ?? 0}
                    onChange={(v) =>
                      setReturning((prev) => ({ ...prev, [lineKey(line)]: v ?? 0 }))
                    }
                    disabled={line.returnable === 0}
                    className="h-8 w-24"
                    aria-label={`Return ${line.productName}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Why did they come back?</Label>
            <SimpleSelect
              value={reason}
              onValueChange={(v) => setReason(v as ItemReturnReason)}
              options={[...ITEM_RETURN_REASONS]}
              placeholder="Pick a reason"
              className="w-full"
            />
          </div>

          {priced && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goods refund (net)</span>
                <span className="font-semibold tabular-nums">
                  {money(priced.goodsRefund)}
                </span>
              </div>
              {priced.deduction > 0 && (
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Order discount taken off</span>
                  <span className="tabular-nums">−{money(priced.deduction)}</span>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {needsRefundMode
                  ? `${money(priced.refundRemainder)} is money the customer already paid — choose where it goes below.`
                  : priced.refundToClearing
                    ? "The courier still holds this money, so it comes back out of their account — no cash moves."
                    : accountsEnabled
                    ? "This reduces what was still owed; no cash moves."
                    : "Money is not tracked in your accounts, so pay the customer back yourself."}
              </p>
            </div>
          )}

          {needsRefundMode && accountsEnabled && (
            <OrderRefundDestination
              idPrefix="rm-items"
              mode={refundMode}
              onModeChange={setRefundMode}
              accountId={refundAccountId}
              onAccountChange={setRefundAccountId}
              accountOptions={accountOptions}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => reset(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={
              selection.length === 0 || !reason || !priced || isFetching || returnOrder.isPending
            }
            onClick={submit}
          >
            {returnOrder.isPending ? "Processing…" : "Return items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
