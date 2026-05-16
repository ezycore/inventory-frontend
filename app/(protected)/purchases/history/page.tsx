"use client";

import {
  usePurchaseHistoryPage,
  SummaryCards,
  PaymentsDrawer,
} from "@/components/purchases/history";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { BaseDataTable } from "@/ui/components/dataTable/base-data-table ";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const ctx = usePurchaseHistoryPage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase History</h1>
          <p className="text-muted-foreground">
            View and manage your purchases
          </p>
        </div>
        <Button onClick={() => router.push("/purchases")}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </Button>
      </div>

      {/* Summary Stats */}
      <SummaryCards
        isAccountsEnabled={ctx.isAccountsEnabled}
        isSummaryLoading={ctx.isSummaryLoading}
        summary={ctx.summary}
        formatCurrency={ctx.formatCurrency}
      />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            {ctx.paginationInfo
              ? `${ctx.paginationInfo.total} order(s) found`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BaseDataTable
            columns={ctx.columns}
            data={ctx.purchases}
            isLoading={ctx.isLoading}
            filterConfig={ctx.filterConfig}
            customActions={ctx.customActions}
            pagination={{
              pageIndex: ctx.page - 1,
              pageSize: ctx.limit,
              totalPages: ctx.paginationInfo?.totalPages ?? 1,
              totalItems: ctx.paginationInfo?.total ?? 0,
              hasNext: ctx.paginationInfo?.hasNext ?? false,
              hasPrev: ctx.paginationInfo?.hasPrev ?? false,
              manualPagination: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPaginationChange: ({ pageIndex, pageSize }) => {
                ctx.setPage(pageIndex + 1);
                if (pageSize !== ctx.limit) ctx.setLimit(pageSize);
              },
            }}
            enableSorting
          />
        </CardContent>
      </Card>

      {/* Purchase Summary & Payment Drawer */}
      <PaymentsDrawer
        open={ctx.drawerOpen}
        onOpenChange={ctx.setDrawerOpen}
        selectedOrder={ctx.selectedOrder}
        payments={ctx.payments}
        isLoadingPayments={ctx.isLoadingPayments}
        isAccountsEnabled={ctx.isAccountsEnabled}
        formatCurrency={ctx.formatCurrency}
        mode={ctx.drawerMode}
        accounts={ctx.accounts}
        paymentAmount={ctx.paymentAmount}
        setPaymentAmount={ctx.setPaymentAmount}
        paymentAccountId={ctx.paymentAccountId}
        setPaymentAccountId={ctx.setPaymentAccountId}
        paymentMethod={ctx.paymentMethod}
        setPaymentMethod={ctx.setPaymentMethod}
        paymentNotes={ctx.paymentNotes}
        setPaymentNotes={ctx.setPaymentNotes}
        isSubmittingPayment={ctx.isSubmittingPayment}
        onMakePayment={ctx.handleMakePayment}
        onSubmitPayment={ctx.handlePaymentSubmit}
        drawerRef={ctx.drawerRef}
        purchaseReturns={ctx.purchaseReturns}
        isLoadingReturns={ctx.isLoadingReturns}
      />
    </div>
  );
}
