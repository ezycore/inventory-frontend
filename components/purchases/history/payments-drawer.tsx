import type { PurchaseOrder } from "@/types";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Separator } from "@/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Skeleton } from "@/ui/components/skeleton";
import { CreditCard, Receipt, Wallet } from "lucide-react";
import type { Payment } from "./types";

interface PaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: PurchaseOrder | null;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  formatDateTime: (d: string | Date) => string;
  onMakePayment: (order: PurchaseOrder) => void;
}

export function PaymentsDrawer({
  open,
  onOpenChange,
  selectedOrder,
  payments,
  isLoadingPayments,
  isAccountsEnabled,
  formatCurrency,
  formatDateTime,
  onMakePayment,
}: PaymentsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payments - {selectedOrder?.orderNumber}
          </SheetTitle>
          <SheetDescription>
            Payment history for this purchase
          </SheetDescription>
        </SheetHeader>

        {selectedOrder && (
          <div className="space-y-6 mt-6">
            {/* Order Summary */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">
                  {formatCurrency(selectedOrder.grandTotal || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Amount</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(selectedOrder.paidAmount || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Due Amount</span>
                <span
                  className={`font-bold ${
                    (selectedOrder.dueAmount || 0) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(selectedOrder.dueAmount || 0)}
                </span>
              </div>
            </div>

            {isAccountsEnabled &&
              (selectedOrder.dueAmount || 0) > 0 &&
              selectedOrder.status !== "cancelled" && (
                <Button
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onMakePayment(selectedOrder);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              )}

            {/* Payments List */}
            <div>
              <h4 className="font-medium mb-3">Payment History</h4>
              {isLoadingPayments ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(payment.amount)}
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(payment.createdAt)}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentMethod}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-3 w-3" />
                        {payment.accountId?.name || "Unknown Account"}
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-muted-foreground">
                          {payment.notes}
                        </p>
                      )}
                      {payment.createdBy && (
                        <p className="text-xs text-muted-foreground">
                          By {payment.createdBy.firstName}{" "}
                          {payment.createdBy.lastName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
