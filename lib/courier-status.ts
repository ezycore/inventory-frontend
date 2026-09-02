// coding-standard: maintained

/**
 * Presentation for a courier's normalized delivery status — the single source
 * shared by the admin fulfillment panel and the shopper tracking timeline.
 *
 * The backend stores the raw provider string on `order.courier.status` (ugly and
 * provider-specific: `delivered_approval_pending`, `Initiated`, …) and a
 * `normalizedStatus` mapped through its `normalizeStatus`. Both UIs render off the
 * NORMALIZED value so one clean label reads the same whether the parcel is on
 * Steadfast, Pathao, or eCourier. The raw string stays admin-only.
 */
export type CourierNormalizedStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "returned"
  | "cancelled"
  | "unknown";

interface CourierStatusPresentation {
  /** Merchant-facing label (English only — the admin app is not bilingual). */
  admin: string;
  /** Shopper-facing label, per storefront language. */
  shopper: { en: string; bn: string };
  /** Semantic tone hex (matches the storefront ORDER_STATUS `c` palette). */
  tone: string;
}

export const COURIER_STATUS: Record<
  CourierNormalizedStatus,
  CourierStatusPresentation
> = {
  pending: {
    admin: "Awaiting pickup",
    shopper: { en: "Awaiting courier pickup", bn: "কুরিয়ার পিকআপের অপেক্ষায়" },
    tone: "#b45309",
  },
  in_transit: {
    admin: "In transit",
    shopper: { en: "On the way", bn: "পথে আছে" },
    tone: "#0e7490",
  },
  delivered: {
    admin: "Delivered",
    shopper: { en: "Delivered by rider", bn: "রাইডার ডেলিভারি করেছেন" },
    tone: "#15803d",
  },
  returned: {
    admin: "Returned",
    shopper: { en: "Returned to sender", bn: "প্রেরকের কাছে ফেরত" },
    tone: "#c2410c",
  },
  cancelled: {
    admin: "Cancelled",
    shopper: { en: "Order cancelled", bn: "অর্ডার বাতিল" },
    tone: "#b91c1c",
  },
  unknown: {
    admin: "Status unavailable",
    shopper: { en: "Tracking update pending", bn: "ট্র্যাকিং আপডেট আসছে" },
    tone: "#475467",
  },
};

/**
 * Bangla for the phase headings a carrier groups its events under — Pathao's
 * `grouped_status`, the only source of them today.
 *
 * The headings arrive in the provider's English, and so do the event sentences
 * beneath them ("Received at pickup hub: Rayerbag."), which we cannot translate:
 * they are free text written by the courier, naming hubs and riders. Translating
 * the *heading* is what makes the difference for a Bangla shopper — the phase is
 * the part they need ("where is my parcel"), and it is a small closed vocabulary,
 * while the detail underneath is a bonus either way.
 *
 * Keys are canonicalized the same way the backend canonicalizes them (lower-case,
 * runs of spaces/underscores/hyphens collapsed to one space), so "Ready For
 * Delivery" and `Ready_for_Delivery` are the same entry. An unknown heading falls
 * back to the provider's own wording rather than disappearing — a carrier adding a
 * phase must not blank the timeline.
 */
const COURIER_GROUP_BN: Record<string, string> = {
  accepted: "গৃহীত",
  picked: "পিকআপ হয়েছে",
  "ready for delivery": "ডেলিভারির জন্য প্রস্তুত",
  delivered: "ডেলিভারি হয়েছে",
  "partial delivery": "আংশিক ডেলিভারি",
  "on hold": "স্থগিত",
  return: "ফেরত",
  returned: "ফেরত",
  cancelled: "বাতিল",
};

/** The carrier's phase heading in the shopper's language, or its own wording. */
export function courierGroupLabel(group: string, bn: boolean): string {
  if (!bn) return group;
  const key = group.replace(/[\s_-]+/g, " ").trim().toLowerCase();
  return COURIER_GROUP_BN[key] ?? group;
}

/** Resolve presentation for a status, falling back to `unknown` for any stray value. */
export function courierStatusPresentation(
  status: string | null | undefined,
): CourierStatusPresentation {
  return COURIER_STATUS[(status as CourierNormalizedStatus) ?? "unknown"] ?? COURIER_STATUS.unknown;
}
