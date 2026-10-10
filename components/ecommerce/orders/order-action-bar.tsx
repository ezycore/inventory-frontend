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
import { formatMoney } from "@/components/storefront/format";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { OrderCancelDialog } from "./order-cancel-dialog";
import { OrderCollectionDialog } from "./order-collection-dialog";
import { OrderConfirmDialog } from "./order-confirm-dialog";
import { OrderEditButton } from "./order-edit-button";
import { OrderItemsReturnDialog } from "./order-items-return-dialog";
import { OrderReturnDialog } from "./order-return-dialog";
import { OrderReverseStatusDialog } from "./order-reverse-status-dialog";
import { codToCollect, collectionLabels, confirmOrderPrompt } from "./order-detail-helpers";

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
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const isPaid = order.paymentStatus === "paid";
  const isPickup = order.fulfillmentType === "pickup";
  // Cancellable while the sale hasn't been created yet (mirrors the backend guard).
  const canCancel =
    !order.saleId &&
    ["pending", "confirmed", "processing"].includes(order.status);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

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
          {/* A prompt only where confirming has a hidden effect: with stock it holds the items.
              Without stock it just moves the order on, cancellable until it ships — one click. */}
          {stockTracked ? (
            <OrderConfirmDialog
              trigger={<Button size="sm">Confirm order</Button>}
              {...confirmOrderPrompt(itemCount, isPickup)}
              cancelLabel="Not yet"
              onConfirm={() => confirm.mutate(order._id)}
            />
          ) : (
            <Button
              size="sm"
              disabled={confirm.isPending}
              onClick={() => confirm.mutate(order._id)}
            >
              Confirm order
            </Button>
          )}
        </>
      )}

      {/* On a new order too (G10): a customer who asks to cancel before you confirm is a
          cancellation, not a rejection — with only Reject on offer, those were filed as a
          rejection marked "Other", which is most of what that bucket held. */}
      {canCancel && (
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
          Mark as {labelFor("ready_for_pickup")}
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
            {collectionLabels(order, formatMoney(codToCollect(order), currency)).full}
          </Button>
        )}

      {/* RTO / post-delivery return of the WHOLE parcel — for a committed
          delivery order that has shipped or delivered, or one still `processing`
          whose courier booking failed after the sale was booked (no consignment;
          matches the backend guard). Named for its scope: a part of the parcel
          coming back is a collection, recorded through `OrderCollectionDialog`,
          and a merchant who reads this as "the return button" reverses the
          entire sale to handle one refused item. */}
      {!isPickup &&
        !!order.saleId &&
        (order.status === "shipped" ||
          order.status === "delivered" ||
          (order.status === "processing" && !order.courier?.consignmentId)) && (
          <OrderReturnDialog
            order={order}
            trigger={
              <Button variant="outline" size="sm">
                Return whole order
              </Button>
            }
          />
        )}
      {/* Some items back — one button whatever the payment state. Unpaid: the same step records
          what was collected, so a part-refused parcel needs no "Mark as Delivered" first.
          Paid: a return after delivery (G5). `partially_returned` keeps it, so the rest can
          follow later. */}
      {!isPickup &&
        !!order.saleId &&
        (isPaid
          ? order.status === "delivered" || order.status === "partially_returned"
          : ["shipped", "delivered", "partially_returned"].includes(order.status)) &&
        (isPaid ? (
          <OrderItemsReturnDialog order={order} trigger={returnItemsButton} />
        ) : (
          <OrderCollectionDialog order={order} mode="returnItems" trigger={returnItemsButton} />
        ))}
    </div>
  );
}

const returnItemsButton = (
  <Button variant="outline" size="sm">
    Return items
  </Button>
);
