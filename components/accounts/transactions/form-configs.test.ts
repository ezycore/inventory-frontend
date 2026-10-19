// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { findDefaultOption } from "@/ui/components/select-default";

import {
  getExpenseFormConfig,
  getIncomeFormConfig,
  getTransferFormConfig,
  makeExpenseSchema,
} from "./form-configs";

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

/**
 * Shadow test S37: Record Expense / Income / Transfer opened on "Select account" while every
 * payment form started on the default account. The select pre-fills through `defaultFlag`.
 */
describe("default account (S37)", () => {
  const options = [
    { _id: "a1", name: "Bank" },
    { _id: "a2", name: "Cash", isDefault: true },
  ];

  it("expense, income and the transfer source start on the default account", () => {
    const fields = [
      getExpenseFormConfig(t, t, true, "2026-10-17").fields.find((f) => f.name === "accountId"),
      getIncomeFormConfig(t, t, true, "2026-10-17").fields.find((f) => f.name === "accountId"),
      getTransferFormConfig(t).fields.find((f) => f.name === "fromAccountId"),
    ];
    for (const field of fields) {
      expect(field?.defaultFlag).toBe("isDefault");
      const loaded = field!.itemsCreateCallback!({ data: options } as never);
      expect(findDefaultOption(loaded, field!.defaultFlag!)?.value).toBe("a2");
    }
  });

  it("leaves the transfer destination for the merchant to pick", () => {
    const to = getTransferFormConfig(t).fields.find((f) => f.name === "toAccountId");
    expect(to?.defaultFlag).toBeUndefined();
  });
});
