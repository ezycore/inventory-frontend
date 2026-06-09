import { CornerUpLeft } from 'lucide-react';
import {
  Card,
  CardContent,
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
import { Textarea } from '@/ui/components/textarea';

export interface ReturnReason {
  value: string;
  label: string;
}

export interface ReturnDetailsFormCardProps {
  reasons: ReturnReason[];
  reason: string;
  onReasonChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  /** When provided, a Deduction section is shown below the notes field */
  deductionAmount?: number;
  onDeductionChange?: (amount: number) => void;
  /** Gross refund total (sum of item refund amounts) — used to derive net refund preview */
  grossRefundAmount?: number;
  formatCurrency?: (n: number) => string;
}

export function ReturnDetailsFormCard({
  reasons,
  reason,
  onReasonChange,
  notes,
  onNotesChange,
  deductionAmount,
  onDeductionChange,
  grossRefundAmount,
  formatCurrency,
}: ReturnDetailsFormCardProps) {
  const showDeduction = typeof onDeductionChange === 'function';
  const deduction = deductionAmount ?? 0;
  const netRefund =
    grossRefundAmount !== undefined
      ? Math.max(0, grossRefundAmount - deduction)
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CornerUpLeft className="h-5 w-5 text-primary" />
          Return Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Reason for Return</Label>
            <Select value={reason} onValueChange={onReasonChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes (Optional)</Label>
          <Textarea
            placeholder="Additional notes about the return..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
          />
        </div>

        {showDeduction && (
          <div className="space-y-1.5 rounded-lg border border-dashed border-border p-3">
            <div className="flex items-center justify-between">
              <Label>Deduction / Fee (Optional)</Label>
              <span className="text-xs text-muted-foreground">
                e.g. restocking fee, handling charge
              </span>
            </div>
            <Input
              type="number"
              min={0}
              max={grossRefundAmount}
              step="0.01"
              placeholder="0.00"
              value={deduction === 0 ? '' : deduction}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onDeductionChange(isNaN(val) || val < 0 ? 0 : val);
              }}
            />
            {netRefund !== undefined && formatCurrency && (
              <div className="flex items-center justify-between text-sm pt-0.5">
                <span className="text-muted-foreground">Net Refund to Allocate</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(netRefund)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
