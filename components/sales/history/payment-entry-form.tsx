"use client";

import {
  PaymentEntryForm as SharedPaymentEntryForm,
} from "@/components/shared/payments";
import type { Account, Sale } from "@/types";

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
  const creditAvailable = sale.customerId?.creditBalance ?? 0;
  return (
    <SharedPaymentEntryForm
      doc={{ status: sale.status, dueAmount: sale.dueAmount }}
      isSubmitting={isSubmittingPayment}
      onSubmit={onSubmitPayment}
      credit={{
        available: creditAvailable,
        label: "Use store credit",
        enabled: useCreditBalance,
        setEnabled: setUseCreditBalance,
      }}
      {...rest}
    />
  );
}
