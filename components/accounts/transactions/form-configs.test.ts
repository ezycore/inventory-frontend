// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { getExpenseFormConfig, makeExpenseSchema } from "./form-configs";

/**
 * Record Expense (shadow test S26): a date on the shop's calendar that cannot be in the future,
 * the two categories an online seller needs, and no courier clearing account to pay from.
 */
const t = (key: string) => key;
const base = { accountId: "a1", amount: 500, category: "packaging" };

describe("expense form", () => {
  it("takes today or an earlier day on the shop's calendar, never a later one", () => {
    const schema = makeExpenseSchema(undefined, "2026-10-17");
    expect(schema.safeParse({ ...base, date: "2026-10-17" }).success).toBe(true);
    expect(schema.safeParse({ ...base, date: "2026-10-10" }).success).toBe(true);
    expect(schema.safeParse({ ...base, date: "2026-10-18" }).success).toBe(false);
  });

  it("offers Ads & marketing and Packaging, a date field, and only postable accounts", () => {
    const fields = getExpenseFormConfig(t, t, true, "2026-10-17").fields;
    const category = fields.find((f) => f.name === "category");
    expect(category?.options?.map((o) => o.value)).toEqual(
      expect.arrayContaining(["marketing", "packaging"]),
    );
    expect(fields.find((f) => f.name === "date")?.type).toBe("date");
    // `payment-options` leaves out system accounts — the courier's COD clearing account.
    const account = fields.find((f) => f.name === "accountId");
    expect(account?.optionsApi).toBe("/accounts/payment-options");
    // That endpoint answers a flat array; the select reads options through this callback, and
    // without it the picker was empty (found in browser QA, 2026-10-17).
    expect(
      account?.itemsCreateCallback?.({ data: [{ _id: "a1", name: "Cash", isDefault: true }] } as never),
    ).toEqual([{ value: "a1", label: "Cash", isDefault: true }]);
  });
});
