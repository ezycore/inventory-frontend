"use client";
// coding-standard: maintained

import { useState } from "react";

import { LIST_PAGE_SIZES, ListPagination } from "@/components/ecommerce/list-pagination";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { useCourierPayouts } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Card } from "@/ui/components/card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Skeleton } from "@/ui/components/skeleton";
import { PayoutDetailSheet } from "./payout-detail-sheet";
import { PayoutRow } from "./payout-row";

/**
 * The remittance list: filters, rows, pager, and the detail sheet they open.
 *
 * Hand-rolled like its neighbours (orders, carts, catalog) rather than a `DataTable`, because
 * a payout row carries bespoke markup — two badges and a residual that has to read as a
 * warning. Filters are the server's: provider, status, and `reconciled=false`, which is the
 * one that answers "show me the payouts worth opening".
 */
export function PayoutList() {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  // Filters and page live in the URL, so Back from a payout lands here again.
  const list = useListUrlState({
    defaults: { limit: 20, filters: { provider: "all", status: "all" } },
    limitOptions: LIST_PAGE_SIZES,
  });
  const { page, limit } = list;
  const { provider, status } = list.filters;
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useCourierPayouts({
    page,
    limit,
    provider: provider === "all" ? undefined : provider,
    // `unreconciled` is not a status on the wire — it is the reconciled flag inverted.
    reconciled: status === "unreconciled" ? false : undefined,
  });

  const payouts = data?.items ?? [];

  return (
    <>
      <Card className="overflow-hidden p-0 shadow-none">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SimpleSelect
            value={provider}
            onValueChange={(v) => list.patchFilters({ provider: v })}
            className="w-40"
            options={[
              { label: "All couriers", value: "all" },
              { label: "Steadfast", value: "steadfast" },
              { label: "Pathao", value: "pathao" },
              { label: "eCourier", value: "ecourier" },
            ]}
          />
          <SimpleSelect
            value={status}
            onValueChange={(v) => list.patchFilters({ status: v })}
            className="w-48"
            options={[
              { label: "All payments", value: "all" },
              { label: "Did not add up", value: "unreconciled" },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No payments recorded yet. When a courier pays you, record it from their card
            above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Reference</th>
                  <th className="px-3 py-2.5 font-medium">Received</th>
                  <th className="px-3 py-2.5 font-medium">Collected</th>
                  <th className="px-3 py-2.5 font-medium">Charges</th>
                  <th className="px-3 py-2.5 font-medium">Received</th>
                  <th className="px-3 py-2.5 font-medium">Parcels</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Short by</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <PayoutRow
                    key={payout._id}
                    payout={payout}
                    currency={currency}
                    onOpen={() => setOpenId(payout._id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(data?.totalPages ?? 0) > 0 && (
          <div className="border-t py-3">
            <ListPagination
              page={data?.page ?? page}
              totalPages={data?.totalPages ?? 1}
              limit={limit}
              total={data?.total}
              onPageChange={list.setPage}
              onLimitChange={list.setLimit}
              isFetching={isFetching}
            />
          </div>
        )}
      </Card>

      <PayoutDetailSheet payoutId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
