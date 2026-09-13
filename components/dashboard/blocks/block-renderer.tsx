'use client'
// coding-standard: maintained

import { Fragment, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import StatsCard, { type StatData } from '@ui/components/StatsCard'
import { cn } from '@ui/lib/utils'
import { KPI_TILES } from './kpi-tiles'
import { DASHBOARD_BLOCK_VIEWS } from './registry'
import type {
  DashboardBlockContext,
  DashboardBlockId,
  DashboardBlockLayout,
} from './context'

/**
 * Render the blocks the server named, in the order it named them.
 *
 * Consecutive blocks of the same layout are grouped into one row, which is what
 * lets a flat ordered list produce a real page: a run of `kpi` becomes one
 * `StatsCard`, a run of `stat` becomes one card track, a run of `half` becomes a
 * two-column grid that the blocks flow through.
 *
 * Grouping is by RUN, not by kind: two `half` blocks separated by a `full` one
 * are two grids, and that is deliberate — the server's order is the page's
 * order, and re-sorting to merge them would let the client rearrange a layout it
 * has no gating knowledge to rearrange.
 *
 * An id with no entry in `DASHBOARD_BLOCK_VIEWS` is skipped, so a backend that
 * ships a new block does not break a frontend that has not learned to draw it.
 */
interface DashboardBlockListProps {
  blocks: readonly DashboardBlockId[]
  ctx: DashboardBlockContext
}

interface BlockRun {
  layout: DashboardBlockLayout
  ids: DashboardBlockId[]
}

/** Split the ordered list into consecutive same-layout runs, dropping unknown ids. */
const toRuns = (blocks: readonly DashboardBlockId[]): BlockRun[] => {
  const runs: BlockRun[] = []
  for (const id of blocks) {
    const view = DASHBOARD_BLOCK_VIEWS[id]
    if (!view) continue
    const last = runs[runs.length - 1]
    if (last && last.layout === view.layout) last.ids.push(id)
    else runs.push({ layout: view.layout, ids: [id] })
  }
  return runs
}

/**
 * Tailwind needs whole class names in the source to emit them, so these are
 * lookups rather than `lg:grid-cols-${n}` templates.
 */
const KPI_COLUMNS: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }
const STAT_LG_COLUMNS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

export function DashboardBlockList({ blocks, ctx }: DashboardBlockListProps) {
  const t = useTranslations('dashboard.kpi')
  const runs = useMemo(() => toRuns(blocks), [blocks])

  return (
    <>
      {runs.map((run, index) => {
        const key = `${run.layout}-${run.ids[0]}-${index}`

        if (run.layout === 'kpi') {
          // Every tile in one card: it owns the responsive track, and separate
          // cards would not line up. A builder returning null drops its tile,
          // and the track is sized from what survives — a hardcoded 4-wide left
          // a hole where a gated-off tile used to be.
          const tiles = run.ids
            .map((id) => KPI_TILES[id]?.(ctx, t) ?? null)
            .filter((tile): tile is StatData => tile !== null)
          if (tiles.length === 0 && !ctx.isLoading) return null
          return (
            <StatsCard
              key={key}
              data={tiles}
              isLoading={ctx.isLoading}
              columns={{ default: 2, lg: KPI_COLUMNS[tiles.length] ?? 4 }}
            />
          )
        }

        if (run.layout === 'stat') {
          return (
            <div
              key={key}
              className={cn(
                'grid gap-4 grid-cols-1 sm:grid-cols-2',
                STAT_LG_COLUMNS[run.ids.length] ?? 'lg:grid-cols-4',
              )}
            >
              {run.ids.map((id) => (
                <BlockView key={id} id={id} ctx={ctx} />
              ))}
            </div>
          )
        }

        if (run.layout === 'half') {
          return (
            <div
              key={key}
              className={cn(
                'grid gap-6 grid-cols-1',
                run.ids.length > 1 && 'lg:grid-cols-2',
              )}
            >
              {run.ids.map((id) => (
                <BlockView key={id} id={id} ctx={ctx} />
              ))}
            </div>
          )
        }

        return (
          <Fragment key={key}>
            {run.ids.map((id) => (
              <BlockView key={id} id={id} ctx={ctx} />
            ))}
          </Fragment>
        )
      })}
    </>
  )
}

function BlockView({
  id,
  ctx,
}: {
  id: DashboardBlockId
  ctx: DashboardBlockContext
}) {
  const Component = DASHBOARD_BLOCK_VIEWS[id]?.Component
  return Component ? <Component {...ctx} /> : null
}
