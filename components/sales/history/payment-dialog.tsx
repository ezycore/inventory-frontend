import { CreditCard } from 'lucide-react';
import { Button } from '@/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Textarea } from '@/ui/components/textarea';
import type { Sale, Account } from '@/types';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  accounts: Account[];
  formatCurrency: (n: number) => string;
  // form state
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  sale,
  accounts,
  formatCurrency,
  paymentAmount,
  setPaymentAmount,
  paymentAccountId,
  setPaymentAccountId,
  paymentNotes,
  setPaymentNotes,
  isSubmitting,
  onSubmit,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment
          </DialogTitle>
          <DialogDescription>
            Add payment for invoice {sale?.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="space-y-4">
            {/* Due amount info */}
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Due Amount
                </span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(sale.dueAmount)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Payment Amount</Label>
              <Input
                id="pay-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={sale.dueAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            {/* Account */}
            <div className="space-y-2">
              <Label htmlFor="pay-account">Payment Account</Label>
              <Select
                value={paymentAccountId}
                onValueChange={setPaymentAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="pay-notes">Notes (Optional)</Label>
              <Textarea
                id="pay-notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add notes about this payment..."
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              isSubmitting || !paymentAccountId || !paymentAmount
            }
          >
            {isSubmitting ? 'Processing...' : 'Add Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
