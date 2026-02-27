import { Wallet } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Checkbox } from '@/ui/components/checkbox';
import { Separator } from '@/ui/components/separator';
import type { Account } from '@/types';
import type { DueAllocation } from './types';

interface RefundAllocationCardProps {
  formatCurrency: (n: number) => string;
  totalRefundAmount: number;
  saleDueAmount: number;
  adjustSaleDueAmount: number;
  hasPendingDues: boolean;
  dueAllocations: DueAllocation[];
  onDueToggle: (index: number, selected: boolean) => void;
  onDueAmountChange: (index: number, amount: number) => void;
  remainingForRefund: number;
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  accountRefundAmount: number;
  onAccountRefundChange: (amount: number) => void;
  totalOtherDuesAllocated: number;
}

export function RefundAllocationCard({
  formatCurrency,
  totalRefundAmount,
  saleDueAmount,
  adjustSaleDueAmount,
  hasPendingDues,
  dueAllocations,
  onDueToggle,
  onDueAmountChange,
  remainingForRefund,
  accounts,
  selectedAccountId,
  onAccountChange,
  accountRefundAmount,
  onAccountRefundChange,
  totalOtherDuesAllocated,
}: RefundAllocationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Refund Allocation
        </CardTitle>
        <CardDescription>
          Total Refund: {formatCurrency(totalRefundAmount)} — Choose how to
          allocate the refund
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Adjust Current Sale Due */}
        {saleDueAmount > 0 && (
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Adjust Current Sale Due</div>
                <div className="text-sm text-muted-foreground">
                  Current due on this sale: {formatCurrency(saleDueAmount)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium text-green-600">
                  -{formatCurrency(adjustSaleDueAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Auto-applied</div>
              </div>
            </div>
          </div>
        )}

        {/* Adjust Other Customer Dues */}
        {hasPendingDues && (
          <div>
            <Label className="mb-2 block">Adjust Other Customer Dues</Label>
            <div className="space-y-2">
              {dueAllocations.map((due, index) => (
                <div
                  key={due.dueId}
                  className={`flex items-center gap-4 p-3 border rounded-lg ${
                    due.selected ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <Checkbox
                    checked={due.selected}
                    onCheckedChange={(checked) => onDueToggle(index, !!checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">Invoice: {due.invoiceNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {formatCurrency(due.dueAmount)}
                    </div>
                  </div>
                  <Input
                    type="number"
                    className="w-32"
                    value={due.allocatedAmount}
                    onChange={(e) =>
                      onDueAmountChange(index, parseFloat(e.target.value) || 0)
                    }
                    disabled={!due.selected}
                    max={due.dueAmount}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Refund */}
        {remainingForRefund > 0 && (
          <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
            <div className="font-medium mb-2">Cash/Account Refund</div>
            <div className="text-sm text-muted-foreground mb-4">
              Remaining amount to refund: {formatCurrency(remainingForRefund)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account</Label>
                <Select value={selectedAccountId} onValueChange={onAccountChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.name} ({formatCurrency(account.balance ?? 0)})
                      </SelectItem>
                    ))}
                    {accounts.length === 0 && (
                      <SelectItem value="" disabled>
                        No accounts available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Refund Amount</Label>
                <Input
                  type="number"
                  value={accountRefundAmount}
                  onChange={(e) =>
                    onAccountRefundChange(
                      Math.min(parseFloat(e.target.value) || 0, remainingForRefund),
                    )
                  }
                  max={remainingForRefund}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Allocation Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Refund:</span>
            <span>{formatCurrency(totalRefundAmount)}</span>
          </div>
          {adjustSaleDueAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Adjust Sale Due:</span>
              <span>-{formatCurrency(adjustSaleDueAmount)}</span>
            </div>
          )}
          {totalOtherDuesAllocated > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Adjust Other Dues:</span>
              <span>-{formatCurrency(totalOtherDuesAllocated)}</span>
            </div>
          )}
          {accountRefundAmount > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Account Refund:</span>
              <span>{formatCurrency(accountRefundAmount)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
