// coding-standard: maintained
import { useState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { useCouriers, type AdminStorefrontOrder } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { cap } from "./order-detail-helpers";
import { CourierDispatchForm } from "./courier-dispatch-form";
import { CourierTrackingSummary } from "./courier-tracking-summary";
import { ManualDispatchForm } from "./manual-dispatch-form";
import { ManualStatusPanel } from "./manual-status-panel";

/** Custom couriers are namespaced in the picker so an id can't collide with a provider. */
const CUSTOM_PREFIX = "custom:";

/**
 * Fulfillment card. Pickup orders show a static in-store note (no courier).
 * Delivery orders drive dispatch, and dispatching is **commit-first** whichever
 * courier is chosen: it books the online sale (consuming the stock reservation)
 * and marks the order shipped.
 *
 * The picker merges both kinds of courier into one list — the merchant picks a
 * carrier, not a "mode" — and the selection decides which form renders.
 */
export function OrderFulfillmentPanel({ order }: { order: AdminStorefrontOrder }) {
  const { labelFor } = useOrderStatusLabels();
  const { data: couriersData } = useCouriers();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const [selected, setSelected] = useState("");
  // Re-dispatch reopens the picker for a cancelled consignment (the sale already
  // exists, so this only books a fresh consignment).
  const [reDispatch, setReDispatch] = useState(false);

  const enabledCouriers = (couriersData?.couriers ?? []).filter((c) => c.enabled);
  const customCouriers = (couriersData?.customCouriers ?? []).filter(
    (c) => c.active,
  );
  const hasCourier = enabledCouriers.length + customCouriers.length > 0;

  const isDispatched = !!(
    order.courier?.consignmentId ||
    (order.courier?.integration === "manual" && order.courier?.name)
  );
  const isCancelled = order.courier?.normalizedStatus === "cancelled";
  const canShip = (order.status === "processing" && !isDispatched) || reDispatch;

  const selectedCustom = selected.startsWith(CUSTOM_PREFIX)
    ? customCouriers.find((c) => c._id === selected.slice(CUSTOM_PREFIX.length))
    : undefined;

  // A recorded delivery-charge advance shrinks what the courier collects COD.
  const advance = order.advanceAmount ?? 0;
  const codToCollect = Math.max(0, (order.totalAmount ?? 0) - advance);

  if (order.fulfillmentType === "pickup") {
    return (
      <Card className="space-y-3 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Fulfillment</h3>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border bg-card">
            <Store className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">In-store pickup</div>
            <div className="text-xs text-muted-foreground">
              No courier — the customer collects from your store. Marking it ready
              for pickup books the sale; use the status button above.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-5 shadow-none">
      <h3 className="text-sm font-semibold">Fulfillment</h3>

      {isDispatched && !reDispatch ? (
        <>
          <CourierTrackingSummary
            order={order}
            onReDispatch={
              isCancelled
                ? () => {
                    setSelected("");
                    setReDispatch(true);
                  }
                : undefined
            }
          />
          {/* Only a manual courier's status is ours to set — an integrated one
              reports its own, and the sweep would overwrite anything typed here. */}
          {order.courier?.integration === "manual" ? (
            <ManualStatusPanel order={order} />
          ) : null}
        </>
      ) : canShip ? (
        !hasCourier ? (
          <p className="text-sm text-muted-foreground">
            No courier set up. Add one in{" "}
            <Link
              href="/ecommerce/settings"
              className="font-medium text-primary underline"
            >
              Store Settings → Couriers
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {reDispatch
                ? "The previous consignment was cancelled. Re-dispatching books a fresh consignment (same courier or another) — the sale is already recorded."
                : "Dispatching books the sale (consuming the reserved stock) and marks the order shipped."}
            </p>
            {reDispatch ? (
              <button
                type="button"
                className="self-start text-xs font-medium text-muted-foreground underline"
                onClick={() => setReDispatch(false)}
              >
                Cancel re-dispatch
              </button>
            ) : null}

            {advance > 0 && order.paymentMethod === "cod" && (
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  Courier collects (COD, after {formatMoney(advance, currency)}{" "}
                  advance)
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(codToCollect, currency)}
                </span>
              </div>
            )}

            <SimpleSelect
              value={selected}
              onValueChange={setSelected}
              options={[
                ...enabledCouriers.map((c) => ({
                  label: `${cap(c.provider)} Courier`,
                  value: c.provider,
                })),
                ...customCouriers.map((c) => ({
                  label: c.name,
                  value: `${CUSTOM_PREFIX}${c._id}`,
                })),
              ]}
              placeholder="Select courier"
            />

            {selectedCustom ? (
              <ManualDispatchForm
                order={order}
                courier={selectedCustom}
                reDispatch={reDispatch}
                onDispatched={() => setReDispatch(false)}
              />
            ) : selected ? (
              <CourierDispatchForm
                order={order}
                provider={selected}
                reDispatch={reDispatch}
                onDispatched={() => setReDispatch(false)}
              />
            ) : null}
          </>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          Available once the order reaches <b>{labelFor("processing")}</b>.
        </p>
      )}
    </Card>
  );
}
