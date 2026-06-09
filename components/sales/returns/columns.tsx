import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { DateCell } from '@/ui/components/dataTable/cells/date-cell';
import type { SalesReturn } from '@/types';
import { CopyField } from '@/ui/components/copy';

// ── Status badge helper ─────────────────────────────────────────────

export function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
          Processed
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">
          Pending
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive">Cancelled</Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Column factory ──────────────────────────────────────────────────

export function getReturnsColumns(
  formatCurrency: (n: number) => string,
  _isAccountsEnabled: boolean,
  onViewDetails?: (ret: SalesReturn) => void,
): ColumnDef<SalesReturn>[] {
  return [
    {
      accessorKey: 'returnNumber',
      header: 'Return ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-primary font-medium">
          <CopyField value={row.original.returnNumber} />
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => {
        const { saleId, invoiceNumber } = row.original;
        const display =
          typeof saleId === 'object' && saleId?.invoiceNumber
            ? saleId.invoiceNumber
            : invoiceNumber || String(saleId);
        return (
          <span className="font-mono text-sm text-primary">
            <CopyField value={display} />
          </span>
        );
      },
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => {
        // customerId can be a string ID or a populated object { _id, name }
        const cid = row.original.customerId as unknown;
        if (!cid) return <span className="text-muted-foreground">Walk-in</span>;
        if (typeof cid === 'object' && cid !== null && 'name' in cid) {
          return <span className="text-sm">{(cid as { name: string }).name}</span>;
        }
        return <span className="text-sm text-muted-foreground">{String(cid)}</span>;
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-center">
          {row.original.items?.length ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'totalRefundAmount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.totalRefundAmount ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-sm capitalize">
          {row.original.reason?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    ...(onViewDetails
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: { original: SalesReturn } }) => (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="View Details"
                onClick={() => onViewDetails(row.original)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
          } satisfies ColumnDef<SalesReturn>,
        ]
      : []),
  ];
}
