'use client'
// coding-standard: maintained

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@ui/lib/utils'
import { useAuthStore } from '@/services/stores/use-auth-store'
import { areAllFeaturesEnabled } from '@/lib/feature-utils'
import type { DashboardOverview } from '@/services/api'
import {
  PRIMARY_ACTIONS,
  SECONDARY_ACTIONS,
  quickActionCounts,
  type QuickAction,
} from './quick-action-items'
import {
  PhoneGridTile,
  PhoneLeadButton,
  PrimaryTile,
  ShortcutTile,
} from './quick-action-tiles'

/**
 * Tailwind needs whole class names in the source — a lookup, not a template.
 *
 * One row, sized from what survives the gates — except six below `lg`: beside
 * the sidebar a tablet or half-width laptop window leaves ~640px of content,
 * where six cells fall to ~95px and their labels wrap, so they go 3 + 3. Four
 * and five still fit (~120px) and must stay on one row: three-across left a
 * storefront shop's fourth shortcut alone on a second row.
 */
const SHORTCUT_COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-3 lg:grid-cols-6',
}

interface QuickActionsProps {
  overview?: DashboardOverview
}

/**
 * The dashboard's launchpad — the first thing under the greeting.
 *
 * It sits ABOVE the period filter, outside the server-composed block list: a
 * shortcut is not period-scoped, and placed under the filter it read as if the
 * dates changed where it goes. It was a block (`actions.quick`) that the server
 * never gated and always ordered last, so the one thing an owner opens the
 * dashboard to reach sat at the bottom of it.
 *
 * Desktop: primary tiles over a shortcut row. Phone: the first primary as a
 * full-width button over an app-style icon grid.
 */
export function QuickActions({ overview }: QuickActionsProps) {
  const t = useTranslations('dashboard.quickActions')
  const user = useAuthStore((state) => state.user)
  const features = user?.organization?.features
  const permissions = user?.permissions

  const { primary, secondary } = useMemo(() => {
    const allowed = (action: QuickAction) =>
      (!action.features || areAllFeaturesEnabled(features, action.features)) &&
      (!action.permissions ||
        action.permissions.some((p) => permissions?.includes(p)))
    return {
      primary: PRIMARY_ACTIONS.filter(allowed),
      secondary: SECONDARY_ACTIONS.filter(allowed),
    }
  }, [features, permissions])

  // Every shortcut gated away — render nothing rather than an empty card.
  if (primary.length === 0 && secondary.length === 0) return null

  const counts = quickActionCounts(overview)
  // On a phone the rest of the primaries join the grid ahead of the
  // shortcuts, so the order queue keeps its badge when the POS leads.
  const [phoneLead, ...phonePrimaryRest] = primary
  const phoneGrid = [...phonePrimaryRest, ...secondary]

  return (
    <section aria-label={t('title')}>
      <div data-layout="desktop" className="hidden flex-col gap-4 rounded-2xl border bg-card p-5 md:flex">
        {primary.length > 0 && (
          // Side by side from `lg` only: at medium widths each tile got ~300px and
          // "Online Orders" broke across three lines around its badge.
          <div className={cn('grid gap-4', primary.length > 1 && 'lg:grid-cols-2')}>
            {primary.map((action) => (
              <PrimaryTile
                key={action.id}
                action={action}
                label={t(action.id)}
                hint={t(`${action.id}Hint`)}
                count={counts[action.id]}
                countLabel={(count) => t('toConfirm', { count })}
              />
            ))}
          </div>
        )}
        {secondary.length > 0 && (
          // Sized from what survives the gates, so two shortcuts are not left
          // huddled against four empty columns.
          <div className={cn('grid gap-3', SHORTCUT_COLUMNS[secondary.length])}>
            {secondary.map((action) => (
              <ShortcutTile
                key={action.id}
                action={action}
                label={t(action.id)}
                count={counts[action.id]}
              />
            ))}
          </div>
        )}
      </div>

      <div data-layout="phone" className="flex flex-col gap-4 md:hidden">
        {phoneLead && (
          <PhoneLeadButton
            action={phoneLead}
            label={t(phoneLead.id)}
            count={counts[phoneLead.id]}
          />
        )}
        {phoneGrid.length > 0 && (
          <div className="grid grid-cols-4 gap-x-1 gap-y-4 rounded-2xl border bg-card px-3 py-4">
            {phoneGrid.map((action) => (
              <PhoneGridTile
                key={action.id}
                action={action}
                label={t(action.id)}
                count={counts[action.id]}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
