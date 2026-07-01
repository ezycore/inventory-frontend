'use client';

import { useCallback, useMemo, useState } from 'react';
import type { SaleItem } from '@/types';
import { computeLineTax } from '@/utils/tax';
import type { ReturnableItem } from './types';

function buildReturnableItems(saleItems: SaleItem[]): ReturnableItem[] {
  return saleItems.map((item) => {
    const salePrice = item.price - (item.discount ?? 0);
    // Tax-inclusive per-unit price — the customer paid net + tax (exclusive) or the
    // tax-inclusive price (inclusive). Refunds must return that, not just the net.
    const refundUnitPrice = computeLineTax({
      price: salePrice,
      quantity: 1,
      discount: 0,
      taxRate: item.taxRate,
      taxType: item.taxType,
    }).lineTotal;
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

  const initFromSaleItems = useCallback((saleItems: SaleItem[] | undefined) => {
    if (saleItems) setReturnableItems(buildReturnableItems(saleItems));
  }, []);

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
