import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import type { Translator } from '@/i18n/config';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { DateCell } from '@/ui/components/dataTable/cells/date-cell';
import type { SalesReturn } from '@/types';
import { CopyField } from '@/ui/components/copy';

// ── Status badge helper ─────────────────────────────────────────────

export function getStatusBadge(status: string, t?: Translator) {
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
        <Badge variant="destructive">{t ? t('columns.cancelled') : 'Cancelled'}</Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Column factory ──────────────────────────────────────────────────

export function getReturnsColumns(
  formatCurrency: (n: number) => string,
  _isAccountsEnabled: boolean,
  onViewDetails: ((ret: SalesReturn) => void) | undefined,
  /** Caller's `t` bound to "sales.returns" (docs/I18N.md). */
  t: Translator,
): ColumnDef<SalesReturn>[] {
  return [
    {
      accessorKey: 'returnNumber',
      header: t('columns.returnId'),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-primary font-medium">
          <CopyField value={row.original.returnNumber} />
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('columns.date'),
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      accessorKey: 'invoiceNumber',
      header: t('columns.invoice'),
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
      header: t('columns.customer'),
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
      header: t('columns.items'),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-center">
          {row.original.items?.length ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'totalRefundAmount',
      header: t('columns.amount'),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.totalRefundAmount ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: t('columns.reason'),
      cell: ({ row }) => (
        <span className="text-sm capitalize">
          {row.original.reason?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('columns.status'),
      cell: ({ row }) => getStatusBadge(row.original.status, t),
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
                title={t('columns.viewDetails')}
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
