'use client';

import { format } from 'date-fns';
import { Boxes, ClipboardList } from 'lucide-react';
import { Badge } from '@/ui/components/badge';
import { InfoField } from '@/components/shared/info-field';
import type { Sale, SalesReturn } from '@/types';
import { CopyField } from '@/ui/components/copy';

export function SaleDetailsBlock({ sale, saleReturns, }: { sale: Sale; saleReturns?: SalesReturn[] }) {
  // Group line tax by rate + type for the receipt breakdown.
  const taxRows = Object.values(
    sale.items.reduce((acc, it) => {
      const rate = it.taxRate ?? 0;
      const amount = it.taxAmount ?? 0;
      if (rate <= 0 || amount <= 0) return acc;
      const type = it.taxType ?? 'inclusive';
      const key = `${rate}-${type}`;
      acc[key] = acc[key] ?? { rate, type, amount: 0 };
      acc[key].amount += amount;
      return acc;
    }, {} as Record<string, { rate: number; type: string; amount: number }>),
  ).sort((a, b) => b.rate - a.rate);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoField label="Invoice #" value={<CopyField value={sale.invoiceNumber} />} />
        <InfoField
          label="Status"
          value={
            <Badge variant="outline" className="capitalize">
              {sale.status}
            </Badge>
          }
        />
        <InfoField label="Customer" value={sale.customerId?.name ?? 'Walk-in Customer'} />
        <InfoField
          label="Created By"
          value={
            sale.createdBy ? `${sale.createdBy.firstName} ${sale.createdBy.lastName}` : '-'
          }
        />
        <InfoField label="Created At" value={format(new Date(sale.createdAt), 'dd MMM yyyy hh:mm aa')} />
        <InfoField label="Updated At" value={format(new Date(sale.updatedAt), 'dd MMM yyyy hh:mm aa')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoField label="Subtotal" value={sale.subtotal} showCurrency />
        <InfoField label="Additional Discount" value={sale.additionalDiscount} showCurrency />
        {taxRows.map((r) => (
          <InfoField
            key={`${r.rate}-${r.type}`}
            label={`Tax (${r.rate}%)${r.type === 'inclusive' ? ' incl.' : ''}`}
            value={r.amount}
            showCurrency
          />
        ))}
        <InfoField label="Invoice Amount" value={sale.totalAmount} showCurrency />
        <InfoField label="Paid Amount" value={sale.paidAmount} showCurrency valueClassName="text-green-600" />
        <InfoField
          label="Due Amount"
          value={sale.dueAmount}
          showCurrency
          valueClassName={sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}
        />
        <InfoField label="Cost Price" value={sale.costPrice} showCurrency />

        {/* {typeof sale.refundCreditApplied === 'number' && sale.refundCreditApplied > 0 ? (
          <InfoField
            label="Refund Credits Applied"
            value={sale.refundCreditApplied}
            showCurrency
            valueClassName="text-emerald-600"
          />
        ) : null} */}

        {saleReturns && saleReturns.length > 0 ? (
          <InfoField
            label="Refund Amount"
            value={saleReturns.reduce((sum, r) => sum + (r.totalRefundAmount ?? 0), 0)}
            showCurrency
            valueClassName="text-red-600"
          />
        ) : null}
      </div>

      {sale.notes && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <ClipboardList className="h-4 w-4" />
            Notes
          </div>
          <p className="text-sm text-muted-foreground">{sale.notes}</p>
        </div>
      )}
    </>
  );
}

export function SaleItemsList({ sale }: { sale: Sale }) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2 font-medium">
        <Boxes className="h-4 w-4" />
        Items ({sale.items.length})
      </div>

      <div className="space-y-3">
        {sale.items.map((item, index) => (
          <div
            key={`${item.productId}-${index}`}
            className="space-y-3 rounded-lg bg-muted/30 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{item.productName}</div>
              </div>
              <Badge variant="outline" className="shrink-0">
                Qty {item.quantity}
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <InfoField label="Price" value={item.price} showCurrency quantity={item.quantity} />
              <InfoField
                label="Discount"
                value={item.discount}
                showCurrency
                quantity={item.discount ? item.quantity : 0}
              />
              <InfoField label="Subtotal" value={item.subtotal} showCurrency />
              {item.taxRate ? (
                <InfoField
                  label={`Tax (${item.taxRate}%)${item.taxType === 'inclusive' ? ' incl.' : ''}`}
                  value={item.taxAmount ?? 0}
                  showCurrency
                />
              ) : null}
              <InfoField
                label="Cost Price"
                value={item.costPrice}
                showCurrency
                quantity={item.quantity}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
