"use client";
// coding-standard: maintained

import { CheckCircle2, CircleSlash, Clock, TriangleAlert } from "lucide-react";
import { useSetOrderExcludedFromMeta } from "@/services/api";
import type { AdminStorefrontOrder } from "@/types/api";
import { Badge } from "@/ui/components/badge";
import { Switch } from "@/ui/components/switch";

/**
 * Whether this order reached Meta, and the merchant's per-order opt-out
 * (backend `docs/plan/meta-pixel-capi.md` D19).
 *
 * **The toggle is disabled once the order has been reported, and says why.** Meta has no
 * purchase-deletion, so flipping it afterwards changes nothing — and a merchant who believes
 * they took a sale back is worse off than one who is told plainly that they cannot. The backend
 * refuses the same write; this is the half the merchant can see.
 *
 * Renders nothing when the store has no Meta integration: a panel explaining an unused feature
 * on every order page is noise.
 */
export function OrderMetaPanel({
  order,
  configured,
}: {
  order: AdminStorefrontOrder;
  /** The store has a pixel connected. From `useGetMetaSettings().capiReady`. */
  configured: boolean;
}) {
  const setExcluded = useSetOrderExcludedFromMeta();
  if (!configured) return null;

  const sent = order.meta?.purchaseSent === true;
  const excluded = order.excludeFromMeta === true;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Meta ads</h3>
        {sent ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="size-3.5" /> Reported
          </Badge>
        ) : excluded ? (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <CircleSlash className="size-3.5" /> Excluded
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Clock className="size-3.5" /> Not yet
          </Badge>
        )}
      </div>

      {sent ? (
        <p className="text-xs text-muted-foreground">
          Counted as a purchase
          {order.meta?.purchaseSentAt
            ? ` on ${new Date(order.meta.purchaseSentAt).toLocaleString()}`
            : ""}
          . Cancellations and returns after this point can&apos;t be taken back from Meta&apos;s
          reporting.
        </p>
      ) : null}

      <label className="flex items-start justify-between gap-4">
        <span>
          <span className="text-sm font-medium">Don&apos;t report this order</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {sent ? (
              <span className="flex items-start gap-1">
                <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                Already sent to Meta — this can no longer be changed.
              </span>
            ) : (
              "For a personal, internal or test order."
            )}
          </span>
        </span>
        <Switch
          checked={excluded}
          disabled={sent || setExcluded.isPending}
          onCheckedChange={(next) =>
            setExcluded.mutate({ orderId: order._id as string, excluded: next })
          }
        />
      </label>
    </div>
  );
}
