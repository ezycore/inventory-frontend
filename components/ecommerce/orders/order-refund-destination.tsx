"use client";
// coding-standard: maintained
import { Label } from "@/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@/ui/components/radio-group";
import { SimpleSelect } from "@/ui/components/simple-select";

export type RefundMode = "account" | "credit";

/**
 * Where a return's paid-back money goes: out of an account, or onto the customer's store credit.
 *
 * Shared by "Return whole order" and "Return items". Render it only when the server's return
 * preview says `refundModeRequired` and `accounts` is on — the same test `returnOrder` applies.
 */
export function OrderRefundDestination({
  idPrefix,
  mode,
  onModeChange,
  accountId,
  onAccountChange,
  accountOptions,
}: {
  /** Keeps the radio ids unique when two dialogs are mounted on one page. */
  idPrefix: string;
  mode: RefundMode;
  onModeChange: (mode: RefundMode) => void;
  accountId: string;
  onAccountChange: (accountId: string) => void;
  accountOptions: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label>Refund the paid amount</Label>
      <RadioGroup
        value={mode}
        onValueChange={(v) => onModeChange(v as RefundMode)}
        className="gap-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="account" id={`${idPrefix}-account`} />
          <Label htmlFor={`${idPrefix}-account`} className="font-normal">
            Refund to an account (cash out)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="credit" id={`${idPrefix}-credit`} />
          <Label htmlFor={`${idPrefix}-credit`} className="font-normal">
            Store credit (customer balance)
          </Label>
        </div>
      </RadioGroup>
      {mode === "account" && accountOptions.length > 0 && (
        <SimpleSelect
          value={accountId}
          onValueChange={onAccountChange}
          options={accountOptions}
          placeholder="Refund from account (default)"
        />
      )}
    </div>
  );
}
