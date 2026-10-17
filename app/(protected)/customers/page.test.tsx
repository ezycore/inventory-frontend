// coding-standard: maintained

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomAction } from "@/types/DataTable";

/**
 * "Who owes me, and take the payment" from the Customers page.
 *
 * There is no dues page: the totals link to this list filtered to debtors, and
 * a debtor's Due cell carries a Receive button that opens the ledger sheet
 * straight on the customer-level payment form. It is not a row action: only
 * some rows owe, and an action on those alone put the icons out of line. The table, totals
 * and sheet are stubbed — what is under test is the page's wiring of them.
 */

const auth = {
  permissions: ["customers.view", "sales.edit"] as string[],
  features: { accounts: true, sales: true } as Record<string, boolean>,
};

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: () => ({
    user: {
      permissions: auth.permissions,
      organization: { currency: "BDT", features: auth.features },
    },
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-url-param", () => ({
  useUrlParam: () => ["all", vi.fn()],
}));

vi.mock("@/hooks/use-filters", () => ({
  useFilteredFormConfig: (config: unknown) => config,
}));

vi.mock("@/services/api", () => ({
  customersApi: {},
  useCreateCustomer: () => ({}),
  useUpdateCustomer: () => ({}),
  useDeleteCustomer: () => ({}),
  useCustomerTotals: () => ({
    data: { receivable: 500, debtorCount: 2 },
    isLoading: false,
  }),
}));

const statCards = vi.fn();
vi.mock("@/ui/components/StatsCard", () => ({
  default: (props: { data: { label: string; href?: string }[] }) => {
    statCards(props.data);
    return null;
  },
}));

/** The actions column: the same set on every row, so the icons line up. */
const tableActions = vi.fn();
vi.mock("@/ui/components/dataTable", () => ({
  DataTable: ({ customActions }: { customActions: CustomAction[] }) => {
    tableActions(customActions);
    return (
      <div>
        {customActions.map((a) => (
          <button
            key={a.type}
            aria-label={a.tooltip}
            onClick={() => a.onClick?.({ _id: "rahim", totalDue: 300 })}
          />
        ))}
      </div>
    );
  },
}));

/** What the page hands the columns; the Due cell itself is covered in `columns.test.ts`. */
type ColumnModes = { onReceivePayment?: (row: { _id: string }) => void };
const columnModes = vi.fn();

const sheet = vi.fn();
vi.mock("@/components/customers", () => ({
  CustomerLedgerSheet: (props: {
    open: boolean;
    initialMode: string;
    customer: unknown;
  }) => {
    sheet(props);
    return null;
  },
  getCustomerColumns: (_t: unknown, modes: ColumnModes) => {
    columnModes(modes);
    return [];
  },
  getCustomerFilterConfig: () => ({ fields: [] }),
  getCustomerFormConfig: () => ({}),
  defaultValues: {},
}));

vi.mock("@/components/customers/storefront-list-panel", () => ({
  StorefrontListPanel: () => null,
}));

import CustomersPage from "./page";

const lastSheet = () => sheet.mock.calls.at(-1)?.[0];
const lastModes = () => columnModes.mock.calls.at(-1)?.[0] as ColumnModes;

describe("Customers page — dues", () => {
  beforeEach(() => {
    auth.permissions = ["customers.view", "sales.edit"];
    auth.features = { accounts: true, sales: true };
    sheet.mockClear();
    statCards.mockClear();
    columnModes.mockClear();
  });

  it("links the receivable and debtor totals to the customers who owe", () => {
    render(<CustomersPage />);
    const cards = statCards.mock.calls.at(-1)?.[0] as {
      label: string;
      href?: string;
    }[];
    expect(cards.map((c) => [c.label, c.href])).toEqual([
      ["page.totals.receivable", "/customers?hasDues=true"],
      ["page.totals.debtors", "/customers?hasDues=true"],
      ["page.totals.credit", undefined],
    ]);
  });

  it("keeps Receive out of the actions column, which holds only the ledger icon", () => {
    render(<CustomersPage />);
    const actions = tableActions.mock.calls.at(-1)?.[0] as CustomAction[];
    expect(actions.map((a) => a.type)).toEqual(["ledger"]);
  });

  it("Receive in the Due cell opens the ledger straight on the payment form", () => {
    render(<CustomersPage />);
    act(() => lastModes().onReceivePayment?.({ _id: "rahim" }));
    expect(lastSheet()).toMatchObject({
      open: true,
      initialMode: "bulk",
      customer: { _id: "rahim" },
    });
  });

  it("opens the history from the ledger icon", async () => {
    render(<CustomersPage />);
    await userEvent.click(screen.getByLabelText("page.viewLedgerTooltip"));
    expect(lastSheet()).toMatchObject({ open: true, initialMode: "ledger" });
  });

  it("offers no Receive to a role that cannot take payments, or without Cash & Bank", () => {
    auth.permissions = ["customers.view"];
    const { unmount } = render(<CustomersPage />);
    expect(lastModes().onReceivePayment).toBeUndefined();
    unmount();

    auth.permissions = ["customers.view", "sales.edit"];
    auth.features = { accounts: false, sales: true };
    render(<CustomersPage />);
    expect(lastModes().onReceivePayment).toBeUndefined();
  });
});
