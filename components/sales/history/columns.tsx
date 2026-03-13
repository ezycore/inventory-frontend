import type { ColumnDef } from '@tanstack/react-table';
import { Receipt, CreditCard } from 'lucide-react';
import { Badge } from '@/ui/components/badge';
import { DateCell } from '@/ui/components/dataTable/cells/date-cell';
import type { Sale, SaleStatus } from '@/types';

// ── Status config ───────────────────────────────────────────────────

export const statusConfig: Record<
  SaleStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft:     { label: 'Draft',     variant: 'secondary'    },
  partial:   { label: 'Partial',   variant: 'outline'      },
  paid:      { label: 'Paid',      variant: 'default'      },
  cancelled: { label: 'Cancelled', variant: 'destructive'  },
  due:       { label: 'Due',       variant: 'outline'      },
};

// ── Column factory ──────────────────────────────────────────────────

export function getSalesHistoryColumns(
  formatCurrency: (n: number) => string,
  isAccountsEnabled: boolean,
  onViewPayments: (sale: Sale) => void,
  onMakePayment: (sale: Sale) => void,
): ColumnDef<Sale>[] {
  return [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono font-medium">
          {row.original.invoiceNumber}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Sale Date',
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      accessorKey: 'customerId',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customerId;
        return (
          <span className="font-medium">
            {customer?.name ?? (
              <span className="text-muted-foreground">Walk-in</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: () => <span className="flex justify-end">Total</span>,
      cell: ({ row }) => (
        <span className="flex justify-end font-medium">
          {formatCurrency(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: () => <span className="flex justify-end">Paid</span>,
      cell: ({ row }) => (
        <span className="flex justify-end text-green-600">
          {formatCurrency(row.original.paidAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'dueAmount',
      header: () => <span className="flex justify-end">Due</span>,
      cell: ({ row }) => (
        <span
          className={`flex justify-end ${
            row.original.dueAmount > 0
              ? 'text-red-600 font-medium'
              : 'text-muted-foreground'
          }`}
        >
          {formatCurrency(row.original.dueAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return (
          <Badge variant={config?.variant} className="w-fit">
            {config?.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const cb = row.original.createdBy;
        return cb ? (
          <span>{cb.firstName} {cb.lastName}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
  ];
}

// ── Custom row actions ──────────────────────────────────────────────

export function getSalesHistoryActions(
  isAccountsEnabled: boolean,
  onViewPayments: (sale: Sale) => void,
  onMakePayment: (sale: Sale) => void,
) {
  return [
    {
      type: 'custom' as const,
      placement: 'cell' as const,
      icon: <Receipt className="h-4 w-4" />,
      label: 'View Payments',
      tooltip: 'View payment history',
      onClick: (row: Sale) => onViewPayments(row),
    },
    ...(isAccountsEnabled
      ? [
          {
            type: 'custom' as const,
            placement: 'cell' as const,
            icon: <CreditCard className="h-4 w-4" />,
            label: 'Make Payment',
            tooltip: 'Add payment for this sale',
            onClick: (row: Sale) => onMakePayment(row),
            disabled: (row: Sale) =>
              row.dueAmount <= 0 || row.status === 'cancelled',
          },
        ]
      : []),
  ];
}
