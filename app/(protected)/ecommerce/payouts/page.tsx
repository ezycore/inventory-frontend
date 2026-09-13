"use client";
// coding-standard: maintained

import { Plus } from "lucide-react";

import { ChargeVariance } from "@/components/ecommerce/payouts/charge-variance";
import { CodInTransit } from "@/components/ecommerce/payouts/cod-in-transit";
import { PayoutHistorySummary } from "@/components/ecommerce/payouts/payout-history";
import { PayoutList } from "@/components/ecommerce/payouts/payout-list";
import { PayoutRecordDialog } from "@/components/ecommerce/payouts/payout-record-dialog";
import { PayoutSyncButton } from "@/components/ecommerce/payouts/payout-sync-button";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useCourierMoneySummary } from "@/services/api";
import { Button } from "@/ui/components/button";
import PageHeader from "@/ui/components/header";

/**
 * Courier remittance — the money a courier collected at the door and pays over days later.
 *
 * **Why this lives under `/ecommerce` and not under `/accounts`.** A route's feature gate is
 * resolved from its URL by prefix (`lib/nav-utils.ts` → `featuresForPath`), so anything under
 * `/accounts` would demand the `accounts` feature. These endpoints are gated on `storefront`
 * on purpose: a merchant with the ledger switched off still needs to see what a courier is
 * holding — they just cannot post it into a ledger that is not there.
 *
 * The ageing, the charge variance and the history sit on the same screen as the payouts
 * themselves rather than under Reports, because reconciling a statement means reading all four
 * against each other — and a report route would inherit `reports.view`, which is not the
 * permission these endpoints want.
 */
export default function CourierPayoutsPage() {
  const canManage = useHasPermission("storefront.orders.manage");
  const { data: summary } = useCourierMoneySummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Courier payouts"
          subTitle="What your couriers are holding, what they charged, and what they have paid over"
        />
        {/* Both write actions. A read-only role sees the whole screen and neither button —
            the backend gates writes with `storefront.orders.manage` and would refuse them. */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <PayoutSyncButton />
            <PayoutRecordDialog
              trigger={
                <Button className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Record a payout
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* The two questions a merchant opens this screen with, in order: how much is out
          there, and how old is it. */}
      <CodInTransit data={summary?.codInTransit} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChargeVariance data={summary?.variance} />
        <PayoutHistorySummary data={summary?.payouts} />
      </div>

      <PayoutList />
    </div>
  );
}
