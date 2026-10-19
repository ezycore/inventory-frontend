"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
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
  const t = useTranslations("ecommerce.refundDestination");
  return (
    <div className="space-y-2">
      <Label>{t("title")}</Label>
      <RadioGroup
        value={mode}
        onValueChange={(v) => onModeChange(v as RefundMode)}
        className="gap-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="account" id={`${idPrefix}-account`} />
          <Label htmlFor={`${idPrefix}-account`} className="font-normal">
            {t("account")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="credit" id={`${idPrefix}-credit`} />
          <Label htmlFor={`${idPrefix}-credit`} className="font-normal">
            {t("credit")}
          </Label>
        </div>
      </RadioGroup>
      {mode === "account" && accountOptions.length > 0 && (
        <SimpleSelect
          value={accountId}
          onValueChange={onAccountChange}
          options={accountOptions}
          placeholder={t("accountPlaceholder")}
        />
      )}
    </div>
  );
}
