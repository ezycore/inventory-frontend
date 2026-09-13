"use client";
// coding-standard: maintained
import { useState } from "react";
import { Check, ExternalLink, Eye, MoreHorizontal, Trash2, X } from "lucide-react";
import {
  useConfirmOrder,
  useDeleteOrder,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useStockTracked } from "@/hooks/use-stock-tracked";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { isDeletableOrder, orderDetailHref } from "./helpers";
import { Button } from "@/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { OrderCancelDialog } from "./order-cancel-dialog";
import { OrderConfirmDialog } from "./order-confirm-dialog";

/**
 * The row's action menu — the triage loop (confirm / reject a pending order)
 * without the round trip through the detail page and back to a lost scroll
 * position. It is deliberately a subset of `OrderActionBar`: only the two
 * decisions a merchant makes while scanning the list belong here, and both
 * still go through the same dialogs, so the wording and the prepayment
 * question stay single-sourced.
 *
 * Both dialogs are rendered as siblings of the menu and driven by `dialog`
 * state, never nested inside a `DropdownMenuItem`: selecting an item unmounts
 * it, which would take a trigger-hosted dialog down in the same frame.
 */
export function OrderRowActions({
  order,
  onOpen,
}: {
  order: AdminStorefrontOrder;
  onOpen: () => void;
}) {
  const [dialog, setDialog] = useState<"confirm" | "reject" | "delete" | null>(
    null,
  );
  const confirm = useConfirmOrder();
  const remove = useDeleteOrder();
  const stockTracked = useStockTracked();
  const canDelete = useHasPermission(PERMISSIONS.storefrontOrdersDelete);

  const isPending = order.status === "pending";
  /**
   * The same predicate the bulk bar counts by (`helpers.ts`), so the menu never
   * offers an action the button beside it has already excluded — the menu shows
   * what will work, not what exists.
   *
   * A hint, not the gate: the server re-checks all four rules, and a row the
   * list fetched a minute ago may have moved since.
   */
  const isDeletable = canDelete && isDeletableOrder(order);
  const isPickup = order.fulfillmentType === "pickup";
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const plural = itemCount === 1 ? "" : "s";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={`Actions for ${order.orderNumber}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onOpen}>
            <Eye className="h-4 w-4" />
            View details
          </DropdownMenuItem>
          {/* Spelled out rather than left to ctrl/cmd-click, because triage is
              the one job here that wants several orders open at once and the
              keyboard shortcut is not something a merchant is told about. A real
              anchor, so the browser opens it — not `window.open`, which a popup
              blocker may swallow. */}
          <DropdownMenuItem asChild>
            <a
              href={orderDetailHref(order._id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </DropdownMenuItem>
          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDialog("confirm")}>
                <Check className="h-4 w-4" />
                Confirm order
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDialog("reject")}
              >
                <X className="h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}
          {isDeletable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDialog("delete")}
              >
                <Trash2 className="h-4 w-4" />
                Delete permanently
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Same copy as the detail page's confirm — see `OrderActionBar` for why
          the stock-free wording drops the reservation sentence. */}
      <OrderConfirmDialog
        open={dialog === "confirm"}
        onOpenChange={(o) => setDialog(o ? "confirm" : null)}
        title="Confirm this order?"
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
      <OrderCancelDialog
        order={order}
        reject
        open={dialog === "reject"}
        onOpenChange={(o) => setDialog(o ? "reject" : null)}
      />
      {/* No type-the-order-number step, deliberately. What makes this safe is
          the server's preconditions — no Sale, no money, no courier — which
          reduce a deletable order to a document with no consequences. Friction
          on top of that would only tax the merchant clearing fake COD orders,
          which is the entire point of the action. */}
      <OrderConfirmDialog
        destructive
        open={dialog === "delete"}
        onOpenChange={(o) => setDialog(o ? "delete" : null)}
        title={`Delete ${order.orderNumber} permanently?`}
        description="The order is removed for good — this can't be undone. A record of the order number, customer and total is kept in case the customer asks about it later."
        actionLabel="Delete permanently"
        onConfirm={() => remove.mutate(order._id)}
      />
    </>
  );
}
