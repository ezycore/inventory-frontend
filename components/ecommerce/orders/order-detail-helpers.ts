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
