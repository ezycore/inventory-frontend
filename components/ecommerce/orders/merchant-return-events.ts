// coding-standard: maintained
import type { AdminStorefrontOrder } from "@/services/api";

type CourierEvent = NonNullable<
  NonNullable<AdminStorefrontOrder["courier"]>["history"]
>[number];

/**
 * The parcel's feed, ending with the merchant's own word that it came back.
 *
 * A courier does not always say so. Steadfast's last return message is "Return status has been
 * updated to Processing" — every one of them, for every store, since the first on 2026-09-21; none
 * has ever advanced — so a feed ending there looked stuck on a parcel the merchant had long since
 * taken back (UriiBaba ORD-20261004-00014). The merchant's **Return whole order** / **Return items**
 * is what records the goods are back, so each return on the order becomes a row here.
 *
 * Read-time only, from `order.returns[]` (one entry per return, dated): nothing is written to the
 * courier's history, which stays the courier's record, and past orders read right with no backfill.
 * The last return of an order now `returned` is the whole (or the rest of the) order; any other is
 * part of it. A legacy order with no `returns[]` falls back to its `returned` status change.
 */
export function withMerchantReturns(order: AdminStorefrontOrder): CourierEvent[] {
  const history = order.courier?.history ?? [];
  const returns = (order.returns ?? []).filter((entry) => entry.at);
  const whole = order.status === "returned";

  const rows: CourierEvent[] = returns.map((entry, index) => ({
    status: "returned",
    returnStage: "back",
    at: entry.at as string,
    label:
      whole && index === returns.length - 1
        ? returns.length > 1
          ? "Rest of the order received back — returned by you"
          : "Parcel received back — returned by you"
        : "Items received back — part of the order returned by you",
  }));

  if (!rows.length && whole) {
    const changed = [...(order.statusHistory ?? [])].reverse().find((e) => e.status === "returned");
    if (changed?.at) {
      rows.push({
        status: "returned",
        returnStage: "back",
        at: changed.at,
        label: "Parcel received back — returned by you",
      });
    }
  }

  if (!rows.length) return history;
  // Ascending, as stored — the timeline flips it so the newest row is on top.
  return [...history, ...rows].sort(
    (a, b) => new Date(a.at ?? 0).getTime() - new Date(b.at ?? 0).getTime(),
  );
}
