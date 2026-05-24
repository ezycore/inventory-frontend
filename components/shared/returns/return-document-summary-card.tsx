import { FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';

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
            <div className="rounded-lg bg-muted/40 p-3 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Subtotal</div>
              <div className="font-semibold">{formatCurrency(subtotal)}</div>
            </div>
          )}
          {additionalDiscount != null && additionalDiscount > 0 && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Discount</div>
              <div className="font-semibold text-orange-600 dark:text-orange-400">
                -{formatCurrency(additionalDiscount)}
              </div>
            </div>
          )}
          {taxTotal != null && taxTotal > 0 && (
            <div className="rounded-lg bg-muted/40 p-3 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Tax</div>
              <div className="font-semibold">{formatCurrency(taxTotal)}</div>
            </div>
          )}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Total</div>
            <div className="font-semibold">{formatCurrency(totalAmount)}</div>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Paid</div>
            <div className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(paidAmount)}</div>
          </div>
          {dueAmount != null && dueAmount > 0 && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Due</div>
              <div className="font-semibold text-destructive">{formatCurrency(dueAmount)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
