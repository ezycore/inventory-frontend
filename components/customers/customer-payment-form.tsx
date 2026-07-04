"use client";

import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import { ScrollArea } from "@/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Separator } from "@/ui/components/separator";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import type { CustomerLedgerSale } from "@/types";

interface AccountOption {
  _id: string;
  name: string;
  type?: string;
}

interface CustomerPaymentFormProps {
  paymentSale: CustomerLedgerSale;
  accounts: AccountOption[];
  creditBalance: number;
  formatCurrency: (n: number) => string;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  useCreditBalance: boolean;
  setUseCreditBalance: (v: boolean) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function CustomerPaymentForm({
  paymentSale,
  accounts,
  creditBalance,
  formatCurrency,
  paymentAmount,
  setPaymentAmount,
  paymentAccountId,
  setPaymentAccountId,
  paymentNotes,
  setPaymentNotes,
  useCreditBalance,
  setUseCreditBalance,
  isSubmitting,
  onCancel,
  onSubmit,
}: CustomerPaymentFormProps) {
  return (
    <ScrollArea className="flex-1 px-6 overflow-y-auto">
      <div className="py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ledger
        </Button>

        <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Invoice</span>
            <span className="font-mono font-medium">{paymentSale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatCurrency(paymentSale.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-medium text-green-600">
              {formatCurrency(paymentSale.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due</span>
            <span className="font-medium text-red-600">
              {formatCurrency(paymentSale.dueAmount)}
            </span>
          </div>
        </div>

        <Separator />

        {creditBalance > 0 && (
          <div className="flex items-center justify-between rounded-md border bg-blue-50 px-3 py-2 dark:bg-blue-950/20">
            <div className="text-sm">
              <div className="font-medium">Use store credit</div>
              <div className="text-xs text-muted-foreground">
                Available: {formatCurrency(creditBalance)}
              </div>
            </div>
            <Switch
              checked={useCreditBalance}
              onCheckedChange={setUseCreditBalance}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cust-pay-amount">Payment Amount</Label>
            <NumberField
              id="cust-pay-amount"
              precision={2}
              min={0}
              max={
                useCreditBalance
                  ? Math.min(paymentSale.dueAmount, creditBalance)
                  : paymentSale.dueAmount
              }
              value={paymentAmount === "" ? null : Number(paymentAmount)}
              onChange={(v) => setPaymentAmount(v == null ? "" : String(v))}
              placeholder="Enter amount"
            />
          </div>

          {!useCreditBalance && (
            <div className="space-y-2">
              <Label htmlFor="cust-pay-account">Payment Account</Label>
              <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                <SelectTrigger id="cust-pay-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name}
                      {account.type ? ` (${account.type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cust-pay-notes">Notes (optional)</Label>
            <Textarea
              id="cust-pay-notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={onSubmit}
              disabled={
                isSubmitting || !(Number(paymentAmount) > 0) || (!useCreditBalance && !paymentAccountId)
              }
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isSubmitting ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
