'use client';

import type { ReactNode } from 'react';
import { useCurrency } from '@/lib/currency';

interface InfoFieldProps {
  label: string;
  value: number | string | ReactNode;
  showCurrency?: boolean;
  quantity?: number;
  valueClassName?: string;
}

export function InfoField({
  label,
  value,
  showCurrency = false,
  quantity,
  valueClassName,
}: InfoFieldProps) {
  const { format } = useCurrency();

  let displayValue: ReactNode;

  if (typeof value === 'number') {
    const formattedValue = showCurrency ? format(value) : String(value);

    if (quantity !== undefined) {
      const total = value * quantity;
      const formattedTotal = showCurrency ? format(total) : String(total);
      displayValue = (
        <span className={valueClassName}>
          {formattedValue} × {quantity} = {formattedTotal}
        </span>
      );
    } else {
      displayValue = <span className={valueClassName}>{formattedValue}</span>;
    }
  } else if (typeof value === 'string' && valueClassName) {
    displayValue = <span className={valueClassName}>{value}</span>;
  } else {
    displayValue = value as ReactNode;
  }

  return (
    <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="break-words text-sm font-medium">{displayValue}</div>
    </div>
  );
}
