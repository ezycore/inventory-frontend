// coding-standard: maintained
import { useState } from "react";
import {
  useCourierPrice,
  useCreateConsignment,
  type AdminStorefrontOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { formatMoney } from "@/components/storefront/format";
import { CourierLocationResolver } from "@/components/ecommerce/courier-location-resolver";
import { Button } from "@/ui/components/button";

/**
 * Dispatch to an API-integrated courier. Pathao/eCourier need the shopper's
 * courier-neutral address mapped to the provider's own codes — the backend
 * auto-resolves it, so the manual resolver only surfaces on
 * `COURIER_LOCATION_UNRESOLVED` (or if the admin opens it themselves).
 */
export function CourierDispatchForm({
  order,
  provider,
  reDispatch,
  onDispatched,
}: {
  order: AdminStorefrontOrder;
  provider: string;
  reDispatch: boolean;
  onDispatched: () => void;
}) {
  const createConsignment = useCreateConsignment();
  const courierPrice = useCourierPrice();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const [quote, setQuote] = useState<number | null>(null);
  const [showResolver, setShowResolver] = useState(false);

  const isLocationProvider = provider === "pathao" || provider === "ecourier";
  const openResolverOnUnresolved = (e: unknown) => {
    if ((e as { code?: string }).code === "COURIER_LOCATION_UNRESOLVED") {
      setShowResolver(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          disabled={courierPrice.isPending}
          onClick={() =>
            courierPrice.mutate(
              { id: order._id, provider },
              {
                onSuccess: (res) => setQuote(res.data.price),
                onError: openResolverOnUnresolved,
              },
            )
          }
        >
          {courierPrice.isPending ? "…" : "Get price"}
        </Button>
        <Button
          disabled={createConsignment.isPending}
          onClick={() =>
            createConsignment.mutate(
              { id: order._id, provider },
              { onSuccess: onDispatched, onError: openResolverOnUnresolved },
            )
          }
        >
          {reDispatch
            ? "Re-dispatch — create consignment"
            : "Ship — create consignment"}
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
          Estimated delivery price: {formatMoney(quote, currency)}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Pathao/eCourier match the address to a delivery zone automatically; if it
          can&apos;t, a matcher appears. Steadfast ships off the address line.
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
  );
}
