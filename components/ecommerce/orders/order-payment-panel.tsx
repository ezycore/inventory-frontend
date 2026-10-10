// coding-standard: maintained
import { useState } from "react";
import { useMarkOrderPaid, type AdminStorefrontOrder } from "@/services/api";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { paymentMethodLabel } from "./helpers";
import { OrderPrepaymentDialog } from "./order-prepayment-dialog";
import { OrderCollectionDialog } from "./order-collection-dialog";
import { awaitsCourierReport, codToCollect, collectionLabels } from "./order-detail-helpers";

/**
 * Payment card. An unpaid COD order out with a courier reads **COD pending**, never "due": the
 * customer pays the courier at the door, and when the courier reports it delivered the order
 * settles itself into the courier's account (backend `courier-settlement-manual.md` §4.3 B).
 * "Mark COD collected" stays for the counter and as a manual override.
 *
 * The "mark paid" affordance only appears once the order is
 * **committed to a Sale** (`saleId` set — the sale is created at ship / ready for
 * pickup), because `markPaid` pays that Sale's goods due. A reserved-but-
 * uncommitted order has no Sale to settle, so no button.
 *
 * For a **delivery** order it also owns the prepayment: the "Record prepayment"
 * affordance appears in the same pre-dispatch window the backend allows (unpaid,
 * pending/confirmed/processing, no consignment, none recorded yet), and once one is
 * booked the prepaid / COD-to-collect breakdown replaces it.
 * Pickup carries no shipping, so none of this shows.
 */
export function OrderPaymentPanel({ order }: { order: AdminStorefrontOrder }) {
  const markPaid = useMarkOrderPaid();
  const [accountId, setAccountId] = useState("");
  const { accountsEnabled, options: accountOptions } = useOrderAccountOptions();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const isPaid = order.paymentStatus === "paid";
  const hasSale = !!order.saleId;
  const isPickup = order.fulfillmentType === "pickup";
  // Something to collect only once the goods are out: a returned or closed order
  // has nothing owed, and a Sale that never left the shop (courier booking failed)
  // has nothing collected. Mirrors the backend `ORDER_NOT_COLLECTABLE` guard —
  // `partially_returned` stays in, the kept goods are still owed for.
  const collectable =
    hasSale &&
    ["shipped", "delivered", "partially_returned", "ready_for_pickup", "picked_up"].includes(
      order.status,
    );
  const money = (n: number) => formatMoney(n, currency);
  const labels = collectionLabels(order, money(codToCollect(order)));
  const waitingForCourier = awaitsCourierReport(order);

  const prepaid = order.prepaidAmount ?? 0;
  const hasPrepayment = prepaid > 0;
  const toCollect = codToCollect(order);
  // Mirrors the backend `recordPrepayment` guards: delivery, unpaid, before
  // dispatch, no consignment, none booked yet, and something to pay against (a
  // prepayment must be 0 < amount ≤ totalAmount).
  const canRecordPrepayment =
    !isPickup &&
    !isPaid &&
    !hasPrepayment &&
    !order.prepaidShippingTxnId &&
    !order.prepaidGoodsTxnId &&
    !order.courier?.consignmentId &&
    (order.totalAmount ?? 0) > 0 &&
    ["pending", "confirmed", "processing"].includes(order.status);

  return (
    <Card className="gap-0 p-5 shadow-none">
      <h3 className="mb-3 text-sm font-semibold">Payment</h3>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted-foreground">Method</span>
        <span className="font-semibold">
          {paymentMethodLabel(order.paymentMethod, undefined, order.paymentMethodTitle)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <PaymentBadge
          status={order.paymentStatus}
          // An unpaid order out with a courier is COD the courier collects — never a debt.
          codPending={!isPickup && collectable && order.paymentMethod === "cod"}
          closed={["returned", "cancelled", "rejected"].includes(order.status)}
        />
      </div>

      {!isPickup && hasPrepayment && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-muted p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prepaid</span>
            <span className="font-semibold tabular-nums text-green-700">
              {money(prepaid)}
            </span>
          </div>
          {!isPaid && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">COD to collect</span>
              <span className="font-semibold tabular-nums">
                {money(toCollect)}
              </span>
            </div>
          )}
        </div>
      )}

      {canRecordPrepayment && (
        <div className="mt-4 border-t pt-4">
          <OrderPrepaymentDialog
            order={order}
            trigger={
              <Button variant="outline" className="w-full">
                Record prepayment
              </Button>
            }
          />
        </div>
      )}

      {/* A connected courier reports the delivery and the collection is recorded from it, so
          nothing is offered here until then — recording it earlier booked money before anyone
          said the parcel arrived. Items that came back go through Return items. */}
      {collectable && !isPaid && waitingForCourier && (
        <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
          Recorded automatically when the courier reports the delivery. If items came back, use{" "}
          <b>Return items</b>.
        </p>
      )}
      {collectable && !isPaid && !waitingForCourier && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {accountsEnabled && accountOptions.length > 0 && (
            <SimpleSelect
              value={accountId}
              onValueChange={setAccountId}
              options={accountOptions}
              placeholder="Receiving account (default)"
            />
          )}
          <Button
            className="w-full"
            disabled={markPaid.isPending}
            onClick={() =>
              markPaid.mutate({
                id: order._id,
                accountId: accountId || undefined,
              })
            }
          >
            {labels.full}
          </Button>
          {/* The button above records the amount the system already believed.
              This one records what the courier actually handed over, which on
              cash on delivery is routinely a different number — part of the
              parcel refused, or a price negotiated at the door. Offered beside
              it rather than instead of it: a collection that matches in full is
              still one click. */}
          {order.paymentMethod === "cod" && (
            <OrderCollectionDialog
              order={order}
              trigger={
                <Button variant="outline" className="w-full">
                  {labels.less}
                </Button>
              }
            />
          )}
        </div>
      )}
    </Card>
  );
}

function PaymentBadge({
  status,
  codPending,
  closed,
}: {
  status: string;
  codPending?: boolean;
  /** Returned / cancelled / rejected: an unpaid order owes nothing. */
  closed?: boolean;
}) {
  const map: Record<string, { cls: string; label: string }> = {
    paid: { cls: "border-green-200 bg-green-50 text-green-800", label: "Paid" },
    pending: {
      cls: "border-yellow-200 bg-yellow-50 text-yellow-800",
      label: "Pending",
    },
    refunded: {
      cls: "border-gray-200 bg-gray-50 text-gray-600",
      label: "Refunded",
    },
  };
  const m =
    status === "pending" && closed
      ? { ...map.refunded, label: "Nothing due" }
      : status === "pending" && codPending
        ? { ...map.pending, label: "COD pending" }
        : (map[status] ?? map.pending);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}
