// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { getCustomerColumns, ordersByPhoneHref } from "./columns";

const t = ((key: string) => key) as never;
const headers = (modes: Parameters<typeof getCustomerColumns>[1]) =>
  getCustomerColumns(t, modes).map((column) => column.header);

describe("customer columns follow the business mode", () => {
  it("an online-only shop with no ledger: order columns, no Due / Credit / Discount", () => {
    // Live, UriiBaba: Discount "None", Due ৳0 and Credit Balance ৳0 on all 464 rows.
    const cols = headers({ tracksMoney: false, online: true, counter: false });

    expect(cols).toEqual(
      expect.arrayContaining([
        "columns.phone",
        "columns.onlineOrders",
        "columns.onlineSpent",
        "columns.returnedOrders",
        "columns.lastOrder",
      ]),
    );
    expect(cols).not.toContain("columns.due");
    expect(cols).not.toContain("columns.creditBalance");
    expect(cols).not.toContain("columns.discount");
  });

  it("a counter shop with a ledger keeps its money columns and has no online ones", () => {
    const cols = headers({ tracksMoney: true, online: false, counter: true });

    expect(cols).toEqual(
      expect.arrayContaining(["columns.due", "columns.creditBalance", "columns.discount"]),
    );
    expect(cols).not.toContain("columns.onlineOrders");
  });

  it("the order columns can be sorted from their header — each has an accessor", () => {
    // TanStack never offers a sort on an id-only column, so these sorted from the dropdown only.
    const sortable = getCustomerColumns(t, { tracksMoney: false, online: true, counter: false })
      .filter((column) => "accessorFn" in column)
      .map((column) => column.id);

    expect(sortable).toEqual(["onlineOrders", "onlineSpent", "returnedOrders", "lastOrderAt"]);
  });
});

describe("ordersByPhoneHref", () => {
  it("opens Online Orders searched by the phone, encoded", () => {
    expect(ordersByPhoneHref("+8801712345678")).toBe("/ecommerce/orders?q=%2B8801712345678");
  });
});
