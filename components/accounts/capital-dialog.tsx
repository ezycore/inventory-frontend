"use client";
// coding-standard: maintained

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Account, CreateExpenseDto, CreateIncomeDto } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import DynamicForm from "@/ui/components/form";
import { useCreateExpense, useCreateIncome } from "@/services/api";
import { useCurrency } from "@/lib/currency";

/** Which way the owner's money is moving. */
export type CapitalDirection = "in" | "out";

const makeCapitalSchema = (
  direction: CapitalDirection,
  available: number,
  msg: { amountPositive: string; insufficient: string },
) =>
  z.object({
    amount: z
      .number()
      .positive(msg.amountPositive)
      // A withdrawal cannot overdraw the wallet — the API enforces this too
      // (`INSUFFICIENT_BALANCE`); catching it here avoids a round-trip.
      .refine(
        (value) => direction === "in" || value <= available,
        msg.insufficient,
      ),
    reference: z.string().optional(),
    description: z.string().optional(),
  });

type CapitalFormData = z.infer<ReturnType<typeof makeCapitalSchema>>;

const getCapitalFormConfig = (
  t: Translator,
  direction: CapitalDirection,
): DynamicFormConfig => ({
  fields: [
    {
      name: "amount",
      type: "number",
      precision: 2,
      label: direction === "in" ? t("amountLabelIn") : t("amountLabelOut"),
      placeholder: t("amountPlaceholder"),
      required: true,
      columnSpan: 12,
    },
    {
      name: "reference",
      type: "input",
      label: t("referenceLabel"),
      placeholder: t("referencePlaceholder"),
      columnSpan: 12,
    },
    {
      name: "description",
      type: "textarea",
      label: t("noteLabel"),
      placeholder: t("notePlaceholder"),
      columnSpan: 12,
    },
  ],
});

interface CapitalDialogProps {
  /** The account to move owner capital into or out of. When null, the dialog is closed. */
  account: Account | null;
  direction: CapitalDirection;
  onClose: () => void;
}

/**
 * Record an owner capital injection or withdrawal.
 *
 * Both directions post to the ordinary income/expense endpoints, but with the `capital_in` /
 * `capital_out` categories — which the backend classifies as **equity**, so the amount never
 * lands in revenue or in operating expenses. That distinction is the whole reason this dialog
 * exists rather than the user picking a category on the generic transaction form.
 */
export default function CapitalDialog({
  account,
  direction,
  onClose,
}: CapitalDialogProps) {
  const t = useTranslations("accounts.capitalDialog");
  const { format } = useCurrency();
  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();

  const available = account?.balance ?? 0;
  const capitalSchema = useMemo(
    () =>
      makeCapitalSchema(direction, available, {
        amountPositive: t("validation.amountPositive"),
        insufficient: t("insufficient", { balance: format(available) }),
      }),
    [direction, available, t, format],
  );

  const form = useForm<CapitalFormData>({
    resolver: zodResolver(capitalSchema),
    defaultValues: { amount: 0, reference: "", description: "" },
  });

  // Reset whenever a new account or a new direction is targeted.
  useEffect(() => {
    if (account) {
      form.reset({ amount: 0, reference: "", description: "" });
    }
  }, [account, direction, form]);

  const handleSuccess = () => {
    form.reset();
    onClose();
  };

  const isIn = direction === "in";

  return (
    <Dialog open={!!account} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isIn ? t("titleIn") : t("titleOut")}</DialogTitle>
          <DialogDescription>
            {t.rich(isIn ? "descriptionIn" : "descriptionOut", {
              name: account?.name ?? "",
              strong: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={getCapitalFormConfig(t, direction)}
          mutationHook={isIn ? createIncome : createExpense}
          onSubmit={(data: CapitalFormData): CreateIncomeDto | CreateExpenseDto => ({
            accountId: account?._id ?? "",
            amount: data.amount,
            category: isIn ? "capital_in" : "capital_out",
            reference: data.reference || undefined,
            description: data.description || undefined,
          })}
          onSuccess={handleSuccess}
          onCancel={onClose}
          submitLabel={isIn ? t("submitLabelIn") : t("submitLabelOut")}
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}
