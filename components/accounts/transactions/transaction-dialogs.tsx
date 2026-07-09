"use client";
// coding-standard: maintained

import { useState } from "react";
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
import {
  expenseFormConfig,
  expenseSchema,
  incomeFormConfig,
  incomeSchema,
  transferFormConfig,
  transferSchema,
  type ExpenseFormData,
  type IncomeFormData,
  type TransferFormData,
} from "./form-configs";

export function IncomeDialog() {
  const [open, setOpen] = useState(false);
  const createIncome = useCreateIncome();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      accountId: "",
      amount: 0,
      category: "sale",
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
          <ArrowDownCircle className="mr-2 h-4 w-4" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Income</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={incomeFormConfig}
          mutationHook={createIncome}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel="Record Income"
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}

export function ExpenseDialog() {
  const [open, setOpen] = useState(false);
  const createExpense = useCreateExpense();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      accountId: "",
      amount: 0,
      category: "purchase",
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
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={expenseFormConfig}
          mutationHook={createExpense}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel="Record Expense"
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}

export function TransferDialog() {
  const [open, setOpen] = useState(false);
  const createTransfer = useCreateTransfer();

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
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Between Accounts</DialogTitle>
        </DialogHeader>
        <DynamicForm
          form={form}
          config={transferFormConfig}
          mutationHook={createTransfer}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          submitLabel="Complete Transfer"
          actionsPlacement="bottom"
        />
      </DialogContent>
    </Dialog>
  );
}
