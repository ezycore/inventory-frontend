"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  OrderDetailsDrawer,
  ReceiveItemsDialog,
} from "@/components/purchases/orders";
import { useCreatedOrdersPage } from "@/components/purchases/orders/use-created-orders-page";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { BaseDataTable } from "@/ui/components/dataTable/base-data-table ";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Skeleton } from "@/ui/components/skeleton";
import { Plus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreatedOrdersPage() {
  const router = useRouter();
  const t = useTranslations("purchases");
  const ctx = useCreatedOrdersPage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("orders.title")}</h1>
          <p className="text-muted-foreground">
            {t("orders.subtitle")}
          </p>
        </div>
        <Button onClick={() => router.push("/purchases")}>
          <Plus className="h-4 w-4 mr-2" />
          {t("orders.newPurchase")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-2">
          <CardHeader className="pb-2">
            <CardDescription>{t("orders.statPending")}</CardDescription>
            <CardTitle className="text-2xl">
              {ctx.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                ctx.orders.filter((o) => o.status === "ordered").length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t("orders.statPendingDesc")}</p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="pb-2">
            <CardDescription>{t("orders.statPartial")}</CardDescription>
            <CardTitle className="text-2xl">
              {ctx.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                ctx.orders.filter((o) => o.status === "partial").length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t("orders.statPartialDesc")}</p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="pb-2">
            <CardDescription>{t("orders.statTotalValue")}</CardDescription>
            <CardTitle className="text-2xl">
              {ctx.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                ctx.formatCurrency(
                  ctx.orders.reduce(
                    (sum, order) => sum + ctx.getOrderDisplayTotal(order),
                    0,
                  ),
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t("orders.statTotalValueDesc")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="p-0">
        <CardContent className="p-6">
          <BaseDataTable
            columns={ctx.columns}
            data={ctx.orders}
            title={t("orders.title")}
            isLoading={ctx.isLoading}
            filterConfig={ctx.filterConfig}
            actions={{}}
            customActions={ctx.customActions}
            pagination={{
              pageIndex: ctx.page - 1,
              pageSize: ctx.limit,
              totalPages: ctx.paginationInfo?.totalPages || 1,
              totalItems: ctx.paginationInfo?.total || 0,
              hasNext: ctx.paginationInfo?.hasNext || false,
              hasPrev: ctx.paginationInfo?.hasPrev || false,
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

      {/* View Order Details Drawer */}
      <OrderDetailsDrawer
        open={ctx.viewDrawerOpen}
        onOpenChange={ctx.setViewDrawerOpen}
        order={ctx.selectedOrder}
        isLoading={ctx.isLoadingDetail}
        formatCurrency={ctx.formatCurrency}
        onReceiveItems={() => {
          // Keep selectedOrderId set, swap dialogs
          ctx.setViewDrawerOpen(false);
          ctx.setReceiveDialogOpen(true);
        }}
        onCancelOrder={() => {
          ctx.setViewDrawerOpen(false);
          ctx.setCancelDialogOpen(true);
        }}
        onEditOrder={(order) => {
          ctx.setViewDrawerOpen(false);
          router.push(`/purchases/orders/${order._id}/edit`);
        }}
      />

      {/* Receive Items + Payment Dialog */}
      <ReceiveItemsDialog
        open={ctx.receiveDialogOpen}
        onOpenChange={(open) => {
          ctx.setReceiveDialogOpen(open);
          if (!open) ctx.setSelectedOrderId(null);
        }}
        order={ctx.selectedOrder}
        formatCurrency={ctx.formatCurrency}
        isPending={ctx.isReceiving}
        onSubmit={ctx.handleReceiveSubmit}
      />

      {/* Cancel Order Dialog */}
      <Dialog open={ctx.cancelDialogOpen} onOpenChange={ctx.setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {t("orders.cancelTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("orders.cancelDescription")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => ctx.setCancelDialogOpen(false)}
              disabled={ctx.isCancelling}
            >
              {t("orders.keepOrder")}
            </Button>
            <Button
              variant="destructive"
              onClick={ctx.handleCancelSubmit}
              disabled={ctx.isCancelling}
            >
              {ctx.isCancelling ? t("orders.cancelling") : t("orders.cancelOrder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
