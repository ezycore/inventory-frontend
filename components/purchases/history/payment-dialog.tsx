import type { PurchaseOrder } from "@/types";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Textarea } from "@/ui/components/textarea";
import { CreditCard } from "lucide-react";

interface Account {
  _id: string;
  name: string;
  type: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: PurchaseOrder | null;
  formatCurrency: (n: number) => string;
  // Form state
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  accounts: Account[];
  isPending: boolean;
  onSubmit: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  selectedOrder,
  formatCurrency,
  paymentAmount,
  setPaymentAmount,
  paymentAccountId,
  setPaymentAccountId,
  paymentMethod,
  setPaymentMethod,
  paymentNotes,
  setPaymentNotes,
  accounts,
  isPending,
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
            Add payment for order {selectedOrder?.orderNumber}
          </DialogDescription>
        </DialogHeader>

        {selectedOrder && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Due Amount
                </span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(selectedOrder.dueAmount || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedOrder.dueAmount || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Payment Account</Label>
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

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="mfs">Mobile Banking</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
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
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || !paymentAccountId || !paymentAmount}
          >
            {isPending ? "Processing..." : "Add Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
