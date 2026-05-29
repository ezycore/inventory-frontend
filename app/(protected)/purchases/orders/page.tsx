"use client";

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
  const ctx = useCreatedOrdersPage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Created Orders</h1>
          <p className="text-muted-foreground">
            Manage purchase orders awaiting delivery
          </p>
        </div>
        <Button onClick={() => router.push("/purchases")}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Orders</CardDescription>
            <CardTitle className="text-2xl">
              {ctx.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                ctx.orders.filter((o) => o.status === "ordered").length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Partial Received</CardDescription>
            <CardTitle className="text-2xl">
              {ctx.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                ctx.orders.filter((o) => o.status === "partial").length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Partially received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value</CardDescription>
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
            <p className="text-xs text-muted-foreground">Of pending orders</p>
          </CardContent>
        </Card>
      </div>

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
            data={ctx.orders}
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
          router.push(`/purchases/created-orders/${order._id}/edit`);
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
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => ctx.setCancelDialogOpen(false)}
              disabled={ctx.isCancelling}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={ctx.handleCancelSubmit}
              disabled={ctx.isCancelling}
            >
              {ctx.isCancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
