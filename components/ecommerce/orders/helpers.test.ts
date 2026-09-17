// coding-standard: maintained

import { describe, expect, it } from "vitest";
import type { AdminStorefrontOrder, OrderStats } from "@/services/api";
import {
  confirmableOrders,
  isTabActive,
  deletableOrders,
  getOrderStats,
  isDeletableOrder,
  buyerHistoryIsWarning,
  buyerHistoryLabel,
  orderAge as orderAgeIn,
  orderItemCount,
  paymentMethodLabel,
  rejectionReasonLabel,
  rejectableOrders,
} from "./helpers";

/**
 * The order-list stat cards.
 *
 * These exist because the row was quietly lying about money. "Collected today"
 * reported what the courier was *asked* for rather than what they handed over,
 * and there was no tile at all for the difference — so a day with ৳4,950 of
 * goods refused at the door looked identical to a day with none. The arithmetic
 * is the server's; what is asserted here is that the row shows the returns at
 * all, keeps the two kinds apart, and does not shout in alarm colours over a
 * zero.
 */
const stats = (over: Partial<OrderStats> = {}): OrderStats =>
  ({
    pending: { count: 0, value: 0 },
    confirmedProcessing: { count: 0, value: 0 },
    inTransitCod: { count: 2, value: 3720 },
    awaitingPickup: { count: 0, value: 0 },
    deliveredUncollected: { count: 0, value: 0 },
    collectedToday: { count: 3, value: 8280 },
    fullyReturnedToday: { count: 0, value: 0 },
    partlyReturnedToday: { count: 0, value: 0 },
    gatewayPaid: { count: 0, value: 0 },
    byCourier: [],
    byFulfillment: [{ type: "delivery", count: 7 }],
    byChannel: [],
    ...over,
  }) as OrderStats;

const tile = (data: ReturnType<typeof getOrderStats>, label: string) =>
  data.find((d) => d.label === label);

describe("getOrderStats", () => {
  it("shows both kinds of return, kept apart", () => {
    const data = getOrderStats(
      stats({
        fullyReturnedToday: { count: 1, value: 1860 },
        partlyReturnedToday: { count: 2, value: 4800 },
      }),
      "BDT",
    );

    // A full RTO and a sale that merely shrank are different problems with
    // different fixes, so they must never be summed into one "returns" tile.
    expect(tile(data, "Returned today")?.value).toBe("৳1,860");
    expect(tile(data, "Returned today")?.description).toBe("1 order");
    expect(tile(data, "Partly returned today")?.value).toBe("৳4,800");
    expect(tile(data, "Partly returned today")?.description).toBe("2 orders");
  });

  it("renders the return tiles even at zero", () => {
    const data = getOrderStats(stats(), "BDT");
    // "Nothing came back today" is real news on a COD business — unlike a
    // pickup tile on a delivery-only shop, which is a zero that means
    // "inapplicable" and is dropped below.
    expect(tile(data, "Returned today")?.value).toBe("৳0");
    expect(tile(data, "Partly returned today")?.value).toBe("৳0");
  });

  it("keeps alarm colours for tiles that actually hold money", () => {
    const quiet = getOrderStats(stats(), "BDT");
    expect(tile(quiet, "Delivered · uncollected")?.variant).toBe("default");
    expect(tile(quiet, "Returned today")?.variant).toBe("default");

    const loud = getOrderStats(
      stats({
        deliveredUncollected: { count: 1, value: 1860 },
        fullyReturnedToday: { count: 1, value: 1860 },
        partlyReturnedToday: { count: 1, value: 3000 },
      }),
      "BDT",
    );
    expect(tile(loud, "Delivered · uncollected")?.variant).toBe("danger");
    expect(tile(loud, "Returned today")?.variant).toBe("danger");
    expect(tile(loud, "Partly returned today")?.variant).toBe("warning");
  });

  it("drops the pickup tile for a store that never takes pickups", () => {
    expect(tile(getOrderStats(stats(), "BDT"), "Awaiting pickup")).toBeUndefined();
    expect(
      tile(
        getOrderStats(
          stats({
            byFulfillment: [
              { type: "delivery", count: 7 },
              { type: "pickup", count: 1 },
            ],
          }),
          "BDT",
        ),
        "Awaiting pickup",
      ),
    ).toBeDefined();
  });

  it("renders a full row of zeroes while the stats are still loading", () => {
    // `undefined` is the pre-fetch state, and the row must not throw on it —
    // `byFulfillment` is read for the pickup decision before any data exists.
    const data = getOrderStats(undefined, "BDT");
    expect(data.every((d) => d.value === "৳0")).toBe(true);
    expect(tile(data, "Awaiting pickup")).toBeUndefined();
  });
});

