"use client";

import { useState, useMemo } from "react";
import { FileText } from "lucide-react";

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
  customerColumns,
  customerFilterConfig,
  searchConfig,
  customerFormConfig,
  defaultValues,
} from "@/components/customers";

export default function CustomersPage() {
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  const [ledgerSheetOpen, setLedgerSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const customActions: CustomAction[] = useMemo(() => [
    {
      type: "ledger",
      placement: "cell",
      icon: <FileText className="h-4 w-4" />,
      tooltip: "View Ledger",
      onClick: (row: Customer) => {
        setSelectedCustomer(row);
        setLedgerSheetOpen(true);
      },
    },
  ], []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title="Customers" subTitle="Manage your customers (sales)" />

      <DataTable
        cardTitle={(dataLength: number) => `All Customers (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={customerFilterConfig}
        columns={customerColumns}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ email: false, phone: false }}
        enableRowHover={true}
        rowClassName={(row: Customer) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        customActions={customActions}
        operations={{
          formConfig: customerFormConfig,
          defaultValues: defaultValues,
          getAllData: customersApi.getAll,
          createMutation: useCreateCustomer(),
          updateMutation: useUpdateCustomer(),
          deleteMutation: useDeleteCustomer(),
          queryKey: [...queryKeys.customers.all()],
          entityName: "Customer",
          isViewAvailable: true,
          editTooltip: "Edit Customer",
          deleteTooltip: "Delete Customer",
          viewTooltip: "View Customer Details",
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
      />
    </div>
  );
}
