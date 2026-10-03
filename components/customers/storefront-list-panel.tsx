"use client";
// coding-standard: maintained

import { useListUrlState } from "@/hooks/use-list-url-state";
import {
  useOnlineCustomers,
  useStorefrontSubscribers,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { LIST_PAGE_SIZES, ListPagination } from "@/components/ecommerce/list-pagination";
import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { AccountsTable } from "@/components/ecommerce/customers/accounts-table";
import { SubscribersTable } from "@/components/ecommerce/customers/subscribers-table";

export type StorefrontListKind = "accounts" | "subscribers";

const COPY: Record<StorefrontListKind, { hint: string; search: string }> = {
  accounts: {
    hint: "Shoppers who created an account on your storefront. Buyers who ordered without one live under All customers.",
    search: "Search name, phone, email",
  },
  subscribers: {
    hint: "People who signed up through your shop footer. They may never have ordered — this is a mailing list, not a customer list.",
    search: "Search email",
  },
};

/**
 * One of the two storefront-side people lists, rendered as a tab on Customers.
 *
 * These are genuinely different collections from the customer ledger — a
 * `Shopper` is a storefront login, a `StorefrontSubscriber` is a footer
 * sign-up, and a guest buyer who never made an account exists only as a
 * `Customer`. The merge is of the *destination*, not the data: a merchant
 * thinks "my customers" once, so they get one page with three lists
 * (docs/plan/onboarding-workspace.md §6.3).
 *
 * Both lists are read-only and written on the storefront — the admin app
 * creates neither, which is why there is no "add" button here.
 */
export function StorefrontListPanel({ kind }: { kind: StorefrontListKind }) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  // In the URL under this tab's own prefix, so it never collides with the
  // "All customers" table beside it, and Back from a customer lands here again.
  const list = useListUrlState({
    defaults: { limit: 20, filters: { q: "" } },
    limitOptions: LIST_PAGE_SIZES,
    prefix: `${kind}_`,
  });
  const { page, limit } = list;
  const search = list.filters.q as string;

  const params = { search: search || undefined, page, limit };
  // Both run, and only the visible one is read — the same trade the standalone
  // page made. Gating the idle one costs a spinner on every tab switch, for two
  // lists that are a few kilobytes each.
  const accounts = useOnlineCustomers(params);
  const subscribers = useStorefrontSubscribers(params);

  const query = kind === "accounts" ? accounts : subscribers;
  const pagination = query.data?.pagination;
  const copy = COPY[kind];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{copy.hint}</p>
        <ListSearchInput
          key={list.revision}
          placeholder={copy.search}
          defaultValue={search}
          onSearch={(v) => list.patchFilters({ q: v })}
        />
      </div>

      {kind === "accounts" ? (
        <AccountsTable
          customers={accounts.data?.items ?? []}
          currency={currency}
          isLoading={accounts.isLoading}
        />
      ) : (
        <SubscribersTable
          subscribers={subscribers.data?.items ?? []}
          isLoading={subscribers.isLoading}
        />
      )}

      <ListPagination
        page={page}
        totalPages={pagination?.totalPages ?? 1}
        total={pagination?.total}
        limit={limit}
        isFetching={query.isFetching}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
      />
    </div>
  );
}
