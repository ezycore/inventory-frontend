// coding-standard: maintained

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

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const longDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const actorLabel = (by?: string) =>
  by === "shopper" ? "Customer" : by === "system" ? "System" : by ? "Staff" : "—";
