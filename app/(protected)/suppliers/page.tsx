"use client";
// coding-standard: maintained

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { Supplier } from "@/types";
import type { CustomAction } from "@/types/DataTable";

import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";

import {
  SupplierLedgerSheet,
  getSupplierColumns,
  getSupplierFilterConfig,
  supplierDefaultValues,
  getSupplierFormConfig,
} from "@/components/suppliers";
import {
  suppliersApi,
  useCreateSupplier,
  useDeleteSupplier,
  useUpdateSupplier,
} from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { useAuthStore } from "@/services/stores/use-auth-store";

export default function SuppliersPage() {
  const t = useTranslations("suppliers");
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // State for ledger sheet
  const [ledgerSheetOpen, setLedgerSheetOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  // Handle view ledger action
  const handleViewLedger = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setLedgerSheetOpen(true);
  };

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
    [t],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
      />

      <DataTable
        cardTitle={(dataLength: number) => t("page.cardTitle", { count: dataLength })}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={getSupplierFilterConfig(t)}
        columns={getSupplierColumns(t)}
        selectable={true}
        enableSorting={true}
        defaultColumnVisibility={{ email: false, phone: false }}
        enableRowHover={true}
        rowClassName={(row: Supplier) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        customActions={customActions}
        operations={{
          formConfig: getSupplierFormConfig(t),
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
