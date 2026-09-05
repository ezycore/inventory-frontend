// coding-standard: maintained

import type { AdminRenameableOrderStatus } from "@/types";
import type { StatusBadgeProps } from "@/ui/components/status-badge";

/**
 * Presentation for a storefront order's status — the single source shared by
 * every admin surface that spells one out: the detail stepper, the badges on the
 * list / dashboard / customer pages, the status filter tabs, the activity log and
 * the action buttons.
 *
 * This map used to be copy-pasted into four files, which was survivable while the
 * labels were constants. It stopped being survivable once merchants could rename
 * them: four copies means four places to thread the override through, and the one
 * that gets missed shows the old wording next to the new one in the same viewport.
 *
 * Shopper-facing presentation is NOT here. The tracking page renders from
 * `storefront-i18n` (per language) and notifications from the event templates
 * (per event); both are deliberately independent of the admin's wording.
 */

/** The colour variant each status maps onto in the shared `StatusBadge`. */
export const ORDER_STATUS_BADGE: Record<string, StatusBadgeProps["status"]> = {
  pending: "pending",
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  // The pickup branch reuses the delivery branch's variants: "ready" reads like
  // shipped (in motion) and "collected" like delivered (done).
  ready_for_pickup: "shipped",
  picked_up: "delivered",
  returned: "returned",
  // Reuses the returned variant: part of the parcel came back, so it reads as a
  // return rather than as a completed delivery. The order is still payable —
  // that distinction lives in the payment panel, not the badge.
  partially_returned: "returned",
  cancelled: "cancelled",
  rejected: "rejected",
};

/** Built-in wording, used whenever the merchant has not overridden a step. */
export const DEFAULT_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  returned: "Returned",
  partially_returned: "Partly returned",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

/**
 * The steps a merchant may rename, in pipeline order, with a plain description
 * of what the system actually does at each one. The settings editor shows the
 * description beside the input: a merchant renaming "Shipped" needs to know that
 * step books the Sale and deducts stock, or they will rename it to something that
 * describes a different moment in their process.
 */
export const RENAMEABLE_ORDER_STATUSES: {
  status: AdminRenameableOrderStatus;
  effect: string;
}[] = [
  { status: "pending", effect: "The order has been placed and is awaiting your review. Nothing is reserved yet." },
  { status: "confirmed", effect: "Stock is held for the order. It is not sold yet, and cancelling still releases it." },
  { status: "processing", effect: "Optional prep step. Nothing changes in stock or accounts — it is a marker for your team." },
  { status: "shipped", effect: "Books the Sale: stock is deducted for real, revenue and cost are posted. Reversing needs a Return." },
  { status: "delivered", effect: "The parcel reached the customer. Closes the order." },
  { status: "ready_for_pickup", effect: "Pickup orders only. Books the Sale, exactly as Shipped does for delivery orders." },
  { status: "picked_up", effect: "The customer collected the order. Closes it." },
];

/**
 * Merge a merchant's overrides over the built-in labels. Blank entries fall
 * through, so clearing the field in the settings form restores the default
 * rather than rendering an empty stepper node.
 */
export const resolveOrderStatusLabels = (
  overrides: Partial<Record<string, string>> | undefined,
): Record<string, string> => {
  if (!overrides) return DEFAULT_ORDER_STATUS_LABELS;
  const merged = { ...DEFAULT_ORDER_STATUS_LABELS };
  for (const [status, label] of Object.entries(overrides)) {
    const trimmed = label?.trim();
    if (trimmed) merged[status] = trimmed;
  }
  return merged;
};

/**
 * Label for a status the map does not know (a new backend status that shipped
 * before this file learned about it). Renders "ready_for_pickup" as
 * "Ready for pickup" rather than dropping the badge's text entirely.
 */
export const humanizeOrderStatus = (status: string): string =>
  status
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
