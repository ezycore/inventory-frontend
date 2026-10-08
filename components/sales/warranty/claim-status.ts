// coding-standard: maintained
import type { WarrantyClaimStatus } from "@/services/api";

/**
 * Where a claim may go next — a mirror of the backend `CLAIM_TRANSITIONS`
 * (`warranty-claim.service.ts`). The server refuses anything else; this only
 * decides which choices to offer. `replaced` is reached through its own
 * action, because it moves stock.
 */
export const CLAIM_TRANSITIONS: Record<WarrantyClaimStatus, readonly WarrantyClaimStatus[]> = {
  received: ["in_repair", "sent_to_supplier", "ready", "rejected"],
  in_repair: ["sent_to_supplier", "ready", "rejected"],
  sent_to_supplier: ["in_repair", "ready", "rejected"],
  ready: ["returned_to_customer"],
  replaced: ["returned_to_customer"],
  rejected: ["returned_to_customer"],
  returned_to_customer: [],
};

/** Mirror of the backend `REPLACEABLE_STATUSES`. */
export const canReplace = (status: WarrantyClaimStatus): boolean =>
  status === "received" || status === "in_repair" || status === "sent_to_supplier";

export const CLAIM_STATUSES = Object.keys(CLAIM_TRANSITIONS) as WarrantyClaimStatus[];

/** Badge tone per status: open work, done well, done badly. */
export const claimStatusTone = (status: WarrantyClaimStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "rejected") return "destructive";
  if (status === "ready" || status === "replaced") return "default";
  if (status === "returned_to_customer") return "outline";
  return "secondary";
};
