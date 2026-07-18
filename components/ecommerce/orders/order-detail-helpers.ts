// coding-standard: maintained
import type { StatusBadgeProps } from "@/ui/components/status-badge";

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

export const STEP_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
};

export const ORDER_STATUS_BADGE: Record<string, StatusBadgeProps["status"]> = {
  pending: "pending",
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  // Reuse existing badge variants for the pickup branch.
  ready_for_pickup: "shipped",
  picked_up: "delivered",
  returned: "returned",
  cancelled: "cancelled",
  rejected: "rejected",
};

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
