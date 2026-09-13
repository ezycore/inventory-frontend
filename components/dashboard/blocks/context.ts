// coding-standard: maintained
import type { DashboardBlocks, DashboardOverview } from '@/services/api'

/** A block id the server can name. Generated from the backend registry's enum. */
export type DashboardBlockId = DashboardBlocks['blocks'][number]

/**
 * Everything a block may need, assembled once by the page.
 *
 * One bag rather than per-block props: a block is looked up by id at render
 * time, so the renderer cannot know which props any particular one wants. Blocks
 * take what they need and ignore the rest.
 */
export interface DashboardBlockContext {
  /**
   * The composed list, so a block can ask what ELSE the page holds.
   *
   * Only one tile needs it today (the transaction count reads whether purchases
   * are part of this business), and reading the list is how it asks — not a
   * feature flag of its own, which would be the duplicated gate this design
   * removed.
   */
  blocks: readonly DashboardBlockId[]
  overview?: DashboardOverview
  isLoading: boolean
  formatCurrency: (value: number) => string
  /** Stock movements come from their own query — see the page. */
  stockMovements?: unknown
  movementsLoading: boolean
}

/**
 * How a block sits on the page.
 *
 * The renderer groups **consecutive** blocks of the same layout, which is what
 * lets the server's flat ordered list reproduce a real page: a run of `kpi`
 * becomes one stat row, a run of `stat` becomes one card row, a run of `half`
 * becomes a two-column grid.
 *
 * Layout is declared here and not by the backend. The server decides *which*
 * blocks and in *what order* — that is composition, and it depends on features
 * and permissions. How one looks is presentation, and belongs beside the
 * component that does the looking.
 */
export type DashboardBlockLayout = 'kpi' | 'stat' | 'half' | 'full'
