// coding-standard: maintained

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Removing a custom domain asks first.
 *
 * One click on **Remove** fired the DELETE with no dialog of any kind (QA-R19).
 * It is the only destructive action on the page and it is not recoverable by
 * undo: the mapping goes, every shopper on that address gets an error, and
 * adding it back restarts TXT verification from the beginning.
 */

const removeMutate = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}:${Object.values(vars).join(",")}` : key,
}));

vi.mock("@/services/api", () => ({
  useDomains: () => ({
    data: [{ domain: "shop.example.com", status: "active" }],
    isLoading: false,
  }),
  useAddDomain: () => ({ mutate: vi.fn(), isPending: false }),
  useVerifyDomain: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveDomain: () => ({ mutate: removeMutate, isPending: false }),
}));

vi.mock("@/components/domains/domain-card", () => ({
  DomainCard: ({
    domain,
    onRemove,
  }: {
    domain: { domain: string };
    onRemove: (d: string) => void;
  }) => (
    <button onClick={() => onRemove(domain.domain)}>remove</button>
  ),
}));

import DomainsSettingsPage from "./page";

beforeEach(() => {
  removeMutate.mockClear();
});

describe("custom domain removal", () => {
  it("does not delete on the first click", async () => {
    const u = userEvent.setup();
    render(<DomainsSettingsPage />);

    await u.click(screen.getByRole("button", { name: "remove" }));

    expect(removeMutate).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("alertdialog"),
    ).toBeInTheDocument();
  });

  it("names the domain in the prompt", async () => {
    // A merchant with two domains cannot otherwise tell which one they are
    // about to unhook.
    const u = userEvent.setup();
    render(<DomainsSettingsPage />);

    await u.click(screen.getByRole("button", { name: "remove" }));

    expect(
      await screen.findByText(/shop\.example\.com/),
    ).toBeInTheDocument();
  });

  it("deletes once confirmed", async () => {
    const u = userEvent.setup();
    render(<DomainsSettingsPage />);

    await u.click(screen.getByRole("button", { name: "remove" }));
    await u.click(
      await screen.findByRole("button", { name: /confirmRemove\.confirm/ }),
    );

    await waitFor(() =>
      expect(removeMutate).toHaveBeenCalledWith(
        "shop.example.com",
        expect.anything(),
      ),
    );
  });

  it("leaves the domain alone when cancelled", async () => {
    const u = userEvent.setup();
    render(<DomainsSettingsPage />);

    await u.click(screen.getByRole("button", { name: "remove" }));
    await u.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(removeMutate).not.toHaveBeenCalled();
  });
});