/**
 * Which orders each bulk action may act on.
 *
 * These are the client's half of a rule the server owns, and the failure mode is
 * not an exception — it is a merchant being *offered* something. Offer too much
 * and they press a button that refuses; offer too little and an order silently
 * drops out of a count with no explanation. Both look fine in a screenshot.
 *
 * The row menu and the bulk bar share these, which is the point: they disagreed
 * at first, and a rejected order holding a prepayment showed a Delete item that
 * could only ever fail, right beside a count that excluded it.
 */
const order = (over: Partial<AdminStorefrontOrder> = {}): AdminStorefrontOrder =>
  ({
    _id: "o1",
    orderNumber: "ORD-1",
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "cod",
    totalAmount: 560,
    ...over,
  }) as AdminStorefrontOrder;

/** Every fixture below is selected — the selection half is asserted separately. */
const all = (items: AdminStorefrontOrder[]) => new Set(items.map((o) => o._id));

describe("confirmableOrders", () => {
  it("takes pending orders only", () => {
    const items = [
      order({ _id: "a", status: "pending" }),
      order({ _id: "b", status: "confirmed" }),
      order({ _id: "c", status: "delivered" }),
    ];

    expect(confirmableOrders(items, all(items)).map((o) => o._id)).toEqual(["a"]);
  });

  it("ignores a pending order that is not selected", () => {
    const items = [order({ _id: "a" }), order({ _id: "b" })];

    expect(confirmableOrders(items, new Set(["b"])).map((o) => o._id)).toEqual([
      "b",
    ]);
  });
});

describe("rejectableOrders", () => {
  it("drops a pending order carrying a prepayment", () => {
    // The bulk bar cannot ask refund-or-keep, and answering it silently would
    // move real cash — so this one is rejected from the row instead.
    const items = [
      order({ _id: "a" }),
      order({ _id: "b", prepaidAmount: 200 }),
    ];

    expect(rejectableOrders(items, all(items)).map((o) => o._id)).toEqual(["a"]);
  });

  it("is otherwise the confirmable set", () => {
    const items = [
      order({ _id: "a" }),
      order({ _id: "b" }),
      order({ _id: "c", status: "shipped" }),
    ];

    expect(rejectableOrders(items, all(items))).toHaveLength(2);
  });

  it("counts a zero prepayment as no prepayment", () => {
    const items = [order({ _id: "a", prepaidAmount: 0 })];

    expect(rejectableOrders(items, all(items))).toHaveLength(1);
  });
});

describe("isDeletableOrder", () => {
  it("accepts a rejected or cancelled order with nothing on it", () => {
    expect(isDeletableOrder(order({ status: "rejected" }))).toBe(true);
    expect(isDeletableOrder(order({ status: "cancelled" }))).toBe(true);
  });

  const liveStatuses: AdminStorefrontOrder["status"][] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];
  it.each(liveStatuses)("refuses a live order (%s)", (status) => {
    expect(isDeletableOrder(order({ status }))).toBe(false);
  });

  it("refuses a returned order — closed, but always carries a Sale", () => {
    // Deliberately not in the deletable set: it is already excluded by `saleId`,
    // and offering it would only produce the wrong error message.
    expect(isDeletableOrder(order({ status: "returned" }))).toBe(false);
  });

  it("refuses a committed order", () => {
    expect(
      isDeletableOrder(order({ status: "rejected", saleId: "sale-1" })),
    ).toBe(false);
  });

  it("refuses a cancelled order the merchant kept the prepayment on", () => {
    // Cancelling WITHOUT a refund is supported, so money can sit on a status
    // that otherwise reads deletable. This is why the money check is not
    // redundant with the status check.
    expect(
      isDeletableOrder(order({ status: "cancelled", prepaidAmount: 200 })),
    ).toBe(false);
  });

  // Annotated rather than inferred: an inline `it.each` table widens
  // `paymentStatus` to `string`, which the union on the real type rejects.
  const moneySeen: [string, Partial<AdminStorefrontOrder>][] = [
    ["paidAt", { paidAt: "2026-09-08T00:00:00.000Z" }],
    ["paymentStatus paid", { paymentStatus: "paid" }],
    ["paymentStatus refunded", { paymentStatus: "refunded" }],
  ];
  it.each(moneySeen)("refuses an order that saw money (%s)", (_label, over) => {
    expect(isDeletableOrder(order({ status: "rejected", ...over }))).toBe(false);
  });

  it("refuses one handed to an integrated courier", () => {
    expect(
      isDeletableOrder(
        order({
          status: "rejected",
          courier: { provider: "pathao", consignmentId: "DU080926MAGWNL" },
        }),
      ),
    ).toBe(false);
  });

  it("refuses a MANUAL dispatch, which has a name and no consignment id", () => {
    // The trap: a check reading `consignmentId` alone would offer to delete a
    // parcel that had already left the building.
    expect(
      isDeletableOrder(order({ status: "rejected", courier: { name: "Rider bhai" } })),
    ).toBe(false);
  });
});

