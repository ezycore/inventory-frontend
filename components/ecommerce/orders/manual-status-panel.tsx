// coding-standard: maintained
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useSetCourierStatus, type AdminStorefrontOrder } from "@/services/api";
import { COURIER_STATUS } from "@/lib/courier-status";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { SimpleSelect } from "@/ui/components/simple-select";
import { CourierTimeline } from "./courier-timeline";

/**
 * The merchant driving a manual courier's delivery status, and the progress feed
 * that produces. Shown only for `integration: "manual"` — an integrated provider
 * reports its own status, and a hand-set value there would be overwritten by the
 * next sweep.
 *
 * `unknown` is not offered: it is what an unmapped provider string normalizes to,
 * never something a person would choose.
 */
const STATUS_OPTIONS = (
  ["pending", "in_transit", "delivered", "returned", "cancelled"] as const
).map((value) => ({ value, label: COURIER_STATUS[value].admin }));

export function ManualStatusPanel({ order }: { order: AdminStorefrontOrder }) {
  const setStatus = useSetCourierStatus();

  const current = order.courier?.normalizedStatus ?? "pending";
  const [status, setStatus_] = useState<string>(current);
  const [note, setNote] = useState("");

  const history = order.courier?.history ?? [];
  const isReturned = current === "returned";
  const unchanged = status === current && !note.trim();

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <h4 className="text-sm font-semibold">Update delivery status</h4>
        <p className="text-xs text-muted-foreground">
          This courier has no tracking API — what you set here is what your
          customer sees.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SimpleSelect
          value={status}
          onValueChange={setStatus_}
          options={STATUS_OPTIONS}
          className="sm:w-48"
        />
        <Input
          value={note}
          maxLength={280}
          placeholder="Add a note (optional) — shown to your customer"
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          className="sm:flex-none"
          disabled={setStatus.isPending || unchanged}
          onClick={() =>
            setStatus.mutate(
              { id: order._id, normalizedStatus: status, note: note.trim() || undefined },
              { onSuccess: () => setNote("") },
            )
          }
        >
          Update
        </Button>
      </div>

      {/* Marking the parcel returned does NOT reverse the sale — that needs the
          return charge, refund routing and an account. Say so, or the merchant
          will assume the money moved. */}
      {isReturned ? (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          <span>
            The parcel is marked returned, but the sale is still recorded. Use{" "}
            <b>Return whole order</b> above to restock the items and settle the
            refund.
          </span>
        </p>
      ) : null}

      {history.length > 0 ? (
        <div className="space-y-2 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">
            Progress your customer sees
          </div>
          {/* The same component the integrated couriers render, so a merchant
              driving a parcel by hand reads it exactly as they read Pathao's. */}
          <CourierTimeline history={history} />
        </div>
      ) : null}
    </div>
  );
}
