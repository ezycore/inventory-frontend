'use client';

import { format } from 'date-fns';
import { Boxes, ClipboardList } from 'lucide-react';
import { Badge } from '@/ui/components/badge';
import { InfoField } from '@/components/shared/info-field';
import type { Sale } from '@/types';

export function SaleDetailsBlock({ sale }: { sale: Sale }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoField label="Invoice #" value={sale.invoiceNumber} />
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
        <InfoField label="Created At" value={format(new Date(sale.createdAt), 'dd MMM yyyy HH:mm')} />
        <InfoField label="Updated At" value={format(new Date(sale.updatedAt), 'dd MMM yyyy HH:mm')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoField label="Subtotal" value={sale.subtotal} showCurrency />
        <InfoField label="Additional Discount" value={sale.additionalDiscount} showCurrency />
        <InfoField label="Total Amount" value={sale.totalAmount} showCurrency />
        <InfoField label="Paid Amount" value={sale.paidAmount} showCurrency valueClassName="text-green-600" />
        <InfoField
          label="Due Amount"
          value={sale.dueAmount}
          showCurrency
          valueClassName={sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}
        />
        <InfoField label="Cost Price" value={sale.costPrice} showCurrency />
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
