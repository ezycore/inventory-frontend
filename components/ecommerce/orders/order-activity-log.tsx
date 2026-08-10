// coding-standard: maintained
import type { AdminStorefrontOrder } from "@/services/api";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { actorLabel, longDate } from "./order-detail-helpers";

/**
 * Reverse-chronological order timeline built from `statusHistory` + placement.
 *
 * Reads the org's step wording like every other admin surface — this log used to
 * capitalize the raw status key, which would have printed "Order Shipped" directly
 * beneath a stepper reading the merchant's own name for that step.
 *
 * **"Moved to X", not "Order X".** The old prefix only read as English because the
 * canonical keys happen to be participles ("Order Shipped"). A merchant's own
 * wording is a noun phrase, so the same template produced "Order Needs review" and
 * "Order Cash collected". "Moved to" reads correctly for both, and keeps the entry
 * distinct from the "Order placed" row below it.
 */
export function OrderActivityLog({ order }: { order: AdminStorefrontOrder }) {
  const { labelFor } = useOrderStatusLabels();

  const events = [
    ...(order.statusHistory ?? []).map((e) => ({
      text: `Moved to ${labelFor(e.status)}`,
      at: e.at,
      by: e.by,
    })),
    { text: "Order placed", at: order.createdAt, by: "shopper" },
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-none flex-col items-center">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
            {i < events.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-4">
            <div className="text-sm font-medium">{ev.text}</div>
            <div className="text-xs text-muted-foreground">
              {longDate(String(ev.at))} · {actorLabel(ev.by)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
