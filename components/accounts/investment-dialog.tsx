"use client";
// coding-standard: maintained

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Account, CreateIncomeDto } from "@/types";
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
import { useCreateIncome } from "@/services/api";

const makeInvestmentSchema = (amountPositive?: string) =>
  z.object({
    amount: z.number().positive(amountPositive ?? "Amount must be positive"),
    reference: z.string().optional(),
    description: z.string().optional(),
  });

type InvestmentFormData = z.infer<ReturnType<typeof makeInvestmentSchema>>;

const getInvestmentFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "amount",
      type: "number",
      label: t("amountLabel"),
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

interface InvestmentDialogProps {
  /** The account to inject capital into. When null, the dialog is closed. */
  account: Account | null;
  onClose: () => void;
}

export default function InvestmentDialog({
  account,
  onClose,
}: InvestmentDialogProps) {
  const t = useTranslations("accounts.investmentDialog");
  const createIncome = useCreateIncome();
  const investmentSchema = useMemo(
    () => makeInvestmentSchema(t("validation.amountPositive")),
    [t],
  );

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      amount: 0,
      reference: "",
      description: "",
    },
  });

  // Reset the form whenever a new account is targeted.
  useEffect(() => {
    if (account) {
      form.reset({ amount: 0, reference: "", description: "" });
    }
  }, [account, form]);

  const handleSuccess = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={!!account} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t.rich("description", {
              name: account?.name ?? "",
              strong: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={getInvestmentFormConfig(t)}
          mutationHook={createIncome}
          onSubmit={(data: InvestmentFormData): CreateIncomeDto => ({
            accountId: account?._id ?? "",
            amount: data.amount,
            category: "investment",
            reference: data.reference || undefined,
            description: data.description || undefined,
          })}
          onSuccess={handleSuccess}
          onCancel={onClose}
          submitLabel={t("submitLabel")}
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}
