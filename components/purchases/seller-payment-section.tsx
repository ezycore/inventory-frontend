"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { WalletIcon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useAccounts, useSupplierPendingDues } from "@/services/api";
import {
  usePurchasePageStore,
  type SellerSession,
} from "@/services/stores";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import SimpleSelect from "@/ui/components/simple-select";

interface Props {
  seller: SellerSession;
  netAmount: number;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
}

/**
 * Per-seller payment + notes + supplier credit section.
 * Rendered inside each seller card so each PO has its own payment context.
 */
export function SellerPaymentSection({
  seller,
  netAmount,
  isAccountsEnabled,
  formatCurrency,
}: Props) {
  const t = useTranslations("purchases.payment");
  const setPaymentInfo = usePurchasePageStore((s) => s.setPaymentInfo);
  const setNotes = usePurchasePageStore((s) => s.setNotes);
  const setCreditApplied = usePurchasePageStore((s) => s.setCreditApplied);

  // Accounts list — match the sales-flow pattern (lean payload, single call)
  const { data: accountsData } = useAccounts({
    all: true,
    fields: "_id,name,isDefault,balance,type,status",
  });
  const accounts = useMemo(() => accountsData?.items || [], [accountsData]);

  // Supplier credit + dues (only when supplier selected)
  const { data: pendingDuesData } = useSupplierPendingDues(
    seller.supplierId || "",
  );
  const supplierCreditBalance = pendingDuesData?.data?.creditBalance ?? 0;
  const supplierOutstandingDue = pendingDuesData?.data?.totalDue ?? 0;

  const accountId = seller.paymentInfo?.accountId || "";
  const paidAmount = seller.paymentInfo?.paidAmount || 0;
  const creditApplied = seller.creditApplied || 0;

  // One-time auto-init per seller: pre-select the default account and pre-fill
  // paid amount with the remaining net (net - credit applied). The user can
  // freely override afterwards; we never overwrite their edits.
  const initRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAccountsEnabled) return;
    if (initRef.current === seller.id) return;
    if (accounts.length === 0) return;
    if (netAmount <= 0) return;
    if (seller.purchaseType === "order") return; // order type: paid amount stays 0
    if (seller.paymentInfo) return; // user already touched payment

    const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
    const remaining = Math.max(0, netAmount - creditApplied);
    if (remaining <= 0) return;

    setPaymentInfo(seller.id, {
      paymentMethod: "cash",
      accountId: defaultAccount._id,
      accountName: defaultAccount.name,
      paidAmount: remaining,
    });
    initRef.current = seller.id;
  }, [
    isAccountsEnabled,
    accounts,
    seller.id,
    seller.purchaseType,
    seller.paymentInfo,
    netAmount,
    creditApplied,
    setPaymentInfo,
  ]);

  // Max credit we can apply: cannot exceed available balance or the total net amount
  const maxCreditApplicable = Math.max(
    0,
    Math.min(supplierCreditBalance, netAmount),
  );

  const updatePayment = (nextAccountId: string, nextPaid: number) => {
    if (nextAccountId && nextPaid > 0) {
      const acc = accounts.find((a) => a._id === nextAccountId);
      setPaymentInfo(seller.id, {
        paymentMethod: "cash",
        accountId: nextAccountId,
        accountName: acc?.name,
        paidAmount: nextPaid,
      });
    } else if (nextAccountId) {
      // account selected but 0 paid → keep account, paid 0
      setPaymentInfo(seller.id, {
        paymentMethod: "cash",
        accountId: nextAccountId,
        paidAmount: 0,
      });
    } else {
      setPaymentInfo(seller.id, null);
    }
  };

  const showCredit =
    isAccountsEnabled && supplierCreditBalance > 0 && netAmount > 0;
  const dueAmount = Math.max(0, netAmount - paidAmount - creditApplied);

  return (
    <div className="mt-3 space-y-3 rounded-md border bg-muted/30 p-3">
      {/* Supplier balance badges */}
      {seller.supplierId && (supplierOutstandingDue > 0 || supplierCreditBalance > 0) && (
        <div className="flex flex-wrap gap-2">
          {supplierOutstandingDue > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
              {t("supplierDue", { amount: formatCurrency(supplierOutstandingDue) })}
            </span>
          )}
          {supplierCreditBalance > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <WalletIcon className="h-3 w-3" />
              {t("creditAvailable", { amount: formatCurrency(supplierCreditBalance) })}
            </span>
          )}
        </div>
      )}

       {showCredit && (
        <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor={`use-credit-${seller.id}`}
              className="flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <WalletIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {t("applySupplierCredit")}
            </Label>
            <Switch
              id={`use-credit-${seller.id}`}
              checked={creditApplied > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  const credit = maxCreditApplicable;
                  setCreditApplied(seller.id, credit);
                  updatePayment(accountId, Math.max(0, netAmount - credit));
                } else {
                  setCreditApplied(seller.id, 0);
                  updatePayment(accountId, netAmount);
                }
              }}
            />
          </div>
          {creditApplied > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {t("maxAmount", { amount: formatCurrency(maxCreditApplicable) })}
              </span>
              <NumberField
                precision={2}
                min={0}
                max={maxCreditApplicable}
                step={1}
                value={creditApplied}
                onChange={(next) => {
                  const v = Math.max(0, Math.min(maxCreditApplicable, next ?? 0));
                  setCreditApplied(seller.id, v);
                  updatePayment(accountId, Math.max(0, netAmount - v));
                }}
                className="w-28 h-8 text-right text-sm"
              />
            </div>
          )}
        </div>
      )}

      {isAccountsEnabled && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{t("paymentAccount")}</Label>
            <SimpleSelect
              value={accountId}
              onValueChange={(v) => updatePayment(v, paidAmount)}
              options={accounts.map((a) => ({ label: a.name, value: a._id }))}
              placeholder={t("selectAccount")}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("paidAmount")}</Label>
            <NumberField
              precision={2}
              min={0}
              value={paidAmount || null}
              onChange={(v) => updatePayment(accountId, v ?? 0)}
              placeholder="0.00"
              className="h-9 text-sm"
              defaultValue={seller.purchaseType === "instant" ? netAmount - creditApplied : 0}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">{t("notes")}</Label>
        <Textarea
          value={seller.notes}
          onChange={(e) => setNotes(seller.id, e.target.value)}
          placeholder={t("supplierNotesPlaceholder")}
          rows={2}
          className="text-sm"
        />
      </div>

      {isAccountsEnabled && (paidAmount > 0 || creditApplied > 0) && (
        <div className="space-y-1 pt-1 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t("paid")}</span>
            <span className="font-semibold text-green-600 dark:text-green-500 tabular-nums">
              {formatCurrency(paidAmount)}
            </span>
          </div>
          {creditApplied > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("creditAppliedLabel")}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                −{formatCurrency(creditApplied)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t("due")}</span>
            <span
              className={`font-semibold tabular-nums ${dueAmount > 0
                ? "text-orange-600 dark:text-orange-500"
                : "text-green-600 dark:text-green-500"
                }`}
            >
              {formatCurrency(dueAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
