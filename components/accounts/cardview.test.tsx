// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AccountCardView from "./cardview";
import { TooltipProvider } from "@/ui/components/tooltip";
import type { Account } from "@/types";

/**
 * The account card, against the fifth account type.
 *
 * When the backend added `courier_clearing`, this card read
 * `typeConfig[item.type] || typeConfig.cash` off a `Record<string, …>` — so money a courier was
 * still holding was drawn with the cash label and the wallet icon, and nothing failed to
 * compile. That is the exact conflation the separate account type exists to prevent, in the one
 * place a merchant actually looks at balances.
 *
 * The second half is the action menu: every write it offered against a system account is
 * refused server-side (`ACCOUNT_SYSTEM_LOCKED`, or `ACCOUNT_IN_USE_DEFAULT` on the delete), so
 * they were live buttons that could only produce an error.
 */
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    return t;
  },
}));

vi.mock("@/lib/currency", () => ({
  useCurrency: () => ({ format: (n: number) => `BDT ${n}` }),
}));

const baseAccount: Account = {
  _id: "acc-1",
  name: "Steadfast — COD in transit",
  type: "courier_clearing",
  balance: 5000,
  status: "active",
} as Account;

/** The app's root layout provides this; a bare render of the card does not. */
const renderCard = (item: Account) =>
  render(
    <TooltipProvider>
      <AccountCardView item={item} actions={actions} />
    </TooltipProvider>,
  );

const actions = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAddInvestment: vi.fn(),
  onWithdrawCapital: vi.fn(),
  onViewTransactions: vi.fn(),
};

describe("AccountCardView — courier clearing", () => {
  it("labels a clearing account as itself, never as cash", () => {
    renderCard(baseAccount);
    // Keys, not prose: the mock returns the key, so `types.cash` appearing here would be
    // the fallback that used to mislabel these accounts.
    expect(screen.getByText("types.courier_clearing")).toBeInTheDocument();
    expect(screen.queryByText("types.cash")).not.toBeInTheDocument();
  });

  it("offers no write actions on a system account, but keeps its transactions reachable", async () => {
    const user = userEvent.setup();
    renderCard({ ...baseAccount, systemKey: "courier_clearing:steadfast" });
    await user.click(screen.getByRole("button"));

    expect(screen.queryByText("card.edit")).not.toBeInTheDocument();
    expect(screen.queryByText("card.delete")).not.toBeInTheDocument();
    expect(screen.queryByText("card.addInvestment")).not.toBeInTheDocument();
    expect(screen.queryByText("card.withdrawCapital")).not.toBeInTheDocument();
    // The remittance history is the useful half of the card, so this one stays.
    expect(screen.getByText("card.viewTransactions")).toBeInTheDocument();
  });

  it("keeps every action on an ordinary account", async () => {
    const user = userEvent.setup();
    renderCard({ ...baseAccount, type: "cash", systemKey: undefined });
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("card.edit")).toBeInTheDocument();
    expect(screen.getByText("card.delete")).toBeInTheDocument();
  });
});
