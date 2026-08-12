"use client";
// coding-standard: maintained

import { useState } from "react";
import {
  useOnlineCustomers,
  useStorefrontSubscribers,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { ListPagination } from "@/components/ecommerce/list-pagination";
import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { AccountsTable } from "@/components/ecommerce/customers/accounts-table";
import { SubscribersTable } from "@/components/ecommerce/customers/subscribers-table";
import { cn } from "@/ui/lib/utils";

/**
 * The two ways someone can be attached to a shop without having bought: an
 * account, or a footer sign-up. Both are read-only and both are written on the
 * storefront — the admin app never creates either, which is why this page has no
 * "add" button and the subscriber tab has no row actions.
 */
const TABS = [
  {
    key: "accounts" as const,
    label: "Accounts",
    hint: "Shoppers who created an account on your storefront. Buyers who ordered without one live under Customers.",
    search: "Search name, phone, email",
  },
  {
    key: "subscribers" as const,
    label: "Subscribers",
    hint: "People who signed up through your shop footer. They may never have ordered — this is a mailing list, not a customer list.",
    search: "Search email",
  },
];

type TabKey = (typeof TABS)[number]["key"];

export default function EcommerceCustomersPage() {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const [tab, setTab] = useState<TabKey>("accounts");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const params = { search: search || undefined, page, limit };
  // Both run, and only the visible one is read. The alternative — `enabled` on
  // each — makes switching tabs a spinner every time, for two lists that are a
  // few kilobytes each.
  const accounts = useOnlineCustomers(params);
  const subscribers = useStorefrontSubscribers(params);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const query = tab === "accounts" ? accounts : subscribers;
  const pagination = query.data?.pagination;

  const switchTab = (next: TabKey) => {
    setTab(next);
    // The two lists do not share a page cursor or a search term — page 3 of the
    // accounts list means nothing in a subscriber list of 12.
    setPage(1);
    setSearch("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Storefront Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">{active.hint}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
              {tab === t.key && pagination ? (
                <span className="ml-1.5 font-normal tabular-nums opacity-80">
                  {pagination.total}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <ListSearchInput
          key={tab}
          placeholder={active.search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      {tab === "accounts" ? (
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
        onPageChange={setPage}
        onLimitChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
    </div>
  );
}
