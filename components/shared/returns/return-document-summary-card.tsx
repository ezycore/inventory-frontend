import { FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { InfoField } from '@/components/shared/info-field';

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
  totalAmount,
  paidAmount,
  dueAmount,
  refundCreditApplied,
  formatCurrency,
}: ReturnDocumentSummaryCardProps) {
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
            <InfoField label="Subtotal" value={formatCurrency(subtotal)} />
          )}

          <InfoField
            label="Discount"
            value={`-${formatCurrency(additionalDiscount)}`}
            valueClassName="text-orange-600 dark:text-orange-400"
          />

          {taxTotal != null && taxTotal > 0 && (
            <InfoField label="Tax" value={formatCurrency(taxTotal)} />
          )}
          <InfoField label="Total" value={formatCurrency(totalAmount)} />
          <InfoField
            label="Paid"
            value={formatCurrency(paidAmount)}
            valueClassName="text-green-600 dark:text-green-400"
          />
          {refundCreditApplied != null && refundCreditApplied > 0 && (
            <InfoField
              label="Refund Credits Applied"
              value={formatCurrency(refundCreditApplied)}
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />
          )

          }
          {dueAmount != null && dueAmount > 0 && (
            <InfoField
              label="Due"
              value={formatCurrency(dueAmount)}
              valueClassName="text-destructive"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
