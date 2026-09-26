"use client";
// coding-standard: maintained

import { ChargeVariance } from "@/components/ecommerce/payouts/charge-variance";
import { CourierBalanceCards } from "@/components/ecommerce/payouts/courier-balance-cards";
import { PayoutHistorySummary } from "@/components/ecommerce/payouts/payout-history";
import { PayoutList } from "@/components/ecommerce/payouts/payout-list";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useCourierBalances, useCourierMoneySummary } from "@/services/api";
import PageHeader from "@/ui/components/header";

/**
 * Courier payments — one manual flow for every courier (backend
 * `docs/plan/courier-settlement-manual.md`). The system does not follow any courier's payout
 * mechanism: it calculates what each courier owes (COD collected less their charge, per open
 * parcel) and the merchant records the money that actually arrived.
 *
 * **Why this lives under `/ecommerce` and not under `/accounts`.** A route's feature gate is
 * resolved from its URL by prefix (`lib/nav-utils.ts` → `featuresForPath`), so anything under
 * `/accounts` would demand the `accounts` feature. These endpoints are gated on `storefront`
 * on purpose: a merchant with the ledger switched off still needs to see what a courier owes.
 */
export default function CourierPayoutsPage() {
  const canManage = useHasPermission("storefront.orders.manage");
  const { data: balances } = useCourierBalances();
  const { data: summary } = useCourierMoneySummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courier payouts"
        subTitle="What each courier owes you, what they charged, and what they have paid"
      />

      {/* The question a merchant opens this screen with. Each card records its own courier's
          payment; a read-only role sees the cards without the buttons. */}
      <CourierBalanceCards data={balances} canManage={canManage} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChargeVariance data={summary?.variance} />
        <PayoutHistorySummary data={summary?.payouts} />
      </div>

      <PayoutList />
    </div>
  );
}
