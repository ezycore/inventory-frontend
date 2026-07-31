"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import DynamicForm from "@/ui/components/form";
import {
  ArrowDownCircle,
  ArrowRightLeft,
  ArrowUpCircle,
} from "lucide-react";
import {
  useCreateExpense,
  useCreateIncome,
  useCreateTransfer,
} from "@/services/api";
import { useAuthStore } from "@/services/stores";
import {
  getExpenseFormConfig,
  makeExpenseSchema,
  getIncomeFormConfig,
  makeIncomeSchema,
  getTransferFormConfig,
  makeTransferSchema,
  type ExpenseFormData,
  type IncomeFormData,
  type TransferFormData,
} from "./form-configs";

/**
 * Whether this user may post owner capital.
 *
 * Mirrors the backend's `requireCapitalPermission` gate: `capital_in` / `capital_out` ride the
 * ordinary income and expense endpoints, so the extra authority cannot be read off the route.
 */
export function useCanPostCapital(): boolean {
  const { user } = useAuthStore();
  return user?.permissions?.includes("transactions.capital") ?? false;
}

export function IncomeDialog() {
  const t = useTranslations("accounts.transactions.dialogs");
  const tCategories = useTranslations("accounts.transactions.categories");
  const [open, setOpen] = useState(false);
  const canPostCapital = useCanPostCapital();
  const createIncome = useCreateIncome();
  const incomeSchema = useMemo(
    () =>
      makeIncomeSchema({
        selectAccount: t("validation.selectAccount"),
        amountPositive: t("validation.amountPositive"),
        selectCategory: t("validation.selectCategory"),
      }),
    [t],
  );

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      accountId: "",
      amount: 0,
      // Empty, not a pre-picked category. It used to default to `"sale"` — a settlement category
      // the API rejects and this form never offered — so submitting without touching the select
      // 400'd on a value the user never chose.
      category: "",
      description: "",
      reference: "",
    },
  });

  const handleSuccess = () => {
    form.reset();
    setOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          {t("addIncome")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("recordIncomeTitle")}</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={getIncomeFormConfig(t, tCategories, canPostCapital)}
          mutationHook={createIncome}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel={t("recordIncomeSubmit")}
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}

export function ExpenseDialog() {
  const t = useTranslations("accounts.transactions.dialogs");
  const tCategories = useTranslations("accounts.transactions.categories");
  const [open, setOpen] = useState(false);
  const canPostCapital = useCanPostCapital();
  const createExpense = useCreateExpense();
  const expenseSchema = useMemo(
    () =>
      makeExpenseSchema({
        selectAccount: t("validation.selectAccount"),
        amountPositive: t("validation.amountPositive"),
        selectCategory: t("validation.selectCategory"),
      }),
    [t],
  );

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountId: "",
      amount: 0,
      // See IncomeDialog — `"purchase"` was the same unpostable default on this side.
      category: "",
      description: "",
      reference: "",
    },
  });

  const handleSuccess = () => {
    form.reset();
    setOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <ArrowDownCircle className="mr-2 h-4 w-4" />
          {t("addExpense")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("recordExpenseTitle")}</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={getExpenseFormConfig(t, tCategories, canPostCapital)}
          mutationHook={createExpense}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel={t("recordExpenseSubmit")}
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}

export function TransferDialog() {
  const t = useTranslations("accounts.transactions.dialogs");
  const [open, setOpen] = useState(false);
  const createTransfer = useCreateTransfer();
  const transferSchema = useMemo(
    () =>
      makeTransferSchema({
        selectSourceAccount: t("validation.selectSourceAccount"),
        selectDestinationAccount: t("validation.selectDestinationAccount"),
        amountPositive: t("validation.amountPositive"),
      }),
    [t],
  );

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      description: "",
      reference: "",
    },
  });

  const handleSuccess = () => {
    form.reset();
    setOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          {t("transfer")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("transferTitle")}</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={getTransferFormConfig(t)}
          mutationHook={createTransfer}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel={t("transferSubmit")}
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}
