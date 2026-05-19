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

/** Each pending-due row rendered inside the card. `referenceLabel` is the
 *  human-readable identifier (invoice number for sales, order number for purchases). */
export interface DueAllocationItem {
  dueId: string;
  dueAmount: number;
  allocatedAmount: number;
  selected: boolean;
  /** Human-readable reference shown in the list (e.g. "INV-001" or "PO-001") */
  referenceLabel: string;
}

export interface RefundAllocationCardProps {
  formatCurrency: (n: number) => string;
  totalRefundAmount: number;

  // ── Document-level due adjustment ──────────────────────────────────
  /** Current due amount on the source document (sale / purchase order) */
  documentDueAmount: number;
  /** Amount that will be auto-applied against the document's due */
  adjustDocumentDueAmount: number;
  /** Section heading, e.g. "Adjust Current Sale Due" */
  documentDueTitle: string;
  /** Sub-label, e.g. "Current due on this sale:" */
  documentDueSubtitle: string;

  // ── Other pending dues ─────────────────────────────────────────────
  /** Section heading, e.g. "Adjust Other Customer Dues" */
  otherDuesTitle: string;
  hasPendingDues: boolean;
  dueAllocations: DueAllocationItem[];
  onDueToggle: (index: number, selected: boolean) => void;
  onDueAmountChange: (index: number, amount: number) => void;

  // ── Cash refund ────────────────────────────────────────────────────
  remainingForRefund: number;
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  accountRefundAmount: number;
  onAccountRefundChange: (amount: number) => void;
  totalOtherDuesAllocated: number;

  // ── Visual customisation ───────────────────────────────────────────
  /** Tailwind color class for adjustment rows, e.g. "text-green-600" or "text-blue-600" */
  adjustmentColorClass?: string;
  /** Optional suffix appended to the card description */
  descriptionSuffix?: string;
}

export function RefundAllocationCard({
  formatCurrency,
  totalRefundAmount,
  documentDueAmount,
  adjustDocumentDueAmount,
  documentDueTitle,
  documentDueSubtitle,
  otherDuesTitle,
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
  adjustmentColorClass = 'text-green-600',
  descriptionSuffix = '',
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
          allocate the refund{descriptionSuffix}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Adjust Source Document's Due */}
        {documentDueAmount > 0 && (
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{documentDueTitle}</div>
                <div className="text-sm text-muted-foreground">
                  {documentDueSubtitle}{' '}
                  {formatCurrency(documentDueAmount)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-medium ${adjustmentColorClass}`}>
                  -{formatCurrency(adjustDocumentDueAmount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Auto-applied
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Adjust Other Pending Dues */}
        {hasPendingDues && (
          <div>
            <Label className="mb-2 block">{otherDuesTitle}</Label>
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
                    onCheckedChange={(checked) =>
                      onDueToggle(index, !!checked)
                    }
                  />
                  <div className="flex-1">
                    <div className="font-medium font-mono text-sm">
                      {due.referenceLabel}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: {formatCurrency(due.dueAmount)}
                    </div>
                  </div>
                  <Input
                    type="number"
                    className="w-32"
                    value={due.allocatedAmount}
                    onChange={(e) =>
                      onDueAmountChange(
                        index,
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    disabled={!due.selected}
                    max={due.dueAmount}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cash refund to account */}
        {remainingForRefund > 0 && (
          <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
            <div className="font-medium mb-2">Cash Refund to Account</div>
            <div className="text-sm text-muted-foreground mb-4">
              Remaining amount to refund:{' '}
              {formatCurrency(remainingForRefund)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Account</Label>
                <Select
                  value={selectedAccountId}
                  onValueChange={onAccountChange}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.name} (
                        {formatCurrency(account.balance ?? 0)})
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
              <div className="space-y-1.5">
                <Label>Refund Amount</Label>
                <Input
                  type="number"
                  value={accountRefundAmount}
                  onChange={(e) =>
                    onAccountRefundChange(
                      Math.min(
                        parseFloat(e.target.value) || 0,
                        remainingForRefund,
                      ),
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
          {adjustDocumentDueAmount > 0 && (
            <div className={`flex justify-between ${adjustmentColorClass}`}>
              <span>{documentDueTitle}:</span>
              <span>-{formatCurrency(adjustDocumentDueAmount)}</span>
            </div>
          )}
          {totalOtherDuesAllocated > 0 && (
            <div className={`flex justify-between ${adjustmentColorClass}`}>
              <span>Adjust Other Dues:</span>
              <span>-{formatCurrency(totalOtherDuesAllocated)}</span>
            </div>
          )}
          {accountRefundAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Cash Refund:</span>
              <span>{formatCurrency(accountRefundAmount)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
