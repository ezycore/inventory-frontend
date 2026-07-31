// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { z } from "zod";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";
import {
  EQUITY_CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/constants/transactions";

/**
 * Per-form zod messages (zod v4 ships no bn locale — docs/I18N.md). Callers pass
 * a `transactions.dialogs.validation`-bound translator; the default keeps
 * English for module-level use before a translator exists.
 */
export const makeIncomeSchema = (msg?: {
  selectAccount: string;
  amountPositive: string;
  selectCategory: string;
}) =>
  z.object({
    accountId: z.string().min(1, msg?.selectAccount ?? "Select an account"),
    amount: z.number().positive(msg?.amountPositive ?? "Amount must be positive"),
    category: z.string().min(1, msg?.selectCategory ?? "Select a category"),
    description: z.string().optional(),
    reference: z.string().optional(),
  });

export const makeExpenseSchema = makeIncomeSchema;

export const makeTransferSchema = (msg?: {
  selectSourceAccount: string;
  selectDestinationAccount: string;
  amountPositive: string;
}) =>
  z.object({
    fromAccountId: z.string().min(1, msg?.selectSourceAccount ?? "Select source account"),
    toAccountId: z.string().min(1, msg?.selectDestinationAccount ?? "Select destination account"),
    amount: z.number().positive(msg?.amountPositive ?? "Amount must be positive"),
    description: z.string().optional(),
    reference: z.string().optional(),
  });

export type IncomeFormData = z.infer<ReturnType<typeof makeIncomeSchema>>;
export type ExpenseFormData = z.infer<ReturnType<typeof makeExpenseSchema>>;
export type TransferFormData = z.infer<ReturnType<typeof makeTransferSchema>>;

/** `tCategories` is bound to `transactions.categories`. */
const getCategories = (
  tCategories: Translator,
  keys: readonly string[],
) => keys.map((value) => ({ value, label: tCategories(value) }));

/**
 * `t` is bound to `transactions.dialogs`, `tCategories` to `transactions.categories`.
 *
 * Income and expense share every field except the category list, so the shape is built once and
 * the direction only picks the keys.
 */
const buildMoneyFormConfig = (
  t: Translator,
  tCategories: Translator,
  categoryKeys: readonly string[],
): DynamicFormConfig => ({
  fields: [
    {
      name: "accountId",
      type: "select",
      label: t("account"),
      placeholder: t("accountPlaceholder"),
      required: true,
      columnSpan: 12,
      optionsApi: selectOptions("accounts"),
    },
    {
      name: "amount",
      type: "number",
      precision: 2,
      label: t("amount"),
      placeholder: t("amountPlaceholder"),
      required: true,
      columnSpan: 6,
    },
    {
      name: "category",
      type: "select",
      label: t("category"),
      placeholder: t("categoryPlaceholder"),
      required: true,
      columnSpan: 6,
      options: getCategories(tCategories, categoryKeys),
    },
    {
      name: "reference",
      type: "input",
      label: t("reference"),
      placeholder: t("referencePlaceholder"),
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: t("description"),
      placeholder: t("descriptionPlaceholder"),
      columnSpan: 12,
    },
  ],
});

/**
 * Owner capital rides the same two endpoints as everything else, but posting it needs
 * `transactions.capital` — so offering it to a user without that permission only produces a 403
 * after they have filled the form. `canPostCapital` drops it from the list instead.
 */
const visibleCategories = (
  keys: readonly string[],
  canPostCapital: boolean,
): readonly string[] =>
  canPostCapital ? keys : keys.filter((k) => !EQUITY_CATEGORIES.includes(k as never));

export const getIncomeFormConfig = (
  t: Translator,
  tCategories: Translator,
  canPostCapital = true,
) =>
  buildMoneyFormConfig(
    t,
    tCategories,
    visibleCategories(INCOME_CATEGORIES, canPostCapital),
  );

export const getExpenseFormConfig = (
  t: Translator,
  tCategories: Translator,
  canPostCapital = true,
) =>
  buildMoneyFormConfig(
    t,
    tCategories,
    visibleCategories(EXPENSE_CATEGORIES, canPostCapital),
  );

export const getTransferFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "fromAccountId",
      type: "select",
      label: t("fromAccount"),
      placeholder: t("fromAccountPlaceholder"),
      required: true,
      columnSpan: 6,
      optionsApi: selectOptions("accounts"),
    },
    {
      name: "toAccountId",
      type: "select",
      label: t("toAccount"),
      placeholder: t("toAccountPlaceholder"),
      required: true,
      columnSpan: 6,
      optionsApi: selectOptions("accounts"),
    },
    {
      name: "amount",
      type: "number",
      precision: 2,
      label: t("amount"),
      placeholder: t("amountPlaceholder"),
      required: true,
      columnSpan: 6,
    },
    {
      name: "reference",
      type: "input",
      label: t("reference"),
      placeholder: t("transferReferencePlaceholder"),
      columnSpan: 6,
    },
    {
      name: "description",
      type: "textarea",
      label: t("description"),
      placeholder: t("descriptionPlaceholder"),
      columnSpan: 12,
    },
  ],
});
