// coding-standard: maintained
import { useState } from "react";
import Link from "next/link";
import { Store, Truck } from "lucide-react";
import {
  useCouriers,
  useCourierPrice,
  useCreateConsignment,
  useRefreshTracking,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { CourierLocationResolver } from "@/components/ecommerce/courier-location-resolver";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { cap } from "./order-detail-helpers";

/**
 * Fulfillment card. Pickup orders show a static in-store note (no courier).
 * Delivery orders drive courier dispatch — and dispatching is **commit-first**:
 * creating the consignment books the online sale (consuming the stock reservation)
 * and marks the order shipped. Location resolution (Pathao/eCourier) is
 * auto-attempted server-side; the manual resolver only surfaces on
 * `COURIER_LOCATION_UNRESOLVED`.
 */
export function OrderFulfillmentPanel({ order }: { order: AdminStorefrontOrder }) {
  const createConsignment = useCreateConsignment();
  const refreshTracking = useRefreshTracking();
  const courierPrice = useCourierPrice();
  const { data: couriersData } = useCouriers();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const [provider, setProvider] = useState("");
  const [quote, setQuote] = useState<number | null>(null);
  // The manual resolver stays hidden — it opens only when auto-resolve can't map
  // the address (COURIER_LOCATION_UNRESOLVED) or the admin opens it themselves.
  const [showResolver, setShowResolver] = useState(false);

  const enabledCouriers = (couriersData?.couriers ?? []).filter((c) => c.enabled);
  const hasTracking = !!order.courier?.consignmentId;
  const canShip = order.status === "processing" && !hasTracking;
  const isLocationProvider = provider === "pathao" || provider === "ecourier";
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
      {hasTracking ? (
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border bg-card">
            <Truck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold capitalize">
              {order.courier?.provider} · consignment created
            </div>
            <div className="text-xs text-muted-foreground">
              Tracking{" "}
              <span className="font-semibold text-foreground">
                {order.courier?.trackingCode || order.courier?.consignmentId}
              </span>
              {order.courier?.status ? ` · ${order.courier.status}` : ""}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={refreshTracking.isPending}
            onClick={() => refreshTracking.mutate(order._id)}
          >
            Refresh
          </Button>
        </div>
      ) : canShip ? (
        enabledCouriers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No courier enabled. Add one in{" "}
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
              Dispatching books the sale (consuming the reserved stock) and marks
              the order shipped.
            </p>
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
            <div className="flex items-center gap-2.5">
              <div className="flex-1">
                <SimpleSelect
                  value={provider}
                  onValueChange={(v) => {
                    setProvider(v);
                    setQuote(null);
                    setShowResolver(false);
                  }}
                  options={enabledCouriers.map((c) => ({
                    label: `${cap(c.provider)} Courier`,
                    value: c.provider,
                  }))}
                  placeholder="Select courier"
                />
              </div>
              <Button
                variant="outline"
                disabled={!provider || courierPrice.isPending}
                onClick={() =>
                  courierPrice.mutate(
                    { id: order._id, provider },
                    {
                      onSuccess: (res) => setQuote(res.data.price),
                      onError: (e) => {
                        if ((e as { code?: string }).code === "COURIER_LOCATION_UNRESOLVED")
                          setShowResolver(true);
                      },
                    },
                  )
                }
              >
                {courierPrice.isPending ? "…" : "Get price"}
              </Button>
              <Button
                disabled={!provider || createConsignment.isPending}
                onClick={() =>
                  createConsignment.mutate(
                    { id: order._id, provider },
                    {
                      onError: (e) => {
                        if ((e as { code?: string }).code === "COURIER_LOCATION_UNRESOLVED")
                          setShowResolver(true);
                      },
                    },
                  )
                }
              >
                Ship — create consignment
              </Button>
            </div>
            {showResolver && isLocationProvider ? (
              <CourierLocationResolver
                order={order}
                provider={provider}
                onResolved={() => {
                  setShowResolver(false);
                  setQuote(null);
                }}
              />
            ) : null}
            {quote !== null ? (
              <p className="text-xs font-medium text-primary">
                Estimated delivery price: {formatMoney(quote)}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Pathao/eCourier match the address to a delivery zone automatically;
                if it can&apos;t, a matcher appears. Steadfast ships off the address
                line.
              </p>
              {isLocationProvider && !showResolver ? (
                <button
                  type="button"
                  className="flex-none text-xs font-medium text-primary underline"
                  onClick={() => setShowResolver(true)}
                >
                  Set location
                </button>
              ) : null}
            </div>
          </>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          Available once the order reaches <b>Processing</b>.
        </p>
      )}
    </Card>
  );
}
