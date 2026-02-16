"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";

// Types
import type { Customer } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { CustomAction } from "@/types/DataTable";

// UI Components
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DataTable } from "@/ui/components/dataTable";
import { StatCard } from "@/components/dashboard/stat-card";

// Hooks & API
import {
  useCreateCustomer,
  useDeleteCustomer,
  useUpdateCustomer,
  useCustomersSummary,
} from "@/services/api";
import { customersApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import PageHeader from "@/ui/components/header";
import { FilterConfig } from "@/types/DataTable";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useCurrency } from "@/lib/currency";
import { CustomerLedgerSheet } from "@/components/customers";

// Column definitions
const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Customer Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];

// Form configuration
const customerFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Customer Name",
      placeholder: "Enter customer name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "email",
      type: "input",
      label: "Email",
      placeholder: "Enter email address",
      columnSpan: 6,
    },
    {
      name: "phone",
      type: "input",
      label: "Phone",
      placeholder: "Enter phone number",
      columnSpan: 6,
    },
    {
      name: "address",
      type: "textarea",
      label: "Address",
      placeholder: "Enter address",
      columnSpan: 12,
    },
    {
      name: "defaultDiscountId",
      type: "select",
      label: "Default Discount",
      placeholder: "Select a default discount (optional)",
      columnSpan: 6,
      optionsApi: "/discounts/sales?all=true&status=active",
      description: "Applied automatically to sales for this customer",
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 6,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

// Filter configuration for customers
const customerFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search customer",
      type: "text",
      placeholder: "Search by customer name...",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      placeholder: "Search by email...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 2,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "createdAt",
      label: "Created Date",
      type: "date-range",
      placeholder: "Select date range",
      columnSpan: 2,
    },
    {
      name: "updatedAt",
      label: "Updated Date",
      type: "date",
      placeholder: "Select date",
      columnSpan: 2,
    },
  ],
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search customers by name, email, phone, or status...",
};

const defaultValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  defaultDiscountId: "",
  status: "active" as const,
}

export default function CustomersPage() {
  const { user } = useAuthStore();
  const { format: formatCurrency } = useCurrency();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const isReturnsEnabled = user?.organization?.features?.returns ?? false;

  // State for ledger sheet
  const [ledgerSheetOpen, setLedgerSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers summary
  const { data: summaryData, isLoading: isSummaryLoading } = useCustomersSummary();
  const summary = summaryData?.data;

  // Handle view ledger action
  const handleViewLedger = (customer: Customer) => {
    setSelectedCustomer(customer);
    setLedgerSheetOpen(true);
  };

  // Custom actions for each row
  const customActions: CustomAction[] = useMemo(() => [
    {
      type: "ledger",
      placement: "cell",
      icon: <FileText className="h-4 w-4" />,
      tooltip: "View Ledger",
      onClick: (row: Customer) => handleViewLedger(row),
    },
  ], []);

  // Determine grid columns based on enabled features
  const getGridCols = () => {
    if (isAccountsEnabled && isReturnsEnabled) return "md:grid-cols-4";
    if (isAccountsEnabled || isReturnsEnabled) return "md:grid-cols-3";
    return "md:grid-cols-1 max-w-sm";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Customers" subTitle="Manage your customers (sales)" />

      {/* Summary Stats Cards */}
      <div className={`grid gap-4 ${getGridCols()}`}>
        <StatCard
          title="Total Sales"
          value={isSummaryLoading ? "..." : formatCurrency(summary?.totalSales ?? 0)}
          icon="DollarSign"
          loading={isSummaryLoading}
          subtitle={isSummaryLoading ? undefined : `${summary?.salesCount ?? 0} transactions`}
        />
        {isAccountsEnabled && (
          <>
            <StatCard
              title="Total Paid"
              value={isSummaryLoading ? "..." : formatCurrency(summary?.totalPaid ?? 0)}
              icon="TrendingUp"
              loading={isSummaryLoading}
              valueColor="success"
            />
            <StatCard
              title="Total Due"
              value={isSummaryLoading ? "..." : formatCurrency(summary?.totalDue ?? 0)}
              icon="AlertTriangle"
              loading={isSummaryLoading}
              valueColor={(summary?.totalDue ?? 0) > 0 ? "danger" : "success"}
            />
          </>
        )}
        {isReturnsEnabled && (
          <StatCard
            title="Total Refunds"
            value={isSummaryLoading ? "..." : formatCurrency(summary?.totalRefunds ?? 0)}
            icon="RotateCcw"
            loading={isSummaryLoading}
            subtitle={isSummaryLoading ? undefined : `${summary?.returnsCount ?? 0} returns`}
            valueColor="warning"
          />
        )}
      </div>

      <DataTable
        cardTitle={(dataLength: number) => `All Customers (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[10, 20, 50, 100]}
        filterConfig={customerFilterConfig}
        columns={columns}
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

      {/* Customer Ledger Sheet */}
      <CustomerLedgerSheet
        open={ledgerSheetOpen}
        onOpenChange={setLedgerSheetOpen}
        customer={selectedCustomer}
        isAccountsEnabled={isAccountsEnabled}
      />
    </div>
  );
}
