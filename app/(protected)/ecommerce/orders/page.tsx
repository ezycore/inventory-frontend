"use client";

import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import { storefrontOrdersApi, type AdminStorefrontOrder } from "@/services/api";
import { orderColumns, orderFilterConfig } from "@/components/ecommerce/orders";

export default function EcommerceOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Online Orders"
        subTitle="Orders placed through your storefront"
      />

      {/* Read-only: no create/edit/delete mutations in operations, so DataTable
          renders no add button, row actions, or form modal — just the list. */}
      <DataTable<AdminStorefrontOrder>
        cardTitle={(n) => `All Orders (${n})`}
        columns={orderColumns}
        defaultPageSize={20}
        pageSizes={[20, 50, 100]}
        filterConfig={orderFilterConfig}
        enableRowHover
        operations={{
          getAllData: storefrontOrdersApi.getAll,
          queryKey: ["storefront-orders"],
          entityName: "Order",
        }}
      />
    </div>
  );
}
