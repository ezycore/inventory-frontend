"use client";

import { useTranslations } from 'next-intl';
import {
  PaymentEntryForm as SharedPaymentEntryForm,
} from "@/components/shared/payments";
import type { Account, Sale } from "@/types";
import { populatedRef } from "@/utils/populated-ref";

interface PaymentEntryFormProps {
  sale: Sale;
  accounts: Account[];
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  useCreditBalance: boolean;
  setUseCreditBalance: (v: boolean) => void;
  isSubmittingPayment: boolean;
  onCancel: () => void;
  onSubmitPayment: () => void;
}

export function PaymentEntryForm({
  sale,
  useCreditBalance,
  setUseCreditBalance,
  isSubmittingPayment,
  onSubmitPayment,
  ...rest
}: PaymentEntryFormProps) {
  const t = useTranslations('sales.history.paymentForm');
  const creditAvailable = populatedRef(sale.customerId)?.creditBalance ?? 0;
  return (
    <SharedPaymentEntryForm
      doc={{ status: sale.status, dueAmount: sale.dueAmount }}
      isSubmitting={isSubmittingPayment}
      onSubmit={onSubmitPayment}
      credit={{
        available: creditAvailable,
        label: t('useStoreCredit'),
        enabled: useCreditBalance,
        setEnabled: setUseCreditBalance,
      }}
      {...rest}
    />
  );
}
