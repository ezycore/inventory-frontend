// coding-standard: maintained

import { describe, expect, it } from "vitest";
import type { AdminStorefrontOrder, OrderStats } from "@/services/api";
import {
  confirmableOrders,
  isTabActive,
  deletableOrders,
  getOrderStats,
  isDeletableOrder,
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
});
