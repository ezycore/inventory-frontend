// coding-standard: maintained
import { Truck } from "lucide-react";
import {
  useRefreshTracking,
  type AdminStorefrontOrder,
} from "@/services/api";
import { courierStatusPresentation } from "@/lib/courier-status";
import { Button } from "@/ui/components/button";
import { cap } from "./order-detail-helpers";

/**
 * The dispatched-state card — what the fulfillment panel shows once an order is
 * on its way, for either dispatch path.
 *
 * The two paths differ in exactly one place: **Refresh**. An API courier is polled
 * (the button and the 30-minute sweep both call `refreshTracking`); a manual one
 * has no API, so the endpoint refuses it (`COURIER_MANUAL_NO_TRACKING`) and the
 * button must not be offered. The merchant drives that status by hand instead.
 */
export function CourierTrackingSummary({
  order,
  onReDispatch,
}: {
  order: AdminStorefrontOrder;
  /** Present only when the consignment is cancelled (a dead end worth re-sending). */
  onReDispatch?: () => void;
}) {
  const refreshTracking = useRefreshTracking();

  const courier = order.courier;
  const isManual = courier?.integration === "manual";
  // Manual dispatches snapshot a display name; API ones fall back to the provider.
  const carrier = courier?.name
    ? cap(courier.name)
    : cap(courier?.provider ?? "Courier");
  const tracking = courier?.trackingCode || courier?.consignmentId;
  const presentation = courier?.normalizedStatus
    ? courierStatusPresentation(courier.normalizedStatus, courier.returnStage)
    : null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border bg-card">
        <Truck className="h-4 w-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="text-sm font-semibold">
          {carrier} · {isManual ? "dispatched" : "consignment created"}
        </div>

        {/* Consignment ids are long and unbroken — without `break-all` one
            widens the card past a phone viewport. */}
        {tracking ? (
          <div className="break-all text-xs text-muted-foreground">
            Tracking{" "}
            {courier?.trackingUrl ? (
              <a
                href={courier.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline"
              >
                {tracking}
              </a>
            ) : (
              <span className="font-semibold text-foreground">{tracking}</span>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            No tracking number recorded.
          </div>
        )}

        {presentation ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                color: presentation.tone,
                background: `${presentation.tone}1f`,
                boxShadow: `inset 0 0 0 1px ${presentation.tone}52`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: presentation.tone }}
              />
              {presentation.admin}
            </span>
            {/* The raw provider string is ugly and provider-specific — admin-only,
                and meaningless for a manual courier (we wrote it ourselves). */}
            {!isManual && courier?.status ? (
              <span className="text-[11px] text-muted-foreground">
                Courier reports{" "}
                <span className="font-mono">{courier.status}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-none flex-col gap-1.5">
        {isManual ? null : (
          <Button
            variant="outline"
            size="sm"
            disabled={refreshTracking.isPending}
            onClick={() => refreshTracking.mutate(order._id)}
          >
            Refresh
          </Button>
        )}
        {onReDispatch ? (
          <Button size="sm" onClick={onReDispatch}>
            Re-dispatch
          </Button>
        ) : null}
      </div>
    </div>
  );
}
