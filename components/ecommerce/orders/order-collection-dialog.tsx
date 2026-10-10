"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useRecordCollection, type AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import { codToCollect } from "./order-detail-helpers";
import { ReturnLinesPicker, returnLineKey as itemKey } from "./return-lines-picker";

/**
 * Record what the courier actually handed over.
 *
 * `markPaid` can only settle the amount the system already believed, and on cash
 * on delivery that is routinely not the amount that comes back. Two things
 * happen at a Bangladeshi door and they are opposite in the books:
 *
 * - the customer **refuses part of the parcel** — goods return, stock and COGS
 *   reverse;
 * - the customer **negotiates the price down** to keep it — nothing returns, and
 *   the concession lands entirely on margin.
 *
 * Both can happen at once, which is why the reasons below are amounts that must
 * SUM rather than a radio group.
 *
 * The dialog will not submit until they add up. That is the design, not a
 * validation nicety: making the merchant account for the gap is what stops it
 * silently becoming fabricated cash (mark paid in full) or a phantom receivable
 * (record the short amount and leave the rest owing forever).
 *
 * `mode="returnItems"` is the same dialog opened from **Return items** on an unpaid order: the
 * merchant starts from what came back, and what the courier collected follows from it. One
 * action, so a part-refused parcel no longer needs "Mark as Delivered" first.
 */
export function OrderCollectionDialog({
  order,
  trigger,
  mode = "collection",
}: {
  order: AdminStorefrontOrder;
  trigger: React.ReactNode;
  mode?: "collection" | "returnItems";
}) {
  const [open, setOpen] = useState(false);
  const record = useRecordCollection();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();

  // What the COURIER was asked to bring back — the order total net of any
  // advance. The prepayment's shipping leg is already banked and its goods leg
  // already settled part of the Sale, so neither is money that can arrive at the
  // door. Same figure as the payment panel's "COD to collect"; the server
  // computes it the same way and refuses anything that does not reconcile to it.
  const prepaid = order.prepaidAmount ?? 0;
  const expected = codToCollect(order);
  // What the courier says it collected at the door (Pathao reports it on a partial delivery).
  const courierFigure = order.courier?.collectedAmount;
  // Until the merchant types a figure, "collected" follows the items: the order less what came
  // back — or the courier's own figure when it sent one.
  const [typedCollected, setTypedCollected] = useState<number | null>(null);
  const [accountId, setAccountId] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [discountNote, setDiscountNote] = useState("");
  const [stillOwed, setStillOwed] = useState<number>(0);
  /** `productId|variantId` → units coming back. Keyed per variant: two sizes of one product
   *  are two lines, and the server matches a return line on both ids. */
  const [returning, setReturning] = useState<Record<string, number>>({});

  const money = (n: number) => formatMoney(n, currency);

  const returnLines = useMemo(
    () =>
      (order.items ?? [])
        .map((item) => ({
          productId: String(item.productId),
          variantId: item.variantId ? String(item.variantId) : null,
          quantity: returning[itemKey(item)] ?? 0,
        }))
        .filter((line) => line.quantity > 0),
    [order.items, returning],
  );

  // Priced off the ORDER's own lines, which is what the merchant is looking at.
  // The server re-derives it from the Sale and refuses the request if the two
  // disagree — this is the preview, not the authority.
  const returnValue = useMemo(
    () =>
      (order.items ?? []).reduce((sum, item) => {
        const qty = returning[itemKey(item)] ?? 0;
        if (qty <= 0) return sum;
        return sum + (item.subtotal / item.quantity) * qty;
      }, 0),
    [order.items, returning],
  );

  const collected =
    typedCollected ??
    courierFigure ??
    Math.max(0, Math.round((expected - returnValue) * 100) / 100);
  const accounted = collected + returnValue + discount + stillOwed;
  const difference = Math.round((expected - accounted) * 100) / 100;
  const reconciles = Math.abs(difference) < 0.01;
  const needsNote = discount > 0 && !discountNote.trim();

  const submit = async () => {
    await record.mutateAsync({
      id: order._id,
      collected,
      returnLines: returnLines.length ? returnLines : undefined,
      discount: discount > 0 ? { amount: discount, note: discountNote.trim() } : undefined,
      stillOwed: stillOwed > 0 ? stillOwed : undefined,
      accountId: accountId || undefined,
      // Minted per submission, so a retry after a timeout is recognisable and a
      // second genuine collection is not.
      idempotencyKey:
        globalThis.crypto?.randomUUID?.() ??
        `${order._id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "returnItems" ? "Return items" : "Record collection"}</DialogTitle>
          <DialogDescription>
            {mode === "returnItems"
              ? `Pick what came back. The rest is what was collected — anything short of ${money(expected)} has to be accounted for below.`
              : `What was collected at the door. Anything short of ${money(expected)} has to be accounted for below.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
            {prepaid > 0 && (
              <>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Order total</span>
                  <span className="tabular-nums">
                    {money(order.totalAmount ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Already prepaid</span>
                  <span className="tabular-nums">−{money(prepaid)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expected</span>
              <span className="font-semibold tabular-nums">
                {money(expected)}
              </span>
            </div>
          </div>

          {/* Items first: what was collected follows from what came back. Shown with or without
              stock tracking — a refused item still comes off the sale. */}
          <ReturnLinesPicker items={order.items ?? []} value={returning} onChange={setReturning} />

          <div className="space-y-1.5">
            <Label htmlFor="collected">Collected</Label>
            <NumberField
              id="collected"
              precision={2}
              min={0}
              max={expected}
              value={collected}
              onChange={(v) => setTypedCollected(v ?? 0)}
            />
            {courierFigure !== undefined && (
              <p className="text-xs text-muted-foreground">
                The courier reported collecting {money(courierFigure)}.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount given</Label>
              <NumberField
                id="discount"
                precision={2}
                min={0}
                value={discount}
                onChange={(v) => setDiscount(v ?? 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stillOwed">Still owed</Label>
              <NumberField
                id="stillOwed"
                precision={2}
                min={0}
                value={stillOwed}
                onChange={(v) => setStillOwed(v ?? 0)}
              />
            </div>
          </div>

          {discount > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="discountNote">Why the discount was given</Label>
              <Input
                id="discountNote"
                value={discountNote}
                onChange={(e) => setDiscountNote(e.target.value)}
                placeholder="Customer negotiated at the door"
              />
              {/* Required, following the rule that a reversal's note is the
                  entire value of the entry. An unexplained margin hole is worse
                  than no record at all. */}
              {needsNote && (
                <p className="text-xs text-destructive">
                  A reason is required — it is the only record of the concession.
                </p>
              )}
            </div>
          )}

          {accountsEnabled && (
            <div className="space-y-1.5">
              <Label>Into which account</Label>
              <SimpleSelect
                value={accountId}
                onValueChange={setAccountId}
                options={accountOptions}
                placeholder="Use the store default"
              />
            </div>
          )}

          <div
            className={`flex items-center justify-between rounded-lg p-3 text-sm ${
              reconciles ? "bg-muted" : "bg-destructive/10 text-destructive"
            }`}
          >
            <span>{reconciles ? "Accounted for" : "Unaccounted"}</span>
            <span className="font-semibold tabular-nums">
              {reconciles ? money(expected) : money(difference)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!reconciles || needsNote || record.isPending}
          >
            {record.isPending
              ? "Recording…"
              : mode === "returnItems"
                ? "Return items"
                : "Record collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
