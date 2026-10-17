"use client";
// coding-standard: maintained

import { FileText, HandCoins, Truck, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import type { Supplier } from "@/types";
import type { CustomAction } from "@/types/DataTable";

import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import StatsCard from "@/ui/components/StatsCard";
import { useFilteredFormConfig } from "@/hooks/use-filters";

import {
  SupplierLedgerSheet,
  getSupplierColumns,
  getSupplierFilterConfig,
  supplierDefaultValues,
  getSupplierFormConfig,
} from "@/components/suppliers";
import { SUPPLIERS_OWED_URL } from "@/components/suppliers/dues-link";
import {
  suppliersApi,
  useCreateSupplier,
  useDeleteSupplier,
  useSupplierTotals,
  useUpdateSupplier,
} from "@/services/api";
import { formatCurrency } from "@/lib/currency";
import { queryKeys } from "@/services/api/query-keys";
import { useAuthStore } from "@/services/stores/use-auth-store";

export default function SuppliersPage() {
  const t = useTranslations("suppliers");
  // The purchases-side mirror of the customer gate — same dead rule, same fix.
  // Not reported, because the QA pass ran on a tier where the Suppliers page is
  // itself hidden; a Growth workspace with `purchases` off reaches it.
  const filteredFormConfig = useFilteredFormConfig(
    getSupplierFormConfig(t),
    "supplier",
  );
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // Same gate as the route behind it (`POST /purchases/orders/:id/payment`).
  const canPay =
    isAccountsEnabled && (user?.permissions?.includes("purchases.edit") ?? false);

  // State for ledger sheet
  const [ledgerSheetOpen, setLedgerSheetOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  // Handle view ledger action. Pay opens the same sheet: a supplier is paid per purchase
  // order, and the ledger is where each open order carries its own Pay button.
  const handleViewLedger = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setLedgerSheetOpen(true);
  }, []);

  /**
   * What the shop owes, above the table — the supplier twin of the customers' header. The
   * dashboard's Payable figure had nowhere to lead: the list had no Due column and no total.
   * Payable and the supplier count link to the list filtered to who is owed, biggest first.
   */
  const { data: totals, isLoading: totalsLoading } = useSupplierTotals();
  const currency = user?.organization?.currency;
  const totalCards = useMemo(
    () => [
      {
        label: t("page.totals.payable"),
        value: formatCurrency(totals?.payable ?? 0, currency),
        icon: HandCoins,
        variant: "danger" as const,
        description: t("page.totals.payableHint"),
        href: SUPPLIERS_OWED_URL,
      },
      {
        label: t("page.totals.creditors"),
        value: String(totals?.creditorCount ?? 0),
        icon: Truck,
        variant: "primary" as const,
        description: t("page.totals.creditorsHint"),
        href: SUPPLIERS_OWED_URL,
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

  // Custom actions for each row
  const customActions: CustomAction[] = useMemo(
    () => [
      {
        type: "ledger",
        placement: "cell",
        icon: <FileText className="h-4 w-4" />,
        tooltip: t("page.viewLedgerTooltip"),
        onClick: (row: Supplier) => handleViewLedger(row),
      },
    ],
    [t, handleViewLedger],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
      />

      {/* Accounts-only: with the feature off nothing owed is tracked (business-modes R1). */}
      {isAccountsEnabled && (
        <StatsCard data={totalCards} isLoading={totalsLoading} />
      )}

      <DataTable
        cardTitle={(dataLength: number) => t("page.cardTitle", { count: dataLength })}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={getSupplierFilterConfig(t)}
        columns={getSupplierColumns(t, {
          tracksMoney: isAccountsEnabled,
          onPay: canPay ? handleViewLedger : undefined,
        })}
        selectable={true}
        enableSorting={true}
        defaultColumnVisibility={{ email: false, phone: false }}
        enableRowHover={true}
        rowClassName={(row: Supplier) =>
          row.status === "inactive" ? "bg-red-50 opacity-70 dark:bg-red-950/40" : ""
        }
        customActions={customActions}
        operations={{
          formConfig: filteredFormConfig,
          defaultValues: supplierDefaultValues,
          getAllData: suppliersApi.getAll,
          createMutation: useCreateSupplier(),
          updateMutation: useUpdateSupplier(),
          deleteMutation: useDeleteSupplier(),
          queryKey: queryKeys.suppliers.all(),
          entityName: t("page.entity"),
          isViewAvailable: false,
          editTooltip: t("page.editTooltip"),
          deleteTooltip: t("page.deleteTooltip"),
          viewTooltip: t("page.viewTooltip"),
          prepareSubmitData: (
            data: Supplier,
            isEdit: boolean,
            item: Supplier,
          ) => ({
            ...data,
            ...(isEdit && item ? { id: item._id } : {}),
          }),
        }}
      />

      {/* Supplier Ledger Sheet */}
      <SupplierLedgerSheet
        open={ledgerSheetOpen}
        onOpenChange={setLedgerSheetOpen}
        supplier={selectedSupplier}
        isAccountsEnabled={isAccountsEnabled}
      />
    </div>
  );
}
