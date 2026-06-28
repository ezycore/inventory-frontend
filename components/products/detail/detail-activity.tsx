// coding-standard: maintained
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/components/table'
import { Activity, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatDate, MOVEMENT_REASON_LABEL } from './utils'

interface DetailActivityProps {
  movements: any[]
}

function locationName(m: any): string {
  return m.location?.name || m.locationId?.name || '—'
}

export function DetailActivity({ movements }: DetailActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-emerald-600" />
          Stock Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => {
                const isIn = m.movementType === 'in'
                return (
                  <TableRow key={m._id}>
                    <TableCell className="text-muted-foreground">{formatDate(m.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {MOVEMENT_REASON_LABEL[m.reason] || m.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>{locationName(m)}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isIn ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isIn ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                        {isIn ? '+' : '−'}
                        {m.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{m.newQuantity ?? '—'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="mb-2 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No stock activity yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
