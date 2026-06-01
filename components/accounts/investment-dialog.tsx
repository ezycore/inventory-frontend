"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Account, CreateIncomeDto } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import DynamicForm from "@/ui/components/form";
import { useCreateIncome } from "@/services/api";

const investmentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  reference: z.string().optional(),
  description: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

const investmentFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "amount",
      type: "number",
      label: "Investment Amount",
      placeholder: "Enter amount",
      required: true,
      columnSpan: 12,
    },
    {
      name: "reference",
      type: "input",
      label: "Reference (Optional)",
      placeholder: "Cheque / transfer reference",
      columnSpan: 12,
    },
    {
      name: "description",
      type: "textarea",
      label: "Note (Optional)",
      placeholder: "e.g. Owner capital injection",
      columnSpan: 12,
    },
  ],
};

interface InvestmentDialogProps {
  /** The account to inject capital into. When null, the dialog is closed. */
  account: Account | null;
  onClose: () => void;
}

export default function InvestmentDialog({
  account,
  onClose,
}: InvestmentDialogProps) {
  const createIncome = useCreateIncome();

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
          <DialogTitle>Add Investment</DialogTitle>
          <DialogDescription>
            Record a capital injection into{" "}
            <span className="font-medium text-foreground">
              {account?.name}
            </span>
            . This increases the account balance and is logged as an investment
            transaction.
          </DialogDescription>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={investmentFormConfig}
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
          submitLabel="Add Investment"
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}
