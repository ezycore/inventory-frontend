// coding-standard: maintained
import type { ReturnDetailsData } from "@/components/shared/returns";

/**
 * Money that actually went back to the customer on a return: cash out of an account plus store
 * credit. On a COD parcel the shopper refused this is ৳0 — the sale was reversed, nobody was paid
 * (G7, `docs/features/business-modes.md` in the backend). The return screen and the printed return
 * both read it here so they cannot disagree.
 */
export const refundedOnReturn = (
  data: Pick<ReturnDetailsData, "refundAllocation" | "refundedAmount">,
): number =>
  (data.refundAllocation?.accountRefund?.amount ?? data.refundedAmount ?? 0) +
  (data.refundAllocation?.counterpartyCredit?.amount ?? 0);
