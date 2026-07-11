import { useTranslations } from 'next-intl';
import { Wallet, Gift } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { NumberField } from '@/ui/components/number-field';
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

  // ── Counterparty credit (optional) ─────────────────────────────
  /** When true, render the credit conversion section (store credit for sales, supplier credit for purchases). */
  showCounterpartyCredit?: boolean;
  counterpartyCreditAmount?: number;
  onCounterpartyCreditChange?: (amount: number) => void;
  /** Counterparty's existing credit balance, shown for context. */
  currentCounterpartyCreditBalance?: number;
  /** Override the credit section heading (default: "Convert to Store Credit") */
  creditSectionTitle?: string;
  /** Override the credit section description line */
  creditSectionDescription?: string;

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
  showCounterpartyCredit = false,
  counterpartyCreditAmount = 0,
  onCounterpartyCreditChange,
  currentCounterpartyCreditBalance,
  creditSectionTitle,
  creditSectionDescription,
  adjustmentColorClass = 'text-green-600',
  descriptionSuffix = '',
}: RefundAllocationCardProps) {
  const t = useTranslations('common.returns');
  const resolvedCreditTitle = creditSectionTitle ?? t('convertToStoreCredit');
  const resolvedCreditDescription = creditSectionDescription ?? t('convertToStoreCreditDescription');
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
                  <NumberField
                    className="w-32"
                    precision={2}
                    value={due.allocatedAmount}
                    onChange={(v) => onDueAmountChange(index, v ?? 0)}
                    disabled={!due.selected}
                    max={due.dueAmount}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Convert to counterparty credit */}
        {showCounterpartyCredit && onCounterpartyCreditChange && (
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium flex items-center gap-2">
                <Gift className="h-4 w-4 text-blue-600" />
                {resolvedCreditTitle}
              </div>
              {currentCounterpartyCreditBalance != null && (
                <span className="text-xs text-muted-foreground">
                  Current credit: {formatCurrency(currentCounterpartyCreditBalance)}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              {resolvedCreditDescription}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('creditAmount')}</Label>
                <NumberField
                  precision={2}
                  value={counterpartyCreditAmount}
                  onChange={(v) => {
                    const next = v ?? 0;
                    const cap = remainingForRefund + counterpartyCreditAmount;
                    onCounterpartyCreditChange(Math.max(0, Math.min(next, cap)));
                  }}
                  max={remainingForRefund + counterpartyCreditAmount}
                />
              </div>
              <div className="flex items-end">
                <div className="text-xs text-muted-foreground">
                  Max available: {formatCurrency(remainingForRefund + counterpartyCreditAmount)}
                </div>
              </div>
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
                <Label>{t('account')}</Label>
                <Select
                  value={selectedAccountId}
                  onValueChange={onAccountChange}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={t('selectAccount')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.name} (
                        {formatCurrency(account.balance ?? 0)})
                      </SelectItem>
                    ))}
                    {accounts.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No accounts available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('refundAmount')}</Label>
                <NumberField
                  precision={2}
                  value={accountRefundAmount}
                  onChange={(v) =>
                    onAccountRefundChange(Math.min(v ?? 0, remainingForRefund))
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
            <span>{t('totalRefund')}</span>
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
              <span>{t('adjustOtherDues')}</span>
              <span>-{formatCurrency(totalOtherDuesAllocated)}</span>
            </div>
          )}
          {accountRefundAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t('cashRefund')}</span>
              <span>{formatCurrency(accountRefundAmount)}</span>
            </div>
          )}
          {counterpartyCreditAmount > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>{t('storeCredit')}</span>
              <span>{formatCurrency(counterpartyCreditAmount)}</span>
            </div>
          )}

          {(() => {
            const allocated =
              adjustDocumentDueAmount +
              totalOtherDuesAllocated +
              accountRefundAmount +
              counterpartyCreditAmount;
            const diff = totalRefundAmount - allocated;
            const balanced = Math.abs(diff) < 0.01;
            return (
              <div
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium ${
                  balanced
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                <span>
                  {balanced ? '✓ Allocation balanced' : '✗ Allocation off'}
                </span>
                <span>
                  {formatCurrency(allocated)} / {formatCurrency(totalRefundAmount)}
                  {!balanced && ` (Δ ${formatCurrency(Math.abs(diff))})`}
                </span>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