describe("deletableOrders", () => {
  it("takes the selected orders that pass every rule", () => {
    const items = [
      order({ _id: "a", status: "rejected" }),
      order({ _id: "b", status: "cancelled" }),
      order({ _id: "c", status: "rejected", prepaidAmount: 200 }),
      order({ _id: "d", status: "pending" }),
    ];

    expect(deletableOrders(items, all(items)).map((o) => o._id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("ignores a deletable order that is not selected", () => {
    const items = [
      order({ _id: "a", status: "rejected" }),
      order({ _id: "b", status: "rejected" }),
    ];

    expect(deletableOrders(items, new Set(["a"])).map((o) => o._id)).toEqual([
      "a",
    ]);
  });

  it("is empty when nothing selected qualifies", () => {
    const items = [order({ _id: "a", status: "delivered" })];

    expect(deletableOrders(items, all(items))).toEqual([]);
  });
});

describe("isTabActive", () => {
  it("marks the tab whose value matches", () => {
    expect(isTabActive("pending", "pending")).toBe(true);
    expect(isTabActive("pending", "shipped")).toBe(false);
  });

  it("marks All when no status is set", () => {
    expect(isTabActive("", "")).toBe(true);
  });

  it("marks Closed for its own value", () => {
    expect(isTabActive("closed", "closed")).toBe(true);
  });

  it.each(["returned", "cancelled", "rejected"])(
    "marks Closed for a deep link carrying %s",
    (status) => {
      // The ecommerce dashboard's "Returned today" tile still links to
      // `?status=returned`. Folding the three terminal states into one tab left
      // that link filtering the list correctly under a strip with nothing
      // highlighted — eight rows and an apparently unselected "All".
      expect(isTabActive("closed", status)).toBe(true);
    },
  );

  it("does not mark Closed for a live status", () => {
    expect(isTabActive("closed", "pending")).toBe(false);
    expect(isTabActive("closed", "")).toBe(false);
  });

  it("does not mark a live tab from the closed group", () => {
    expect(isTabActive("delivered", "returned")).toBe(false);
  });

  it("marks Shipped for a pickup order that is ready to collect", () => {
    // The pickup branch has no tab of its own — `ready_for_pickup` is its "in
    // motion" and rides under Shipped, mirroring the server's `ORDER_TABS`.
    // Before that it was in no tab at all, so a pickup-only shop watched Shipped
    // and Delivered sit at zero while its orders moved.
    expect(isTabActive("shipped", "ready_for_pickup")).toBe(true);
  });

  it("marks Delivered for a collected pickup order", () => {
    expect(isTabActive("delivered", "picked_up")).toBe(true);
  });

  it("marks Delivered for a partly returned order", () => {
    // Not Closed: the goods the customer kept are still payable, so it is live
    // work — which is the whole distinction between it and `returned`.
    expect(isTabActive("delivered", "partially_returned")).toBe(true);
    expect(isTabActive("closed", "partially_returned")).toBe(false);
  });
});

describe("paymentMethodLabel", () => {
  it("spells COD as an initialism, not a word", () => {
    // `capitalize` rendered this as "Cod" on every row of the list.
    expect(paymentMethodLabel("cod")).toBe("COD");
  });

  it("spells the ordinary nouns as words, not shouting", () => {
    // `uppercase` on the detail panel rendered these as "BANK" / "MANUAL".
    expect(paymentMethodLabel("bank")).toBe("Bank");
    expect(paymentMethodLabel("manual")).toBe("Manual");
  });

  it("shows the merchant's own wording when the order carries it", () => {
    // The normal path for a merchant-defined method: the order snapshotted its
    // title when it was placed, so the packer sees "bKash payment", not "Manual".
    expect(paymentMethodLabel("bkash", undefined, "bKash payment")).toBe("bKash payment");
  });

  it("prefers the store's current definition when there is no snapshot", () => {
    expect(paymentMethodLabel("nagad", [{ id: "nagad", title: "Nagad" }])).toBe("Nagad");
  });

  it("falls through to the raw id rather than mangling it", () => {
    // This used to capitalize ("Bkash"). That made sense while ids were words we
    // shipped; they are merchant SLUGS now, and capitalizing one reads as
    // "Bkash-payment" — a fake title, and worse than admitting we have neither a
    // snapshot nor a definition for it.
    expect(paymentMethodLabel("bkash-payment")).toBe("bkash-payment");
  });
});

describe("orderAge", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const TZ = "Asia/Dhaka";
  const orderAge = (iso: string, at: Date) => orderAgeIn(iso, at, TZ);

  it("reads in the unit that matters for a COD queue", () => {
    expect(orderAge(ago(30 * 1000), now)).toBe("now");
    expect(orderAge(ago(9 * 60_000), now)).toBe("9m");
    expect(orderAge(ago(5 * 3_600_000), now)).toBe("5h");
    expect(orderAge(ago(2 * 86_400_000), now)).toBe("2d");
  });

  it("falls back to the date once the age stops being actionable", () => {
    // Past four weeks "31d" tells a merchant nothing they can act on, and the
    // date is the more useful fact.
    expect(orderAge("2026-07-04T09:00:00.000Z", now)).toBe("04-07-2026");
  });

  it("prints that date on the organization's calendar, not the browser's", () => {
    // 20:00Z on 4 July is 02:00 on 5 July in Dhaka.
    expect(orderAge("2026-07-04T20:00:00.000Z", now)).toBe("05-07-2026");
  });

  it("never prints a negative age when the clocks disagree", () => {
    // Server ahead of the browser is normal; "-3m" on a row is not.
    expect(orderAge(new Date(now.getTime() + 3 * 60_000).toISOString(), now)).toBe(
      "now",
    );
  });

  it("crosses each boundary at the right place", () => {
    expect(orderAge(ago(59 * 60_000), now)).toBe("59m");
    expect(orderAge(ago(60 * 60_000), now)).toBe("1h");
    expect(orderAge(ago(23 * 3_600_000), now)).toBe("23h");
    expect(orderAge(ago(24 * 3_600_000), now)).toBe("1d");
  });
});

describe("orderItemCount", () => {
  it("counts units, not lines", () => {
    // Three of one product is three items to a merchant packing a parcel.
    expect(orderItemCount([{ quantity: 3 }])).toBe(3);
    expect(orderItemCount([{ quantity: 2 }, { quantity: 1 }])).toBe(3);
    expect(orderItemCount([])).toBe(0);
  });
});

describe("rejectionReasonLabel", () => {
  it("spells the stored value the way the dialog offered it", () => {
    expect(rejectionReasonLabel("fake_number")).toBe("Fake number");
  });

  it("is absent for an order that was never rejected", () => {
    expect(rejectionReasonLabel(undefined)).toBeUndefined();
  });

  it("passes an unmapped value through readable", () => {
    // Rejections predating the field, or a bucket the server adds first.
    expect(rejectionReasonLabel("wrong_address")).toBe("wrong address");
  });
});

describe("buyerHistoryLabel", () => {
  it("says nothing about a first-time buyer", () => {
    // A chip on every row is a chip nobody reads.
    expect(buyerHistoryLabel({ orders: 1, rejected: 0 })).toBeUndefined();
    expect(buyerHistoryLabel({ orders: 1, rejected: 1 })).toBeUndefined();
    expect(buyerHistoryLabel(undefined)).toBeUndefined();
  });

  it("reports the whole record once there is a repeat", () => {
    expect(buyerHistoryLabel({ orders: 5, rejected: 3 })).toBe(
      "5 orders · 3 rejected",
    );
    // The loyal-customer case the chip must also be able to say.
    expect(buyerHistoryLabel({ orders: 7, rejected: 0 })).toBe(
      "7 orders · 0 rejected",
    );
  });

  it("warns only when the rejections are a pattern", () => {
    expect(buyerHistoryIsWarning({ orders: 7, rejected: 0 })).toBe(false);
    // One bad delivery among several is not a fraud signal.
    expect(buyerHistoryIsWarning({ orders: 5, rejected: 1 })).toBe(false);
    expect(buyerHistoryIsWarning({ orders: 5, rejected: 3 })).toBe(true);
    expect(buyerHistoryIsWarning(undefined)).toBe(false);
  });
});
