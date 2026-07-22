// coding-standard: maintained
import { useState } from "react";
import {
  useManualConsignment,
  type AdminStorefrontOrder,
  type CustomCourierEntry,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";

/**
 * Dispatch to a merchant-defined courier. There is no API behind it, so nothing
 * here is fetched or validated upstream — the merchant types whatever the courier
 * gave them, including nothing at all (plenty of local couriers hand over no
 * tracking number, and the order must still ship).
 *
 * Dispatching still books the sale, exactly as the API path does. From here the
 * merchant owns the delivery status.
 */
export function ManualDispatchForm({
  order,
  courier,
  reDispatch,
  onDispatched,
}: {
  order: AdminStorefrontOrder;
  courier: CustomCourierEntry;
  reDispatch: boolean;
  onDispatched: () => void;
}) {
  const manualConsignment = useManualConsignment();

  const [trackingCode, setTrackingCode] = useState("");
  const [note, setNote] = useState("");
  // Pre-filled from the partner's default so the common case is zero typing.
  const [charge, setCharge] = useState<number | null>(
    courier.defaultCharge ?? null,
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="md-tracking" className="text-xs text-muted-foreground">
            Tracking number (optional)
          </Label>
          <Input
            id="md-tracking"
            value={trackingCode}
            maxLength={100}
            placeholder="Whatever the courier gave you"
            onChange={(e) => setTrackingCode(e.target.value)}
          />
          {courier.trackingUrlTemplate ? (
            <p className="text-xs text-muted-foreground">
              Your customer gets a clickable tracking link.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="md-charge" className="text-xs text-muted-foreground">
            Delivery charge you pay
          </Label>
          <NumberField
            id="md-charge"
            value={charge}
            onChange={setCharge}
            min={0}
            precision={2}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="md-note" className="text-xs text-muted-foreground">
            Note (optional)
          </Label>
          <Input
            id="md-note"
            value={note}
            maxLength={280}
            placeholder="Handed to rider, Mirpur hub"
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Shown to your customer on their order tracking.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="flex-1" />
        <Button
          disabled={manualConsignment.isPending}
          onClick={() =>
            manualConsignment.mutate(
              {
                id: order._id,
                customCourierId: courier._id,
                trackingCode: trackingCode.trim() || undefined,
                shippingCost: charge ?? undefined,
                note: note.trim() || undefined,
              },
              { onSuccess: onDispatched },
            )
          }
        >
          {reDispatch
            ? `Re-dispatch with ${courier.name}`
            : `Ship with ${courier.name}`}
        </Button>
      </div>
    </>
  );
}
