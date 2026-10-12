"use client";
// coding-standard: maintained

import { ChargeVariance } from "@/components/ecommerce/payouts/charge-variance";
import { CourierBalanceCards } from "@/components/ecommerce/payouts/courier-balance-cards";
import { PayoutHistorySummary } from "@/components/ecommerce/payouts/payout-history";
import { PayoutList } from "@/components/ecommerce/payouts/payout-list";
import { ALL_TIME, PeriodFilter } from "@/components/shared/period-filter";
import { useHasPermission } from "@/hooks/use-has-permission";
import { isFeatureOn } from "@/lib/feature-utils";
import { useCourierBalances, useCourierMoneySummary } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import PageHeader from "@/ui/components/header";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Courier payments — one manual flow for every courier (backend
 * `docs/plan/courier-settlement-manual.md`). The system does not follow any courier's payout
 * mechanism: it calculates what each courier owes (COD collected less their charge, per open
 * parcel) and the merchant records the money that actually arrived.
 *
 * **Why this lives under `/ecommerce` and not under `/accounts`.** A route's feature gate is
 * resolved from its URL by prefix (`lib/nav-utils.ts` → `featuresForPath`), so anything under
 * `/accounts` would demand the `accounts` feature. These endpoints are gated on `storefront`
 * on purpose: a merchant with the ledger switched off still needs to see what each courier
 * CHARGED for delivery.
 *
 * **What a courier OWES is shown only with `courierPayouts` on** — its own opt-in switch in
 * Customize workspace since 2026-10-12, no longer tied to `accounts` (business-modes D2). A shop
 * that records no courier payments has every delivered parcel "owed" forever — a live store read
 * "Pathao owes you ৳2,65,133" from a courier that had long since paid. Off = hidden, never ৳0:
 * the balances, the record-payment buttons and the payment history go; the delivery-cost
 * comparison stays. On, the count starts the day it was switched on (backend
 * `courierPayoutsStartFilter`), so turning it on never opens with months of settled parcels.
 *
 * **The charge and payment cards follow a period, the balances do not.** What a courier owes is
 * a balance today; the delivery comparison is "how did this month go". It opened on all time
 * until 2026-10-11, so the totals only ever grew and the list could not answer this month.
 */
export default function CourierPayoutsPage() {
  const canManage = useHasPermission("storefront.orders.manage");
  const tracksPayouts = isFeatureOn(
    useAuthStore((state) => state.user?.organization?.features),
    "courierPayouts",
  );
  const { data: balances } = useCourierBalances(tracksPayouts);
  const [period, setPeriod] = useState<string>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const filters = useMemo(() => {
    if (period === ALL_TIME) return {};
    if (period === "custom") return { period, startDate: customStart, endDate: customEnd };
    return { period };
  }, [period, customStart, customEnd]);
  // A custom range asks nothing until both ends are picked — half a range is not a range.
  const ready = period !== "custom" || (!!customStart && !!customEnd);
  const { data: summary } = useCourierMoneySummary(filters, ready);

  const periodFilter = (
    <PeriodFilter
      period={period}
      setPeriod={setPeriod}
      customStart={customStart}
      setCustomStart={setCustomStart}
      customEnd={customEnd}
      setCustomEnd={setCustomEnd}
      includeAllTime
    />
  );

  if (!tracksPayouts) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Courier charges"
          subTitle="What each courier really billed for delivery, against what your customers paid for it"
        />
        {periodFilter}
        <ChargeVariance data={summary?.variance} />
        <p className="text-sm text-muted-foreground">
          Courier payments are not tracked. To record what each courier pays you and see what they
          still owe, turn on <strong>Courier payouts</strong> in{" "}
          <Link href="/settings/features" className="text-primary hover:underline">
            Customize workspace
          </Link>
          . It counts parcels from the day you turn it on.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courier payouts"
        subTitle="What each courier owes you, what they charged, and what they have paid"
      />

      {/* The question a merchant opens this screen with. Each card records its own courier's
          payment; a read-only role sees the cards without the buttons. */}
      <CourierBalanceCards data={balances} canManage={canManage} />

      {periodFilter}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChargeVariance data={summary?.variance} />
        <PayoutHistorySummary data={summary?.payouts} />
      </div>

      <PayoutList />
    </div>
  );
}
