// coding-standard: maintained
import {
  useConfirmOrder,
  useMarkOrderPaid,
  useUpdateOrderStatus,
  type AdminStorefrontOrder,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import { OrderCancelDialog } from "./order-cancel-dialog";
import { OrderConfirmDialog } from "./order-confirm-dialog";
import { OrderReturnDialog } from "./order-return-dialog";

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
            description={`This reserves stock for ${itemCount} item${plural} from the fulfillment location — no sale is booked yet. The sale is created when you ${
              isPickup ? "mark it ready for pickup" : "ship it"
            }. You can cancel until then to release the reservation.`}
            actionLabel="Confirm & reserve stock"
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
          Mark processing
        </Button>
      )}
      {order.status === "confirmed" && isPickup && (
        <Button
          size="sm"
          onClick={() =>
            updateStatus.mutate({ id: order._id, status: "ready_for_pickup" })
          }
        >
          Ready for pickup — books the sale
        </Button>
      )}
      {order.status === "ready_for_pickup" && (
        <Button
          size="sm"
          onClick={() =>
            updateStatus.mutate({ id: order._id, status: "picked_up" })
          }
        >
          Mark collected
        </Button>
      )}
      {order.status === "shipped" && (
        <Button
          size="sm"
          onClick={() =>
            updateStatus.mutate({ id: order._id, status: "delivered" })
          }
        >
          Mark delivered
        </Button>
      )}
      {(order.status === "delivered" || order.status === "picked_up") &&
        !isPaid && (
          <Button
            size="sm"
            disabled={markPaid.isPending}
            onClick={() =>
              markPaid.mutate({ id: order._id, accountId: undefined })
            }
          >
            Mark COD collected
          </Button>
        )}

      {/* RTO / post-delivery return — only for a committed delivery order that has
          shipped or delivered (matches the backend guard). */}
      {!isPickup &&
        !!order.saleId &&
        (order.status === "shipped" || order.status === "delivered") && (
          <OrderReturnDialog
            order={order}
            trigger={
              <Button variant="outline" size="sm">
                Return order
              </Button>
            }
          />
        )}
    </div>
  );
}
