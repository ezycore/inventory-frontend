// coding-standard: maintained
import { getOrgTimezone } from "@/hooks/use-org-calendar";

/** The forward delivery pipeline (terminal Cancelled/Rejected sit outside it). */
export const DELIVERY_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;

/** Pickup skips the courier legs: it goes ready-for-pickup → picked-up. */
export const PICKUP_STEPS = [
  "pending",
  "confirmed",
  "ready_for_pickup",
  "picked_up",
] as const;

// Step labels and badge variants live in `lib/order-status.ts` — one source for
// every admin surface, because merchants can rename the steps per organization.
// Read them through `useOrderStatusLabels()`, never from a local copy.

/**
 * What the courier is actually asked to bring back: the order total less any
 * advance already taken.
 *
 * One function because three panels and the collection dialog all show this
 * number, and the dialog once computed it as the bare `totalAmount` — so a
 * ৳3,450 order with ৳150 prepaid asked the rider for the full ৳3,450 while the
 * panel beside it said ৳3,300, and no honest collection could reconcile.
 * The backend derives `expected` the same way.
 */
export const codToCollect = (order: {
  totalAmount?: number;
  prepaidAmount?: number;
}) => Math.max(0, (order.totalAmount ?? 0) - (order.prepaidAmount ?? 0));

type CollectionOrder = {
  fulfillmentType?: string;
  paymentMethod?: string;
  status?: string;
  courier?: { integration?: string; provider?: string; name?: string } | null;
};

/**
 * What the two collection buttons say. They record what was COLLECTED AT THE DOOR — on a courier
 * parcel that money is with the courier, not the merchant (paying it over is Courier Payouts). The
 * old "Mark COD collected" read as "the money is in my hand", so the courier is named.
 */
export const collectionLabels = (order: CollectionOrder, amount: string) => {
  const viaCourier = order.fulfillmentType !== "pickup" && !!order.courier;
  if (viaCourier) {
    return { full: `Courier collected ${amount}`, less: "Courier collected less…" };
  }
  return {
    full: order.paymentMethod === "cod" ? `Customer paid ${amount}` : "Mark as paid",
    less: "Customer paid less…",
  };
};

/**
 * A shipped parcel with a connected courier: the courier reports the delivery and the app
 * records the collection itself, so a collection button here would book money before anyone
 * said the parcel arrived. Items that came back still go through Return items.
 */
export const awaitsCourierReport = (order: CollectionOrder) =>
  order.status === "shipped" && order.courier?.integration === "api";

/**
 * The confirm prompt, in order language. Asked only where confirming has a hidden effect — with
 * stock tracking it holds the items. Without stock, Confirm only moves the order on and can be
 * cancelled until it ships, so it confirms in one click. The old copy talked about a "sale" being
 * booked, which a storefront-only merchant never sees (2026-10-10).
 */
export const confirmOrderPrompt = (itemCount: number, isPickup: boolean) => ({
  title: "Confirm this order?",
  description: `This holds ${itemCount} item${itemCount === 1 ? "" : "s"} in stock for this order. Cancelling before you ${
    isPickup ? "mark it ready for pickup" : "ship it"
  } puts them back.`,
  actionLabel: "Confirm order",
});

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const longDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: getOrgTimezone(),
  });

// "courier" is what a courier's poll or push writes (and an automatic return, G3). It read
// "Staff" until 2026-10-10 — the activity log credited a person with Pathao's delivery (G14).
const ACTOR_LABELS: Record<string, string> = {
  shopper: "Customer",
  system: "System",
  courier: "Courier",
};

export const actorLabel = (by?: string) =>
  by ? (ACTOR_LABELS[by] ?? "Staff") : "—";
