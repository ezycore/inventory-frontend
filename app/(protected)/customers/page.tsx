"use client";
// coding-standard: maintained

import { useCallback, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { useFilteredFormConfig } from "@/hooks/use-filters";
import { useUrlParam } from "@/hooks/use-url-param";
import StatsCard from "@/ui/components/StatsCard";
import { formatCurrency } from "@/lib/currency";
import { isFeatureEnabled } from "@/lib/feature-utils";
import { HandCoins, Users, Wallet } from "lucide-react";
import { CUSTOMERS_WITH_DUES_URL } from "@/components/customers/dues-link";
import type { LedgerSheetMode } from "@/components/customers/customer-ledger-sheet";

const CUSTOMER_TABS = ["all", "accounts", "subscribers"] as const;
type CustomerTab = (typeof CUSTOMER_TABS)[number];

export default function CustomersPage() {
  const router = useRouter();
  const t = useTranslations("customers");
  // Drops `defaultDiscountId` when the org has no `sales`. The rule has lived in
  // `useFilteredFormConfig` since it was written — for `customer` and `supplier`
  // both — but neither page called the hook, so it was dead code and a T3
  // storefront-only merchant was offered a Default Discount pointing at
  // `/discounts`, a screen its own nav gate blocks (QA-N15).
  const filteredFormConfig = useFilteredFormConfig(
    getCustomerFormConfig(t),
    "customer",
  );
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const isOnline = !!user?.organization?.features?.storefront;

  // Sorted by the SERVER, so a column sorts every customer, not just the page on screen — the
  // online columns are not stored fields, and the backend ranks them (`ORDER_STAT_SORTS`).
  // "Returned" first: the buyer a cash-on-delivery seller checks before confirming.
  const customerSorting = {
    sortOptions: [
      { field: "name", label: t("columns.name") },
      { field: "createdAt", label: t("columns.createdDate") },
      ...(isOnline
        ? [
            { field: "returnedOrders", label: t("columns.returnedOrders") },
            { field: "onlineOrders", label: t("columns.onlineOrders") },
            { field: "onlineSpent", label: t("columns.onlineSpent") },
            { field: "lastOrderAt", label: t("columns.lastOrder") },
          ]
        : []),
    ],
  };

  // The storefront lists are a different collection, not a different filter, so
  // they need both the feature AND the permission — a staff member without
  // storefront access must not get a tab that 403s on click.
  const showStorefrontTabs =
    isFeatureEnabled(user?.organization?.features, "storefront") &&
    (user?.permissions?.includes("storefront.view") ?? false);

  // The tab lives in the URL: `/customers/online` redirects here with
  // ?tab=accounts, and Back from a customer opened on a tab returns to it.
  const [tab, setTab] = useUrlParam<CustomerTab>("tab", CUSTOMER_TABS, "all");
  // Same clamp as Products: PageTabs hides itself at one tab, so a merchant on
  // an Online tab when the storefront is switched off would be stranded there
  // with no strip to click back through.
  const activeTab: CustomerTab = showStorefrontTabs ? tab : "all";
  const sellsAtCounter = user?.organization?.features?.sales !== false;
  // The ledger is a counter + dues story. With neither — an online-only shop — it showed bare
  // invoice numbers and amounts, a worse copy of the Online Orders list the phone now opens.
  const showLedger = isAccountsEnabled || sellsAtCounter;
  const [ledgerSheetOpen, setLedgerSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerMode, setLedgerMode] = useState<LedgerSheetMode>("ledger");
  // Bumped per open: the sheet remounts, so it starts in `ledgerMode` with a fresh form.
  const [ledgerSession, setLedgerSession] = useState(0);
  // Same gate as the route behind it (`POST /sales/customers/:id/payments`).
  const canReceivePayment =
    isAccountsEnabled && (user?.permissions?.includes("sales.edit") ?? false);

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
        href: CUSTOMERS_WITH_DUES_URL,
      },
      {
        label: t("page.totals.debtors"),
        value: String(totals?.debtorCount ?? 0),
        icon: Users,
        variant: "primary" as const,
        description: t("page.totals.debtorsHint"),
        href: CUSTOMERS_WITH_DUES_URL,
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

  const openLedger = useCallback((row: Customer, mode: LedgerSheetMode) => {
    setSelectedCustomer(row);
    setLedgerMode(mode);
    setLedgerSession((n) => n + 1);
    setLedgerSheetOpen(true);
  }, []);

  const customActions: CustomAction[] = useMemo(() => showLedger ? [
    {
      type: "ledger",
      placement: "cell",
      icon: <FileText className="h-4 w-4" />,
      tooltip: t("page.viewLedgerTooltip"),
      onClick: (row: Customer) => openLedger(row, "ledger"),
    },
  ] : [], [showLedger, openLedger, t]);

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
        sortingConfig={customerSorting}
        columns={getCustomerColumns(t, {
          tracksMoney: isAccountsEnabled,
          online: isOnline,
          counter: sellsAtCounter,
          phoneOpensOrders: user?.permissions?.includes("storefront.orders.view") ?? false,
          // Receive sits in the Due cell and opens the ledger straight on the payment form.
          onReceivePayment: canReceivePayment
            ? (row) => openLedger(row, "bulk")
            : undefined,
        })}
        selectable={true}
        enableSorting={true}
        defaultColumnVisibility={{ email: false }}
        enableRowHover={true}
        rowClassName={(row: Customer) =>
          row.status === "inactive" ? "bg-red-50 opacity-70 dark:bg-red-950/40" : ""
        }
        customActions={customActions}
        operations={{
          formConfig: filteredFormConfig,
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
        key={ledgerSession}
        initialMode={ledgerMode}
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
