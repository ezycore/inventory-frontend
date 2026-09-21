'use client'
// coding-standard: maintained

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  useDashboardBlocks,
  useDashboardOverview,
  useStockMovements,
  type DashboardPeriod,
  type DashboardOverviewParams,
} from '@/services/api'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { useCurrency } from '@/lib/currency'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { PeriodFilter } from '@/components/shared/period-filter'
import { ReportsRestricted } from '@/components/dashboard/reports-restricted'
import { DashboardBlockList } from '@/components/dashboard/blocks/block-renderer'
import type { DashboardBlockContext } from '@/components/dashboard/blocks/context'

/**
 * The dashboard is **composed**, not laid out.
 *
 * The backend names which blocks this workspace's home screen is made of and in
 * what order (`services/dashboard/blocks.ts` → `GET /dashboard/blocks`), from the
 * org's enabled features and the caller's permissions. This page fetches,
 * assembles the shared context, and renders that list. It decides nothing about
 * who sees what: the gating flags it used to carry (`purchasesTracked`,
 * `stockTracked`, `posEnabled`, the storefront check) are gone, because a second
 * copy of the gates on this side is a copy that drifts.
 *
 * See `inventory-backend/docs/plan/dashboard-composition.md`.
 */
export default function DashboardPage() {
  const tGreeting = useTranslations('dashboard.greeting')
  const user = useAuthStore((s) => s.user)
  const timezone = user?.organization?.timezone
  const { format: formatCurrency } = useCurrency()

  // ── Period state ──
  const [period, setPeriod] = useState<DashboardPeriod>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Only build params when valid (custom needs both dates)
  const isCustomValid = period !== 'custom' || (!!customStart && !!customEnd)

  /**
   * Whether to offer the period filter and the money panels' explanation.
   *
   * It no longer gates the FETCH. Since P1 the overview composes per block and
   * returns only the groups the caller's blocks need, so a user without
   * `reports.view` gets a 200 carrying their low-stock rows and no money figure
   * at all — the keys are absent, not zeroed. Skipping the request for them
   * would leave their stock block permanently empty, which reads as "nothing is
   * running low".
   */
  const canViewReports = !!user?.permissions?.includes('reports.view')

  const overviewParams = useMemo<DashboardOverviewParams | undefined>(() => {
    if (!isCustomValid) return undefined
    // Week boundaries are the organization's `weekStartDay`, read server-side.
    const params: DashboardOverviewParams = { period }
    if (period === 'custom' && customStart && customEnd) {
      params.startDate = customStart
      params.endDate = customEnd
    }
    return params
  }, [period, customStart, customEnd, isCustomValid])

  const { data: blocksData } = useDashboardBlocks()
  const { data: overviewData, isFetching: overviewLoading } =
    useDashboardOverview(overviewParams)
  const { data: stockMovements, isLoading: movementsLoading } = useStockMovements({
    page: 1,
    limit: 4,
  })

  const overview = overviewData?.data
  const blocks = blocksData?.data.blocks ?? []
  const firstName = user?.firstName || tGreeting('fallbackName')

  const blockContext: DashboardBlockContext = {
    blocks,
    overview,
    isLoading: overviewLoading,
    formatCurrency,
    stockMovements,
    movementsLoading,
  }

  return (
    <div className="space-y-6">
      <DashboardHeader firstName={firstName} timezone={timezone} />

      {canViewReports ? (
        <PeriodFilter
          period={period}
          setPeriod={setPeriod}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          periodInfo={overview?.period}
        />
      ) : (
        <ReportsRestricted />
      )}

      <DashboardBlockList blocks={blocks} ctx={blockContext} />
    </div>
  )
}
