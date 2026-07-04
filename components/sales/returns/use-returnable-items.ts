'use client';
// coding-standard: maintained

import { useCallback, useMemo, useState } from 'react';
import type { SaleItem } from '@/types';
import { lineRefundBasis } from '@/utils/refund';
import type { ReturnableItem } from './types';

function buildReturnableItems(
  saleItems: SaleItem[],
  orderSubtotal: number,
  additionalDiscount: number,
): ReturnableItem[] {
  return saleItems.map((item) => {
    const salePrice = item.price - (item.discount ?? 0);
    // Per-unit refund basis derived from the STORED line subtotal (not the rounded
    // `price*qty`, which drifts for combo lines) with the order-level discount
    // spread across all lines, tax-inclusive. Bit-identical to the backend, which
    // is authoritative. `lineRefundBasis(saleQty)` gives the whole-line refund;
    // divide by saleQty for the per-unit rate the qty handler scales.
    const fullLineRefund = lineRefundBasis(
      item,
      item.quantity,
      orderSubtotal,
      additionalDiscount,
    );
    const refundUnitPrice = item.quantity > 0 ? fullLineRefund / item.quantity : 0;
    return {
      ...item,
      inventoryId: item.inventoryId ?? item.productId,
      maxReturnableQty:
        item.quantity -
        ((item as SaleItem & { returnedQuantity?: number }).returnedQuantity ?? 0),
      returnQty: 0,
      refundAmount: 0,
      selected: false,
      salePrice,
      refundUnitPrice,
    };
  });
}

export function useReturnableItems() {
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);

  const resetItems = useCallback(() => setReturnableItems([]), []);

  const initFromSaleItems = useCallback(
    (
      saleItems: SaleItem[] | undefined,
      orderSubtotal = 0,
      additionalDiscount = 0,
    ) => {
      if (saleItems)
        setReturnableItems(
          buildReturnableItems(saleItems, orderSubtotal, additionalDiscount),
        );
    },
    [],
  );

  const handleItemSelect = useCallback((index: number, selected: boolean) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected,
        ...(selected ? {} : { returnQty: 0, refundAmount: 0 }),
      };
      return updated;
    });
  }, []);

  const handleItemQtyChange = useCallback((index: number, qty: number) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validQty = Math.max(0, Math.min(qty, item.maxReturnableQty));
      const unitRefund = item.refundUnitPrice || item.salePrice || item.price;
      updated[index] = {
        ...item,
        returnQty: validQty,
        refundAmount: Math.round(validQty * unitRefund * 100) / 100,
        selected: validQty > 0,
      };
      return updated;
    });
  }, []);

  const handleRefundAmountChange = useCallback((index: number, amount: number) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const maxRefund = item.returnQty * (item.refundUnitPrice || item.salePrice || item.price);
      updated[index] = {
        ...item,
        refundAmount: Math.max(0, Math.min(amount, maxRefund)),
      };
      return updated;
    });
  }, []);

  const selectedItems = useMemo(
    () => returnableItems.filter((i) => i.selected && i.returnQty > 0),
    [returnableItems],
  );
  const totalReturnQty = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.returnQty, 0),
    [selectedItems],
  );
  const grossRefundAmount = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.refundAmount, 0),
    [selectedItems],
  );

  return {
    returnableItems,
    selectedItems,
    totalReturnQty,
    grossRefundAmount,
    resetItems,
    initFromSaleItems,
    handleItemSelect,
    handleItemQtyChange,
    handleRefundAmountChange,
  };
}
