"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  usePurchaseHistoryPage,
  SummaryCards,
  PaymentsDrawer,
} from "@/components/purchases/history";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { BaseDataTable } from "@/ui/components/dataTable/base-data-table ";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { isFeatureEnabled } from "@/lib/feature-utils";

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const t = useTranslations("purchases");
  const ctx = usePurchaseHistoryPage();
  // History stays READABLE when purchasing is switched off — that is what
  // `readOnly` on the nav item means, and why a year of purchase records does
  // not vanish with the capability. It does not mean the screen never creates.
  //
  // What the flag never covered is this button, which pushes to `/purchases` —
  // a route the guard blocks once the capability is off. So an offer to start
  // something the merchant cannot start, on the one purchasing screen they can
  // still reach (QA-L6).
  const canCreatePurchase = isFeatureEnabled(
    useAuthStore((s) => s.user?.organization?.features),
    "purchases",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("history.title")}</h1>
          <p className="text-muted-foreground">
            {t("history.subtitle")}
          </p>
        </div>
        {canCreatePurchase && (
          <Button onClick={() => router.push("/purchases")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("orders.newPurchase")}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <SummaryCards
        isAccountsEnabled={ctx.isAccountsEnabled}
        isSummaryLoading={ctx.isSummaryLoading}
        summary={ctx.summary}
        formatCurrency={ctx.formatCurrency}
      />

      {/* Data Table */}
      <Card className="p-0">
        <CardContent className="p-6">
          <BaseDataTable
            title={t("history.tableTitle")}
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
      <ctx.DeleteDraftConfirmDialog />

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
        paymentNotes={ctx.paymentNotes}
        setPaymentNotes={ctx.setPaymentNotes}
        isSubmittingPayment={ctx.isSubmittingPayment}
        onMakePayment={ctx.handleMakePayment}
        onSubmitPayment={ctx.handlePaymentSubmit}
        drawerRef={ctx.drawerRef}
        purchaseReturns={ctx.purchaseReturns}
        isLoadingReturns={ctx.isLoadingReturns}
        transactions={ctx.transactions}
        isLoadingTransactions={ctx.isLoadingTransactions}
        useSupplierCredit={ctx.useSupplierCredit}
        setUseSupplierCredit={ctx.setUseSupplierCredit}
      />
    </div>
  );
}
