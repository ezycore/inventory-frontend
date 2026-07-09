// coding-standard: maintained
import { z } from "zod";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// Form Schemas
export const incomeSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

export const expenseSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Select source account"),
  toAccountId: z.string().min(1, "Select destination account"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type TransferFormData = z.infer<typeof transferSchema>;

const categories = [
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "refund", label: "Refund" },
  { value: "adjustment", label: "Adjustment" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

// Dynamic form configs
export const incomeFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "accountId",
      type: "select",
      label: "Account",
      placeholder: "Select account",
      required: true,
      columnSpan: 12,
      optionsApi: "/accounts",
    },
    {
      name: "amount",
      type: "number",
      label: "Amount",
      placeholder: "Enter amount",
      required: true,
      columnSpan: 6,
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      placeholder: "Select category",
      required: true,
      columnSpan: 6,
      options: categories,
    },
    {
      name: "reference",
      type: "input",
      label: "Reference (Optional)",
      placeholder: "Invoice/receipt number",
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description (Optional)",
      placeholder: "Add a note...",
      columnSpan: 12,
    },
  ],
};

export const expenseFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "accountId",
      type: "select",
      label: "Account",
      placeholder: "Select account",
      required: true,
      columnSpan: 12,
      optionsApi: "/accounts",
    },
    {
      name: "amount",
      type: "number",
      label: "Amount",
      placeholder: "Enter amount",
      required: true,
      columnSpan: 6,
    },
    {
      name: "category",
      type: "select",
      label: "Category",
      placeholder: "Select category",
      required: true,
      columnSpan: 6,
      options: categories,
    },
    {
      name: "reference",
      type: "input",
      label: "Reference (Optional)",
      placeholder: "Invoice/receipt number",
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description (Optional)",
      placeholder: "Add a note...",
      columnSpan: 12,
    },
  ],
};

export const transferFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "fromAccountId",
      type: "select",
      label: "From Account",
      placeholder: "Select source account",
      required: true,
      columnSpan: 6,
      optionsApi: "/accounts",
    },
    {
      name: "toAccountId",
      type: "select",
      label: "To Account",
      placeholder: "Select destination account",
      required: true,
      columnSpan: 6,
      optionsApi: "/accounts",
    },
    {
      name: "amount",
      type: "number",
      label: "Amount",
      placeholder: "Enter amount",
      required: true,
      columnSpan: 6,
    },
    {
      name: "reference",
      type: "input",
      label: "Reference (Optional)",
      placeholder: "Transfer reference",
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: "Description (Optional)",
      placeholder: "Add a note...",
      columnSpan: 12,
    },
  ],
};
