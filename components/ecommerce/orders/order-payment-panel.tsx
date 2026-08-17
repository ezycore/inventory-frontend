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
import { OrderPrepaymentDialog } from "./order-prepayment-dialog";

/**
 * Payment card. The "mark paid" affordance only appears once the order is
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
  const money = (n: number) => formatMoney(n, currency);

  const prepaid = order.prepaidAmount ?? 0;
  const hasPrepayment = prepaid > 0;
  const codToCollect = Math.max(0, (order.totalAmount ?? 0) - prepaid);
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
    <Card className="p-5 shadow-none">
      <h3 className="mb-3 text-sm font-semibold">Payment</h3>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted-foreground">Method</span>
        <span className="font-semibold uppercase">{order.paymentMethod}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <PaymentBadge status={order.paymentStatus} />
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
                {money(codToCollect)}
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

      {hasSale && !isPaid && (
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
            {order.paymentMethod === "cod" ? "Mark COD collected" : "Mark as paid"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function PaymentBadge({ status }: { status: string }) {
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
  const m = map[status] ?? map.pending;
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
