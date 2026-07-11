"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  PaymentEntryForm as SharedPaymentEntryForm,
} from "@/components/shared/payments";
import type { Account, PurchaseOrder } from "@/types";

interface PaymentEntryFormProps {
  order: PurchaseOrder;
  accounts: Account[];
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  useSupplierCredit: boolean;
  setUseSupplierCredit: (v: boolean) => void;
  isSubmittingPayment: boolean;
  onCancel: () => void;
  onSubmitPayment: () => void;
}

export function PaymentEntryForm({
  order,
  useSupplierCredit,
  setUseSupplierCredit,
  isSubmittingPayment,
  onSubmitPayment,
  ...rest
}: PaymentEntryFormProps) {
  const t = useTranslations("purchases.payment");
  const creditAvailable = order.supplierId?.creditBalance ?? 0;
  return (
    <SharedPaymentEntryForm
      doc={{ status: order.status, dueAmount: order.dueAmount ?? 0 }}
      isSubmitting={isSubmittingPayment}
      onSubmit={onSubmitPayment}
      credit={{
        available: creditAvailable,
        label: t("applySupplierCredit"),
        enabled: useSupplierCredit,
        setEnabled: setUseSupplierCredit,
      }}
      {...rest}
    />
  );
}
