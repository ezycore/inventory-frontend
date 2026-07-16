import type { ColumnDef } from '@tanstack/react-table';
import { Eye, CreditCard, Copy, Pencil, Trash2 } from 'lucide-react';
import type { Translator } from '@/i18n/config';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { DateCell } from '@/ui/components/dataTable/cells/date-cell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/components/tooltip';
import type { Sale, SaleStatus } from '@/types';
import { populatedRef } from '@/utils/populated-ref';
import { toast } from 'sonner';

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
  /** Caller's `t` bound to "sales.history" (docs/I18N.md). */
  t: Translator,
): ColumnDef<Sale>[] {
  return [
    {
      accessorKey: 'invoiceNumber',
      header: t('columns.invoice'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">
            {row.original.invoiceNumber}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              navigator.clipboard.writeText(row.original.invoiceNumber);
              toast.success(t('toasts.invoiceCopied'));
            }}
            title={t('columns.copyInvoice')}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('columns.saleDate'),
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      accessorKey: 'customerId',
      header: t('columns.customer'),
      cell: ({ row }) => {
        const customer = populatedRef(row.original.customerId);
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
      cell: ({ row }) => {
        const sale = row.original;
        const paid = sale.paidAmount ?? 0;
        const refundCredit = sale.refundCreditApplied ?? 0;
        const refunded = sale.refundedAmount ?? 0;
        const netReceived = Math.max(paid - refunded, 0);
        const due = sale.dueAmount ?? 0;
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex justify-end text-green-600 cursor-help underline decoration-dotted underline-offset-2">
                  {formatCurrency(paid)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="min-w-[220px] p-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Paid (cash)</span>
                    <span className="font-medium">{formatCurrency(paid)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Refund credit applied</span>
                    <span className="font-medium">{formatCurrency(refundCredit)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Cash refunded</span>
                    <span className="font-medium text-red-600">-{formatCurrency(refunded)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-1">
                    <span className="text-muted-foreground">Net received</span>
                    <span className="font-medium">{formatCurrency(netReceived)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Due</span>
                    <span className={`font-medium ${due > 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency(due)}
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
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
      header: t('columns.status'),
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return (
          <Badge variant={config?.variant} className="w-fit">
            {t(`filters.${row.original.status}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdBy',
      header: t('columns.createdBy'),
      cell: ({ row }) => {
        const cb = populatedRef(row.original.createdBy);
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
  onViewSummary: (sale: Sale) => void,
  onMakePayment: (sale: Sale) => void,
  onEditDraft: ((sale: Sale) => void) | undefined,
  onDeleteDraft: ((sale: Sale) => void) | undefined,
  /** Caller's `t` bound to "sales.history" (docs/I18N.md). */
  t: Translator,
) {
  return [
    {
      type: 'custom' as const,
      placement: 'cell' as const,
      icon: <Eye className="h-4 w-4" />,
      label: t('actions.summary'),
      tooltip: t('actions.summaryTooltip'),
      onClick: (row: Sale) => onViewSummary(row),
    },
    ...(isAccountsEnabled
      ? [
          {
            type: 'custom' as const,
            placement: 'cell' as const,
            icon: <CreditCard className="h-4 w-4" />,
            label: t('actions.payment'),
            tooltip: t('actions.paymentTooltip'),
            onClick: (row: Sale) => onMakePayment(row),
            disabled: (row: Sale) =>
              row.status === 'draft' ||
              row.dueAmount <= 0 ||
              row.status === 'cancelled',
          },
        ]
      : []),
    ...(onEditDraft
      ? [
          {
            type: 'custom' as const,
            placement: 'cell' as const,
            icon: <Pencil className="h-4 w-4" />,
            label: t('actions.editDraft'),
            tooltip: t('actions.editDraftTooltip'),
            onClick: (row: Sale) => onEditDraft(row),
            hidden: (row: Sale) => row.status !== 'draft',
          },
        ]
      : []),
    ...(onDeleteDraft
      ? [
          {
            type: 'custom' as const,
            placement: 'cell' as const,
            icon: <Trash2 className="h-4 w-4" />,
            label: t('actions.deleteDraft'),
            tooltip: t('actions.deleteDraftTooltip'),
            onClick: (row: Sale) => onDeleteDraft(row),
            hidden: (row: Sale) => row.status !== 'draft',
          },
        ]
      : []),
  ];
}
