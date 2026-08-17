"use client";
// coding-standard: maintained

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import type { Customer } from "@/types";
import type { CustomAction } from "@/types/DataTable";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  useCreateCustomer,
  useCustomerTotals,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/services/api";
import { customersApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import {
  CustomerLedgerSheet,
  getCustomerColumns,
  getCustomerFilterConfig,
  getCustomerFormConfig,
  defaultValues,
} from "@/components/customers";
import { StorefrontListPanel } from "@/components/customers/storefront-list-panel";
import { PageTabs, type PageTab } from "@/ui/components/page-tabs";
import StatsCard from "@/ui/components/StatsCard";
import { formatCurrency } from "@/lib/currency";
import { isFeatureEnabled } from "@/lib/feature-utils";
import { HandCoins, Users, Wallet } from "lucide-react";

type CustomerTab = "all" | "accounts" | "subscribers";

export default function CustomersPage() {
  const router = useRouter();
  const t = useTranslations("customers");
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // The storefront lists are a different collection, not a different filter, so
  // they need both the feature AND the permission — a staff member without
  // storefront access must not get a tab that 403s on click.
  const showStorefrontTabs =
    isFeatureEnabled(user?.organization?.features, "storefront") &&
    (user?.permissions?.includes("storefront.view") ?? false);

  // `/customers/online` redirects here with ?tab=accounts, so the deep link
  // lands on the right tab instead of silently on "All customers".
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<CustomerTab>(
    requestedTab === "accounts" || requestedTab === "subscribers"
      ? requestedTab
      : "all",
  );
  // Same clamp as Products: PageTabs hides itself at one tab, so a merchant on
  // an Online tab when the storefront is switched off would be stranded there
  // with no strip to click back through.
  const activeTab: CustomerTab = showStorefrontTabs ? tab : "all";
  const [ledgerSheetOpen, setLedgerSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const tabs: readonly PageTab<CustomerTab>[] = useMemo(
    () =>
      showStorefrontTabs
        ? ([
            { key: "all", label: t("page.tabs.all") },
            { key: "accounts", label: t("page.tabs.accounts") },
            { key: "subscribers", label: t("page.tabs.subscribers") },
          ] as const)
        : ([{ key: "all", label: t("page.tabs.all") }] as const),
    [showStorefrontTabs, t],
  );

  /**
   * What the shop is owed, above the table.
   *
   * The `Due` column was per-row only — no total anywhere — so a merchant who
   * wanted the one number this screen exists to give them added up a paginated
   * column by hand, while the dashboard stated it exactly one click away
   * (QA-063). Sourced from the same `CustomerDue` rows the column is, so the
   * header can never disagree with the figures under it.
   */
  const { data: totals, isLoading: totalsLoading } = useCustomerTotals();
  const currency = user?.organization?.currency;
  const totalCards = useMemo(
    () => [
      {
        label: t("page.totals.receivable"),
        value: formatCurrency(totals?.receivable ?? 0, currency),
        icon: HandCoins,
        variant: "danger" as const,
        description: t("page.totals.receivableHint"),
      },
      {
        label: t("page.totals.debtors"),
        value: String(totals?.debtorCount ?? 0),
        icon: Users,
        variant: "primary" as const,
        description: t("page.totals.debtorsHint"),
      },
      {
        label: t("page.totals.credit"),
        value: formatCurrency(totals?.creditBalance ?? 0, currency),
        icon: Wallet,
        variant: "success" as const,
        description: t("page.totals.creditHint"),
      },
    ],
    [totals, currency, t],
  );

  const customActions: CustomAction[] = useMemo(() => [
    {
      type: "ledger",
      placement: "cell",
      icon: <FileText className="h-4 w-4" />,
      tooltip: t("page.viewLedgerTooltip"),
      onClick: (row: Customer) => {
        setSelectedCustomer(row);
        setLedgerSheetOpen(true);
      },
    },
  ], [t]);

  // Hoisted out of the JSX: the table now sits in a ternary branch, and an
  // object literal inside an unrendered branch never evaluates — which would
  // make these conditional hook calls.
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
      />

      {/* Explicit type argument: inferring K from `onChange` would widen it to
          `string`, because a setState dispatch also accepts a function updater. */}
      <PageTabs<CustomerTab> tabs={tabs} active={activeTab} onChange={setTab} />

      {/* Accounts-only: with the feature off there are no dues to total. */}
      {activeTab === "all" && isAccountsEnabled && (
        <StatsCard data={totalCards} isLoading={totalsLoading} />
      )}

      {activeTab !== "all" ? (
        // Remount per kind so the search box and page cursor reset — page 3 of
        // the accounts list means nothing in a subscriber list of 12. React
        // Query still serves the second visit from cache, so no spinner.
        <StorefrontListPanel key={activeTab} kind={activeTab} />
      ) : (
      <DataTable
        cardTitle={(dataLength: number) => t("page.cardTitle", { count: dataLength })}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={getCustomerFilterConfig(t)}
        columns={getCustomerColumns(t)}
        selectable={true}
        enableSorting={true}
        defaultColumnVisibility={{ email: false, phone: false }}
        enableRowHover={true}
        rowClassName={(row: Customer) =>
          row.status === "inactive" ? "bg-red-50 opacity-70 dark:bg-red-950/40" : ""
        }
        customActions={customActions}
        operations={{
          formConfig: getCustomerFormConfig(t),
          defaultValues: defaultValues,
          getAllData: customersApi.getAll,
          createMutation: createCustomer,
          updateMutation: updateCustomer,
          deleteMutation: deleteCustomer,
          queryKey: queryKeys.customers.all(),
          entityName: t("page.entity"),
          isViewAvailable: false,
          editTooltip: t("page.editTooltip"),
          deleteTooltip: t("page.deleteTooltip"),
          viewTooltip: t("page.viewTooltip"),
          prepareSubmitData: (data: Customer, isEdit: boolean, item: Customer) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />
      )}

      <CustomerLedgerSheet
        open={ledgerSheetOpen}
        onOpenChange={setLedgerSheetOpen}
        customer={selectedCustomer}
        isAccountsEnabled={isAccountsEnabled}
        onOpenSale={(_saleId, invoiceNumber) => {
          if (invoiceNumber) {
            toast.message(t("page.openingInvoiceMessage", { invoice: invoiceNumber }));
          }
          setLedgerSheetOpen(false);
          router.push("/sales/history");
        }}
      />
    </div>
  );
}
