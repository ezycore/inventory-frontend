// coding-standard: maintained
import type { AdminStorefrontOrder } from "@/services/api";
import { actorLabel, cap, longDate } from "./order-detail-helpers";

/** Reverse-chronological order timeline built from `statusHistory` + placement. */
export function OrderActivityLog({ order }: { order: AdminStorefrontOrder }) {
  const events = [
    ...(order.statusHistory ?? []).map((e) => ({
      text: `Order ${cap(e.status)}`,
      at: e.at,
      by: e.by,
    })),
    { text: "Order placed", at: order.createdAt, by: "shopper" },
  ]
    .slice()
    .reverse();

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
