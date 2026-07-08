"use client";

import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/ui/components/badge";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { InfoField } from "@/components/shared/info-field";

export interface ReturnedItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount?: number;
  refundAmount: number;
}

export interface NormalizedReturnAllocation {
  /** Adjusted against this document's own due (sale due / order due). */
  documentDueAdjustment?: { label: string; amount: number };
  /** Adjusted against other documents (other invoices / other POs). */
  otherDueAdjustments?: Array<{ label: string; amount: number; reference?: ReactNode }>;
  /** Cash actually refunded to an account. */
  accountRefund?: { amount: number; paymentMethod?: string };
  /** Optional counterparty credit (e.g. customer store credit on sales). */
  counterpartyCredit?: { label: string; amount: number };
}

export interface NormalizedReturn {
  _id: string;
  returnNumber: string;
  createdAt: string | Date;
  status: string;
  reason: string;
  totalRefundAmount: number;
  deductionAmount?: number;
  notes?: string;
  items: ReturnedItem[];
  allocation?: NormalizedReturnAllocation;
}

interface ReturnsHistoryListProps {
  returns: NormalizedReturn[];
  isLoading: boolean;
  formatCurrency: (n: number) => string;
  emptyMessage: string;
  /**
   * Render only the list content (no card or title) for embedding inside a
   * detail-sheet SectionFold, which supplies its own header.
   */
  bare?: boolean;
}

function ReturnedItemRow({
  item,
  formatCurrency,
}: {
  item: ReturnedItem;
  formatCurrency: (n: number) => string;
}) {
  const gross = item.price * item.quantity;
  const discount = item.discount ?? 0;
  return (
    <div className="flex items-start justify-between gap-3 text-xs py-1.5 border-b last:border-0 border-muted">
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate block">{item.productName || "Product"}</span>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        {/* <div className="text-muted-foreground">
          <span className="text-foreground font-medium">{item.quantity}</span>
          {" × "}
          {formatCurrency(item.price)}
          {" = "}
          <span className="text-foreground">{formatCurrency(gross)}</span>
          {discount > 0 && (
            <>
              {" − "}
              <span className="text-amber-600">{formatCurrency(discount)} disc</span>
            </>
          )}
        </div> */}
        <div className="text-red-600 font-medium">
          Refund: −{formatCurrency(item.refundAmount)}
        </div>
      </div>
    </div>
  );
}

function AllocationPanel({
  allocation,
  formatCurrency,
}: {
  allocation: NormalizedReturnAllocation;
  formatCurrency: (n: number) => string;
}) {
  const hasAny =
    (allocation.documentDueAdjustment?.amount ?? 0) > 0 ||
    (allocation.otherDueAdjustments?.length ?? 0) > 0 ||
    !!allocation.accountRefund ||
    (allocation.counterpartyCredit?.amount ?? 0) > 0;
  if (!hasAny) return null;
  return (
    <div className="mt-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20 px-2.5 py-2 space-y-1">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        Refund Allocation
      </div>
      {allocation.documentDueAdjustment &&
        allocation.documentDueAdjustment.amount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{allocation.documentDueAdjustment.label}</span>
            <span className="font-medium text-blue-600">
              {formatCurrency(allocation.documentDueAdjustment.amount)}
            </span>
          </div>
        )}
      {allocation.otherDueAdjustments?.map((d, i) => (
        <div key={i} className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            {d.label}
            {d.reference}
          </span>
          <span className="font-medium text-blue-600">{formatCurrency(d.amount)}</span>
        </div>
      ))}
      {allocation.accountRefund && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            Cash refund
            {allocation.accountRefund.paymentMethod
              ? ` (${allocation.accountRefund.paymentMethod})`
              : ""}
          </span>
          <span className="font-medium text-green-600">
            {formatCurrency(allocation.accountRefund.amount)}
          </span>
        </div>
      )}
      {allocation.counterpartyCredit && allocation.counterpartyCredit.amount > 0 && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{allocation.counterpartyCredit.label}</span>
          <span className="font-medium text-blue-600">
            {formatCurrency(allocation.counterpartyCredit.amount)}
          </span>
        </div>
      )}
    </div>
  );
}

export function ReturnsHistoryList({
  returns,
  isLoading,
  formatCurrency,
  emptyMessage,
  bare = false,
}: ReturnsHistoryListProps) {
  const content = (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        bare ? (
          <p className="py-2 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <RotateCcw className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => {
            const hasDeduction = (ret.deductionAmount ?? 0) > 0;
            return (
              <div key={ret._id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{ret.returnNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(ret.createdAt), "dd MMM yyyy hh:mm aa")}
                    </div>
                  </div>
                  <Badge
                    variant={
                      ret.status === "completed"
                        ? "default"
                        : ret.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                    className="capitalize shrink-0"
                  >
                    {ret.status}
                  </Badge>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <InfoField
                    label="Reason"
                    value={<span className="capitalize">{ret.reason.replace(/_/g, " ")}</span>}
                  />
                  <InfoField
                    label="Items"
                    value={`${ret.items.reduce((s, i) => s + i.quantity, 0)} unit(s) across ${ret.items.length} product(s)`}
                  />
                  {hasDeduction && (
                    <InfoField
                      label="Gross Refund"
                      value={
                        <span className="text-muted-foreground">
                          -{formatCurrency(ret.totalRefundAmount + ret.deductionAmount!)}
                        </span>
                      }
                    />
                  )}
                  {hasDeduction && (
                    <InfoField
                      label="Deduction / Fee"
                      value={
                        <span className="text-destructive">
                          -{formatCurrency(ret.deductionAmount!)}
                        </span>
                      }
                    />
                  )}
                  <InfoField
                    label={hasDeduction ? "Net Refund" : "Refund Amount"}
                    value={
                      <span className="text-red-600">
                        -{formatCurrency(ret.totalRefundAmount)}
                      </span>
                    }
                  />
                </div>

                {ret.items.length > 0 && (
                  <div className="mt-2 rounded-md bg-muted/50 p-2 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Returned Items
                    </div>
                    {ret.items.map((item, idx) => (
                      <ReturnedItemRow
                        key={`${item.productId}-${idx}`}
                        item={item}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                )}

                {ret.allocation && (
                  <AllocationPanel
                    allocation={ret.allocation}
                    formatCurrency={formatCurrency}
                  />
                )}

                {ret.notes && <p className="text-xs text-muted-foreground">{ret.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (bare) return content;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2 font-medium">
        <RotateCcw className="h-4 w-4" />
        Returns ({isLoading ? "…" : returns.length})
      </div>

      <Separator />

      {content}
    </div>
  );
}
