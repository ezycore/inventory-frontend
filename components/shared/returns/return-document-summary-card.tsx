import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { InfoField } from '@/components/shared/info-field';
import { splitLineTax } from '@/utils/tax';

export interface ReturnDocumentSummaryCardProps {
  /** e.g. "Sale" or "Order" */
  documentLabel: string;
  /** e.g. invoice number or order number */
  documentNumber: string;
  /** e.g. "Customer" or "Supplier" */
  counterpartyLabel: string;
  /** e.g. customer name, "Walk-in Customer", or supplier name */
  counterpartyName: string;
  subtotal?: number;
  additionalDiscount?: number;
  taxTotal?: number;
  /** Posted line snapshot — used to split tax into added vs in-price (exact). */
  items?: { taxType?: 'inclusive' | 'exclusive'; taxAmount?: number }[];
  totalAmount: number;
  paidAmount: number;
  /** When > 0, rendered in destructive color */
  dueAmount?: number;
  refundCreditApplied?: number;
  formatCurrency: (n: number) => string;
}

export function ReturnDocumentSummaryCard({
  documentLabel,
  documentNumber,
  counterpartyLabel,
  counterpartyName,
  subtotal,
  additionalDiscount,
  taxTotal,
  items,
  totalAmount,
  paidAmount,
  dueAmount,
  refundCreditApplied,
  formatCurrency,
}: ReturnDocumentSummaryCardProps) {
  const t = useTranslations('common.returns');
  // Split tax into added (charged on top → part of Total) vs in-price (already
  // inside Subtotal, informational). Exact via the canonical splitLineTax over the
  // posted line snapshot; fall back to deriving from the rolled-up totals
  // (total = subtotal − discount + addedTax) when items aren't supplied.
  const derivedAdded = Math.max(
    0,
    Math.round((totalAmount - (subtotal ?? 0) + (additionalDiscount ?? 0)) * 100) / 100,
  );
  const { addedTax, includedTax } = items
    ? splitLineTax(items)
    : {
        addedTax: derivedAdded,
        includedTax: Math.max(0, Math.round(((taxTotal ?? 0) - derivedAdded) * 100) / 100),
      };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {documentLabel}: {documentNumber}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {counterpartyLabel}: {counterpartyName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {subtotal != null && (
            <InfoField label={t('subtotal')} value={formatCurrency(subtotal)} />
          )}

          <InfoField
            label={t('discount')}
            value={`-${formatCurrency(additionalDiscount)}`}
            valueClassName="text-orange-600 dark:text-orange-400"
          />

          {addedTax > 0 && (
            <InfoField label={t('taxAdded')} value={formatCurrency(addedTax)} />
          )}
          {includedTax > 0 && (
            <InfoField
              label={t('taxInPrice')}
              value={formatCurrency(includedTax)}
              valueClassName="text-muted-foreground"
            />
          )}
          <InfoField label={t('total')} value={formatCurrency(totalAmount)} />
          <InfoField
            label={t('paid')}
            value={formatCurrency(paidAmount)}
            valueClassName="text-green-600 dark:text-green-400"
          />
          {refundCreditApplied != null && refundCreditApplied > 0 && (
            <InfoField
              label={t('refundCreditsApplied')}
              value={formatCurrency(refundCreditApplied)}
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />
          )

          }
          {dueAmount != null && dueAmount > 0 && (
            <InfoField
              label={t('due')}
              value={formatCurrency(dueAmount)}
              valueClassName="text-destructive"
            />
          )}
        </div>
        {includedTax > 0 && (
          <p className="mt-3 text-xs text-muted-foreground leading-snug">
            Subtotal already includes {formatCurrency(includedTax)} inclusive tax — only
            Tax (added) is charged on top, so Subtotal + Tax (added) = Total.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
