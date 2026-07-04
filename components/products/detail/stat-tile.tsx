// coding-standard: maintained
'use client'

import { Card, CardContent } from '@ui/components/card'
import type { LucideIcon } from 'lucide-react'

export interface Stat {
  icon: LucideIcon
  label: string
  value: string
  sub: string
}

/** One metric tile used across the product/combo detail stat grids. */
export function StatTile({ stat }: { stat: Stat }) {
  const Icon = stat.icon
  return (
    <Card>
      <CardContent className="pb-4 pt-5">
        <div className="mb-1 flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{stat.label}</span>
        </div>
        <p className="text-3xl font-bold">{stat.value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
      </CardContent>
    </Card>
  )
}
