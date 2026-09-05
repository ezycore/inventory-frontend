// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import UserCardView from "./cardview";

/**
 * The users card.
 *
 * A custom `renderCard` never receives the DataCard's `customActions` —
 * `CardItem` forwards only edit/view/delete — so the table's Enable/Disable
 * button had no counterpart here. The card showed an Active/Inactive badge and
 * offered no way to change it: the only route was to switch to table view. The
 * page injects the handler instead, the way categories injects `onApplyVat`.
 */
const t = ((key: string) => key) as never;

const user = (patch: Record<string, unknown> = {}) =>
  ({
    _id: "u1",
    firstName: "Rahim",
    lastName: "Uddin",
    email: "rahim@example.com",
    role: "staff",
    status: "active",
    emailVerified: true,
    createdAt: new Date("2026-01-01").toISOString(),
    ...patch,
  }) as never;

const open = async (element: React.ReactNode) => {
  const u = userEvent.setup();
  render(<>{element}</>);
  await u.click(screen.getByRole("button"));
  return u;
};

describe("user card actions", () => {
  it("offers Disable on an active user and calls the handler", async () => {
    const onToggleStatus = vi.fn();
    const u = await open(
      UserCardView(user(), { onToggleStatus }, { t }),
    );

    await u.click(screen.getByText("actions.disable"));
    expect(onToggleStatus).toHaveBeenCalledTimes(1);
  });

  it("offers Enable on a deactivated user", async () => {
    await open(
      UserCardView(
        user({ status: "inactive" }),
        { onToggleStatus: vi.fn() },
        { t },
      ),
    );

    expect(screen.getByText("actions.enable")).toBeInTheDocument();
    expect(screen.queryByText("actions.disable")).not.toBeInTheDocument();
  });

  it("shows no toggle at all when the page withholds it", async () => {
    // Your own row: the server refuses self-deactivation, so the item would only
    // ever produce an error.
    await open(UserCardView(user(), {}, { t }));

    expect(screen.queryByText("actions.disable")).not.toBeInTheDocument();
    expect(screen.getByText("card.edit")).toBeInTheDocument();
  });
});
