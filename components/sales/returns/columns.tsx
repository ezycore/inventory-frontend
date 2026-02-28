import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/ui/components/badge';
import type { SalesReturn } from '@/types';

// ── Status badge helper ─────────────────────────────────────────────

export function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Completed
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Column factory ──────────────────────────────────────────────────

export function getReturnsColumns(
  formatCurrency: (n: number) => string,
  isAccountsEnabled: boolean,
): ColumnDef<SalesReturn>[] {
  return [
    {
      accessorKey: 'returnNumber',
      header: 'Return #',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.returnNumber}</span>
      ),
    },
    {
      accessorKey: 'saleId',
      header: 'Original Sale',
      cell: ({ row }) => {
        const { saleId, invoiceNumber } = row.original;
        const display =
          typeof saleId === 'object' && saleId?.invoiceNumber
            ? saleId.invoiceNumber
            : invoiceNumber || String(saleId);
        return <span className="font-mono text-sm">{display}</span>;
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.items?.length ?? 0} item(s)
        </span>
      ),
    },
    {
      accessorKey: 'totalRefundAmount',
      header: 'Refund Amount',
      cell: ({ row }) => (
        <span className="font-medium text-orange-600">
          {formatCurrency(row.original.totalRefundAmount ?? 0)}
        </span>
      ),
    },
    // Allocation column only shows when accounts feature is enabled
    ...(isAccountsEnabled
      ? [
          {
            id: 'allocation',
            header: 'Allocation',
            cell: ({ row }: { row: { original: SalesReturn } }) => {
              const ret = row.original;
              const cashRefund = ret.refundedAmount ?? 0;
              const dueAdjusted = (ret.totalRefundAmount ?? 0) - cashRefund;

              if (cashRefund > 0 && dueAdjusted > 0) {
                return (
                  <div className="text-xs space-y-0.5">
                    <div className="text-red-600">
                      Cash: {formatCurrency(cashRefund)}
                    </div>
                    <div className="text-blue-600">
                      Due Adj: {formatCurrency(dueAdjusted)}
                    </div>
                  </div>
                );
              }
              if (cashRefund > 0)
                return (
                  <span className="text-xs text-red-600">Cash Refund</span>
                );
              if (dueAdjusted > 0)
                return (
                  <span className="text-xs text-blue-600">Due Adjusted</span>
                );
              return (
                <span className="text-xs text-muted-foreground">-</span>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.original.reason?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];
}
