// coding-standard: maintained
import { describe, expect, it } from "vitest";

import type { AdminStorefrontOrder } from "@/services/api";
import { withMerchantReturns } from "./merchant-return-events";

const steadfastFeed = [
  { status: "delivered", code: "delivery_status", at: "2026-10-06T08:27:16.000Z", label: "Consignment marked as partially delivered by rider." },
  { status: "delivered", code: "return_status", at: "2026-10-07T08:22:59.000Z", label: "Consignment Return status has been updated to Processing" },
];

const order = (over: Record<string, unknown>) =>
  ({ courier: { provider: "steadfast", history: steadfastFeed }, ...over }) as unknown as AdminStorefrontOrder;

describe("withMerchantReturns", () => {
  it("ends a Steadfast feed stuck on Processing with the merchant's return (live: ORD-20261004-00014)", () => {
    const feed = withMerchantReturns(
      order({ status: "returned", returns: [{ salesReturnId: "r1", at: "2026-10-07T12:52:10.000Z" }] }),
    );
    expect(feed).toHaveLength(3);
    expect(feed.at(-1)).toMatchObject({
      label: "Parcel received back — returned by you",
      returnStage: "back",
    });
  });

  it("a part return, then the rest: two rows, in date order", () => {
    const feed = withMerchantReturns(
      order({
        status: "returned",
        returns: [
          { salesReturnId: "r1", at: "2026-10-08T05:00:00.000Z" },
          { salesReturnId: "r2", at: "2026-10-09T05:00:00.000Z" },
        ],
      }),
    );
    expect(feed.slice(-2).map((e) => e.label)).toEqual([
      "Items received back — part of the order returned by you",
      "Rest of the order received back — returned by you",
    ]);
  });

  it("an order still partly returned reads as part, never whole", () => {
    const feed = withMerchantReturns(
      order({ status: "partially_returned", returns: [{ salesReturnId: "r1", at: "2026-10-08T05:00:00.000Z" }] }),
    );
    expect(feed.at(-1)?.label).toBe("Items received back — part of the order returned by you");
  });

  it("an older order with no returns list falls back to its Returned status change", () => {
    const feed = withMerchantReturns(
      order({ status: "returned", statusHistory: [{ status: "returned", at: "2026-10-08T05:00:00.000Z" }] }),
    );
    expect(feed.at(-1)?.label).toBe("Parcel received back — returned by you");
  });

  it("no return recorded: the courier's feed, untouched", () => {
    const o = order({ status: "shipped" });
    expect(withMerchantReturns(o)).toBe(o.courier!.history);
  });
});
