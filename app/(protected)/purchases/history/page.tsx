"use client";

import {
  usePurchaseHistoryPage,
  SummaryCards,
  PaymentsDrawer,
  PaymentDialog,
  DetailDrawer,
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
  const h = usePurchaseHistoryPage();

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
        isAccountsEnabled={h.isAccountsEnabled}
        isSummaryLoading={h.isSummaryLoading}
        summary={h.summary}
        formatCurrency={h.formatCurrency}
      />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            {h.paginationInfo
              ? `${h.paginationInfo.total} order(s) found`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BaseDataTable
            columns={h.columns}
            data={h.purchases}
            isLoading={h.isLoading}
            filterConfig={h.filterConfig}
            actions={{}}
            customActions={h.customActions}
            pagination={{
              pageIndex: h.page - 1,
              pageSize: h.limit,
              totalPages: h.paginationInfo?.totalPages || 1,
              totalItems: h.paginationInfo?.total || 0,
              hasNext: h.paginationInfo?.hasNext || false,
              hasPrev: h.paginationInfo?.hasPrev || false,
              manualPagination: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPaginationChange: ({ pageIndex, pageSize }) => {
                h.setPage(pageIndex + 1);
                if (pageSize !== h.limit) h.setLimit(pageSize);
              },
            }}
            enableSorting
          />
        </CardContent>
      </Card>

      {/* Order Details Drawer */}
      <DetailDrawer
        open={h.detailDrawerOpen}
        onOpenChange={h.setDetailDrawerOpen}
        selectedOrder={h.selectedOrder}
        isAccountsEnabled={h.isAccountsEnabled}
        formatCurrency={h.formatCurrency}
        formatDateTime={h.formatDateTime}
      />

      {/* Payments Drawer */}
      <PaymentsDrawer
        open={h.paymentsDrawerOpen}
        onOpenChange={h.setPaymentsDrawerOpen}
        selectedOrder={h.selectedOrder}
        payments={h.payments}
        isLoadingPayments={h.isLoadingPayments}
        isAccountsEnabled={h.isAccountsEnabled}
        formatCurrency={h.formatCurrency}
        formatDateTime={h.formatDateTime}
        onMakePayment={h.handleMakePayment}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={h.paymentModalOpen}
        onOpenChange={h.setPaymentModalOpen}
        selectedOrder={h.selectedOrder}
        formatCurrency={h.formatCurrency}
        paymentAmount={h.paymentAmount}
        setPaymentAmount={h.setPaymentAmount}
        paymentAccountId={h.paymentAccountId}
        setPaymentAccountId={h.setPaymentAccountId}
        paymentMethod={h.paymentMethod}
        setPaymentMethod={h.setPaymentMethod}
        paymentNotes={h.paymentNotes}
        setPaymentNotes={h.setPaymentNotes}
        accounts={h.accounts}
        isPending={h.addPaymentMutation.isPending}
        onSubmit={h.handlePaymentSubmit}
      />
    </div>
  );
}
