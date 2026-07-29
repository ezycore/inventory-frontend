"use client";
// coding-standard: maintained

import { format } from "date-fns";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, CreditCard } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import type { CustomerLedgerReceiptGroup } from "./group-ledger-payments";

interface LedgerReceiptEntryProps {
  data: CustomerLedgerReceiptGroup;
  date: Date;
  formatCurrency: (n: number) => string;
  /** `customers.ledger` translations, shared with the sibling entry types. */
  t: ReturnType<typeof useTranslations>;
}

/**
 * One multi-invoice receipt in the ledger: the total collapsed by default,
 * expanding to the per-invoice split it settled.
 */
export function LedgerReceiptEntry({
  data,
  date,
  formatCurrency,
  t,
}: LedgerReceiptEntryProps) {
  const tBulk = useTranslations("customers.bulkPayment");
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">{t("paymentReceived")}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {tBulk("receiptNumber", { number: data.receiptNumber })}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">{format(date, "dd MMM yyyy")}</span>
      </div>

      <div className="text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">{t("amount")}</span>{" "}
          <span className="font-medium text-green-600">{formatCurrency(data.amount)}</span>
        </div>
        {data.accountName && (
          <div>
            <span className="text-muted-foreground">{t("account")}</span>{" "}
            <span>{data.accountName}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={expanded}
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
        />
        {tBulk("invoicesCovered", { count: data.payments.length })}
      </button>

      {expanded && (
        <div className="rounded-md border divide-y text-sm">
          {data.payments.map((payment) => (
            <div key={payment._id} className="flex justify-between px-3 py-1.5">
              <span className="font-mono text-xs">
                {payment.referenceId?.invoiceNumber ?? "—"}
              </span>
              <span className="font-medium text-green-600">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
