"use client";
// coding-standard: maintained

import { useState, useMemo } from "react";
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
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/services/api";
import { customersApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import {
  CustomerLedgerSheet,
  getCustomerColumns,
  getCustomerFilterConfig,
  getSearchConfig,
  getCustomerFormConfig,
  defaultValues,
} from "@/components/customers";

export default function CustomersPage() {
  const router = useRouter();
  const t = useTranslations("customers");
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  const [ledgerSheetOpen, setLedgerSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
      />

      <DataTable
        cardTitle={(dataLength: number) => t("page.cardTitle", { count: dataLength })}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={getCustomerFilterConfig(t)}
        columns={getCustomerColumns(t)}
        selectable={true}
        searchConfig={getSearchConfig(t)}
        enableSorting={true}
        defaultColumnVisibility={{ email: false, phone: false }}
        enableRowHover={true}
        rowClassName={(row: Customer) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        customActions={customActions}
        operations={{
          formConfig: getCustomerFormConfig(t),
          defaultValues: defaultValues,
          getAllData: customersApi.getAll,
          createMutation: useCreateCustomer(),
          updateMutation: useUpdateCustomer(),
          deleteMutation: useDeleteCustomer(),
          queryKey: [...queryKeys.customers.all()],
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
