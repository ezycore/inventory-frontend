// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { Customer } from "@/types";
import { CustomerLedgerSheet } from "./customer-ledger-sheet";

/**
 * Opened straight on Receive Payment (the Due cell's button), the form must
 * offer the full amount owed. It seeds that amount once, on mount — and it
 * mounts before the customer's dues arrive, so it used to seed an empty box and
 * keep it; only a second open, served from cache, showed the amount.
 */
const outstanding = {
  current: undefined as
    | { data: { sales: unknown[]; totalDue: number; creditBalance: number } }
    | undefined,
};

vi.mock("@/services/api", () => ({
  useCustomerLedger: () => ({ data: undefined, isLoading: false }),
  useAccountPaymentOptions: () => ({ data: [] }),
  useCustomerStatement: () => ({ data: undefined }),
  useCustomerOutstanding: () => ({
    data: outstanding.current,
    isLoading: !outstanding.current,
  }),
  useAddSalePayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReceiveCustomerPayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/components/shared/print/print-menu", () => ({
  PrintMenu: () => null,
}));
vi.mock("./email-statement-button", () => ({
  EmailStatementButton: () => null,
}));

const customer = { _id: "c1", name: "Rahim", totalDue: 300 } as Customer;
const sheet = () => (
  <CustomerLedgerSheet
    initialMode="bulk"
    open
    onOpenChange={() => {}}
    customer={customer}
    isAccountsEnabled
  />
);

describe("CustomerLedgerSheet opened on Receive Payment", () => {
  it("fills in the full amount owed once the dues arrive", () => {
    outstanding.current = undefined;
    const { rerender } = renderWithProviders(sheet());

    outstanding.current = {
      data: {
        sales: [
          {
            _id: "s1",
            invoiceNumber: "INV-1",
            dueAmount: 300,
            createdAt: "2026-10-01T06:00:00.000Z",
          },
        ],
        totalDue: 300,
        creditBalance: 0,
      },
    };
    rerender(sheet());

    expect(screen.getByLabelText("Payment Amount")).toHaveValue("300");
  });
});
