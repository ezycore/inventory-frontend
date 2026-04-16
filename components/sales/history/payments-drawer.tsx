import { format } from 'date-fns';
import { Receipt, CreditCard, Wallet } from 'lucide-react';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Separator } from '@/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import { Skeleton } from '@/ui/components/skeleton';
import type { Sale, Payment } from '@/types';

interface PaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  onMakePayment: (sale: Sale) => void;
}

export function PaymentsDrawer({
  open,
  onOpenChange,
  sale,
  payments,
  isLoadingPayments,
  isAccountsEnabled,
  formatCurrency,
  onMakePayment,
}: PaymentsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payments — {sale?.invoiceNumber}
          </SheetTitle>
          <SheetDescription>Payment history for this sale</SheetDescription>
        </SheetHeader>

        {sale && (
          <div className="space-y-6 mt-6">
            {/* Sale summary */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">
                  {formatCurrency(sale.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Amount</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(sale.paidAmount)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Due Amount</span>
                <span
                  className={`font-bold ${
                    sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(sale.dueAmount)}
                </span>
              </div>
            </div>

            {/* Make Payment button */}
            {isAccountsEnabled &&
              sale.dueAmount > 0 &&
              sale.status !== 'cancelled' && (
                <Button
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onMakePayment(sale);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              )}

            {/* Payment history */}
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
                            {format(
                              new Date(payment.createdAt),
                              'dd MMM yyyy HH:mm',
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentMethod}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-3 w-3" />
                        {payment.accountId?.name || 'Unknown Account'}
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-muted-foreground">
                          {payment.notes}
                        </p>
                      )}
                      {payment.createdBy && (
                        <p className="text-xs text-muted-foreground">
                          By {payment.createdBy.firstName}{' '}
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
