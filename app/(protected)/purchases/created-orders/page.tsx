"use client";

import {
  buildCreatedOrdersFilterConfig,
  defaultCreatedOrderFilters,
  getCreatedOrderActions,
  getCreatedOrdersColumns,
  OrderDetailsDrawer,
  ReceiveItemsDialog,
} from "@/components/purchases/created-orders";
import { useCurrency } from "@/lib/currency";
import {
  useCancelPurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrders,
  useReceivePurchaseOrder,
} from "@/services/api";
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  ReceivePurchaseOrderDto,
} from "@/types";
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
import { useCallback, useMemo, useState } from "react";

export default function CreatedOrdersPage() {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<PurchaseOrderFilters>(
    defaultCreatedOrderFilters,
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = usePurchaseOrders({ page, limit, ...filters });

  const { data: orderDetailData, isLoading: isLoadingDetail } = usePurchaseOrder(
    selectedOrderId || "",
  );

  const selectedOrder = orderDetailData?.data ?? null;
  const receiveMutation = useReceivePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const orders: PurchaseOrder[] = ordersData?.data?.items || [];

  const getOrderDisplayTotal = useCallback(
    (order: PurchaseOrder) =>
      order.invoiceAmount ||
      order.grandTotal ||
      order.totalAmount ||
      order.subtotal ||
      0,
    [],
  );

  const paginationInfo = useMemo(() => {
    if (!ordersData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = ordersData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [ordersData]);

  const handleViewOrder = useCallback((order: PurchaseOrder) => {
    setSelectedOrderId(order._id);
    setViewDrawerOpen(true);
  }, []);

  const handleEditOrder = useCallback(
    (order: PurchaseOrder) => {
      router.push(`/purchases/created-orders/${order._id}/edit`);
    },
    [router],
  );

  const handleReceiveSubmit = useCallback(
    async (id: string, data: ReceivePurchaseOrderDto) => {
      try {
        await receiveMutation.mutateAsync({ id, data });
        setReceiveDialogOpen(false);
        setSelectedOrderId(null);
        refetch();
      } catch {
        // toast handled by mutation
      }
    },
    [receiveMutation, refetch],
  );

  const handleCancelSubmit = useCallback(async () => {
    if (!selectedOrderId) return;
    try {
      await cancelMutation.mutateAsync(selectedOrderId);
      setCancelDialogOpen(false);
      setSelectedOrderId(null);
      refetch();
    } catch {
      // toast handled by mutation
    }
  }, [selectedOrderId, cancelMutation, refetch]);

  const columns = useMemo(
    () => getCreatedOrdersColumns({ formatCurrency }),
    [formatCurrency],
  );

  const customActions = useMemo(
    () =>
      getCreatedOrderActions({
        onViewOrder: handleViewOrder,
        onEditOrder: handleEditOrder,
      }),
    [handleViewOrder, handleEditOrder],
  );

  const filterConfig = useMemo(
    () =>
      buildCreatedOrdersFilterConfig({
        onApply: (newFilters) => {
          setFilters(newFilters);
          setPage(1);
        },
        onReset: () => {
          setFilters(defaultCreatedOrderFilters);
          setPage(1);
        },
      }),
    [],
  );

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
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                orders.filter((o) => o.status === "ordered").length
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
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                orders.filter((o) => o.status === "partial").length
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
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(
                  orders.reduce(
                    (sum, order) => sum + getOrderDisplayTotal(order),
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
            {paginationInfo
              ? `${paginationInfo.total} order(s) found`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BaseDataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            filterConfig={filterConfig}
            actions={{}}
            customActions={customActions}
            pagination={{
              pageIndex: page - 1,
              pageSize: limit,
              totalPages: paginationInfo?.totalPages || 1,
              totalItems: paginationInfo?.total || 0,
              hasNext: paginationInfo?.hasNext || false,
              hasPrev: paginationInfo?.hasPrev || false,
              manualPagination: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPaginationChange: ({ pageIndex, pageSize }) => {
                setPage(pageIndex + 1);
                if (pageSize !== limit) setLimit(pageSize);
              },
            }}
            enableSorting
          />
        </CardContent>
      </Card>

      {/* View Order Details Drawer */}
      <OrderDetailsDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        order={selectedOrder}
        isLoading={isLoadingDetail}
        formatCurrency={formatCurrency}
        onReceiveItems={() => {
          // Keep selectedOrderId set, swap dialogs
          setViewDrawerOpen(false);
          setReceiveDialogOpen(true);
        }}
        onCancelOrder={() => {
          setViewDrawerOpen(false);
          setCancelDialogOpen(true);
        }}
        onEditOrder={(order) => {
          setViewDrawerOpen(false);
          handleEditOrder(order);
        }}
      />

      {/* Receive Items + Payment Dialog */}
      <ReceiveItemsDialog
        open={receiveDialogOpen}
        onOpenChange={(open) => {
          setReceiveDialogOpen(open);
          if (!open) setSelectedOrderId(null);
        }}
        order={selectedOrder}
        formatCurrency={formatCurrency}
        isPending={receiveMutation.isPending}
        onSubmit={handleReceiveSubmit}
      />

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
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
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
