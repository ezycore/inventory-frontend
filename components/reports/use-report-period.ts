'use client'

import { useMemo, useState } from 'react'
import type { ReportPeriod, ReportParams } from '@/services/api/modules/reports/api'

/**
 * Shared hook for managing report period state
 */
export function useReportPeriod(defaultPeriod: ReportPeriod = 'thisMonth') {
  const [period, setPeriod] = useState<ReportPeriod>(defaultPeriod)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const isCustomValid = period !== 'custom' || (!!customStart && !!customEnd)

  const params = useMemo<ReportParams | undefined>(() => {
    if (!isCustomValid) return undefined
    const p: ReportParams = {
      period,
      weekStartDay: 1,
    }
    if (period === 'custom' && customStart && customEnd) {
      p.startDate = customStart
      p.endDate = customEnd
    }
    return p
  }, [period, customStart, customEnd, isCustomValid])

  return {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    params,
  }
}
