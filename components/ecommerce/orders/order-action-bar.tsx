// coding-standard: maintained
import {
  useConfirmOrder,
  useMarkOrderPaid,
  useUpdateOrderStatus,
  type AdminStorefrontOrder,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import { useOrderAccountOptions } from "@/hooks/use-order-account-options";
import { useStockTracked } from "@/hooks/use-stock-tracked";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { OrderCancelDialog } from "./order-cancel-dialog";
import { OrderConfirmDialog } from "./order-confirm-dialog";
import { OrderEditButton } from "./order-edit-button";
import { OrderReturnDialog } from "./order-return-dialog";
import { OrderReverseStatusDialog } from "./order-reverse-status-dialog";

/**
 * The header action cluster — the order's forward controls. Reflects the
 * reserve-at-confirm lifecycle: **confirm reserves stock** (no sale); the sale is
 * booked at the commit step (delivery → shipped via a consignment; pickup → ready
 * for pickup); COD is collected at delivery/collection. Cancel is available until
 * the sale exists (`!saleId`) and releases the reservation.
 */
export function OrderActionBar({ order }: { order: AdminStorefrontOrder }) {
  const confirm = useConfirmOrder();
  const updateStatus = useUpdateOrderStatus();
  const markPaid = useMarkOrderPaid();
  const { accountsEnabled } = useOrderAccountOptions();
  const stockTracked = useStockTracked();
  // Each button names the step it moves the order INTO, so a renamed pipeline
  // reads as one vocabulary — a "Mark processing" button under a stepper the
  // merchant relabelled "Packing" is the mismatch this avoids.
  const { labelFor } = useOrderStatusLabels();

  const isPaid = order.paymentStatus === "paid";
  const isPickup = order.fulfillmentType === "pickup";
  // Cancellable while the sale hasn't been created yet (mirrors the backend guard).
  const canCancel =
    !order.saleId &&
    ["pending", "confirmed", "processing"].includes(order.status);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const plural = itemCount === 1 ? "" : "s";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Corrections first, and visually quieter than the forward controls: they
          are the exception, and a merchant reaching for one already knows it. Each
          hides itself when the order is past the point of allowing it. */}
      <OrderEditButton order={order} />
      <OrderReverseStatusDialog order={order} />
      {order.status === "pending" && (
        <>
          <OrderCancelDialog
            order={order}
            reject
            trigger={
              <Button variant="outline" size="sm">
                Reject
              </Button>
            }
          />
          <OrderConfirmDialog
            trigger={<Button size="sm">Confirm order</Button>}
            title="Confirm this order?"
            // Two tiers, two truths. `reservationLines` returns an empty list
            // for an org that does not count stock, so `reserveStock` is a
            // no-op and `reservedQuantity` never moves — a dialog naming a
            // quantity and offering to release it later described something
            // that had not happened (QA-N5). What IS true at both tiers is the
            // sale timing, so that is what the stock-free wording keeps.
            description={
              stockTracked
                ? `This reserves stock for ${itemCount} item${plural} from the fulfillment location — no sale is booked yet. The sale is created when you ${
                    isPickup ? "mark it ready for pickup" : "ship it"
                  }. You can cancel until then to release the reservation.`
                : `This accepts the order — no sale is booked yet. The sale is created when you ${
                    isPickup ? "mark it ready for pickup" : "ship it"
                  }. You can cancel until then.`
            }
            actionLabel={stockTracked ? "Confirm & reserve stock" : "Confirm order"}
            onConfirm={() => confirm.mutate(order._id)}
          />
        </>
      )}

      {canCancel && order.status !== "pending" && (
        <OrderCancelDialog
          order={order}
          trigger={
            <Button variant="outline" size="sm">
              Cancel order
            </Button>
          }
        />
      )}
      {order.status === "confirmed" && !isPickup && (
        <Button
          size="sm"
          onClick={() =>
            updateStatus.mutate({ id: order._id, status: "processing" })
          }
        >
          Mark as {labelFor("processing")}
        </Button>
      )}
      {order.status === "confirmed" && isPickup && (
        <Button
          size="sm"
          onClick={() =>
            updateStatus.mutate({ id: order._id, status: "ready_for_pickup" })
          }
        >
          {labelFor("ready_for_pickup")} — books the sale
        </Button>
      )}
      {order.status === "ready_for_pickup" && (
        <Button
          size="sm"
          onClick={() =>
            updateStatus.mutate({ id: order._id, status: "picked_up" })
          }
        >
          Mark as {labelFor("picked_up")}
        </Button>
      )}
      {order.status === "shipped" && (
        <Button
          size="sm"
          onClick={() =>
            updateStatus.mutate({ id: order._id, status: "delivered" })
          }
        >
          Mark as {labelFor("delivered")}
        </Button>
      )}
      {/* Only when the merchant has no account to choose. With `accounts` on,
          `OrderPaymentPanel` owns this action because it carries the receiving-
          account selector; this button cannot see that selection (the state is
          the panel's own `useState`) and used to post `accountId: undefined`
          regardless — so a seller who picked "Mobile Money" for a bKash
          collection had it silently booked against the mapped default, or, on a
          workspace with no `paymentAccountMap`, got NO_RECEIVING_ACCOUNT while
          staring at the account they had just selected. */}
      {!accountsEnabled &&
        (order.status === "delivered" || order.status === "picked_up") &&
        !isPaid && (
          <Button
            size="sm"
            disabled={markPaid.isPending}
            onClick={() => markPaid.mutate({ id: order._id })}
          >
            Mark COD collected
          </Button>
        )}

      {/* RTO / post-delivery return of the WHOLE parcel — only for a committed
          delivery order that has shipped or delivered (matches the backend guard).
          Named for its scope: a part of the parcel coming back is a collection,
          recorded through `OrderCollectionDialog`, and a merchant who reads this
          as "the return button" reverses the entire sale to handle one refused
          item. */}
      {!isPickup &&
        !!order.saleId &&
        (order.status === "shipped" || order.status === "delivered") && (
          <OrderReturnDialog
            order={order}
            trigger={
              <Button variant="outline" size="sm">
                Return whole order
              </Button>
            }
          />
        )}
    </div>
  );
}
