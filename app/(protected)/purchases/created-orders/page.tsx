"use client";

import { useCurrency } from "@/lib/currency";
import {
  useCancelPurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrders,
  useReceivePurchaseOrder,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderStatus,
  ReceivePurchaseOrderDto,
} from "@/types";
import type { FilterField } from "@/types/filter";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { BaseDataTable } from "@/ui/components/dataTable/base-data-table ";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Separator } from "@/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Skeleton } from "@/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Package,
  PackageCheck,
  Plus,
  Truck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// Status configuration for badges
const statusConfig: Record<
  PurchaseOrderStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  draft: {
    label: "Draft",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  ordered: {
    label: "Ordered",
    variant: "outline",
    icon: <Package className="h-3 w-3" />,
  },
  partial: {
    label: "Partial",
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  received: {
    label: "Received",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

// Item with receive quantity state
interface ItemReceiveState {
  productId: string;
  variantId?: string | null;
  inventoryId?: string;
  receivedQuantity: number;
  maxQuantity: number;
  productName: string;
}

export default function CreatedOrdersPage() {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const { user } = useAuthStore();

  // State for pagination and filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    status: "ordered", // Default filter to show only ordered items
  });

  // State for modals/drawers
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // State for receive quantities
  const [receiveItems, setReceiveItems] = useState<ItemReceiveState[]>([]);

  // Data fetching
  const {
    data: ordersData,
    isLoading,
    refetch,
  } = usePurchaseOrders({
    page,
    limit,
    ...filters,
  });

  // Fetch selected order details
  const { data: orderDetailData, isLoading: isLoadingDetail } =
    usePurchaseOrder(selectedOrderId || "");

  const selectedOrder = orderDetailData?.data;

  // Mutations
  const receiveMutation = useReceivePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();

  const orders: PurchaseOrder[] = ordersData?.data?.items || [];

  // Pagination info
  const paginationInfo = useMemo(() => {
    if (!ordersData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = ordersData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [ordersData]);

  // Initialize receive items when order is selected
  const initializeReceiveItems = useCallback((order: PurchaseOrder) => {
    const items: ItemReceiveState[] = order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      inventoryId: item.inventoryId,
      receivedQuantity: item.quantity - item.receivedQuantity, // Default to remaining quantity
      maxQuantity: item.quantity - item.receivedQuantity,
      productName: item.productName || item.product?.name || "Unknown Product",
    }));
    setReceiveItems(items);
  }, []);

  // Handlers
  const handleViewOrder = useCallback((order: PurchaseOrder) => {
    setSelectedOrderId(order._id);
    setViewDrawerOpen(true);
  }, []);

  const handleConfirmOrder = useCallback(
    (order: PurchaseOrder) => {
      setSelectedOrderId(order._id);
      initializeReceiveItems(order);
      setConfirmDialogOpen(true);
    },
    [initializeReceiveItems],
  );

  const handleCancelOrder = useCallback((order: PurchaseOrder) => {
    setSelectedOrderId(order._id);
    setCancelDialogOpen(true);
  }, []);

  const handleReceiveSubmit = useCallback(async () => {
    if (!selectedOrderId) return;

    // Validate that at least one item has quantity > 0
    const hasItems = receiveItems.some((item) => item.receivedQuantity > 0);
    if (!hasItems) {
      toast.error("Please enter quantity for at least one item");
      return;
    }

    // Build receive data
    const data: ReceivePurchaseOrderDto = {
      items: receiveItems
        .filter((item) => item.receivedQuantity > 0)
        .map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          inventoryId: item.inventoryId,
          receivedQuantity: item.receivedQuantity,
        })),
    };

    try {
      await receiveMutation.mutateAsync({ id: selectedOrderId, data });
      setConfirmDialogOpen(false);
      setSelectedOrderId(null);
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedOrderId, receiveItems, receiveMutation, refetch]);

  const handleCancelSubmit = useCallback(async () => {
    if (!selectedOrderId) return;

    try {
      await cancelMutation.mutateAsync(selectedOrderId);
      setCancelDialogOpen(false);
      setSelectedOrderId(null);
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedOrderId, cancelMutation, refetch]);

  const updateReceiveQuantity = useCallback(
    (index: number, quantity: number) => {
      setReceiveItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          receivedQuantity: Math.min(
            Math.max(0, quantity),
            updated[index].maxQuantity,
          ),
        };
        return updated;
      });
    },
    [],
  );

  // Table columns
  const columns: ColumnDef<PurchaseOrder>[] = useMemo(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Order #",
        cell: ({ row }) => (
          <span className="font-mono font-medium">
            {row.original.orderNumber}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => <DateCell value={row.original.createdAt} />,
      },
      {
        accessorKey: "supplierId",
        header: "Supplier",
        cell: ({ row }) => {
          const supplier = row.original.supplierId;
          return (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {supplier?.name || (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.items.length} items</Badge>
        ),
      },
      {
        accessorKey: "invoiceAmount",
        header: () => <span className="flex justify-end">Total Amount</span>,
        cell: ({ row }) => (
          <span className="flex justify-end font-medium">
            {formatCurrency(row.original.invoiceAmount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const config = statusConfig[status];
          return (
            <Badge variant={config.variant} className="flex gap-1 w-fit">
              {config.icon}
              {config.label}
            </Badge>
          );
        },
      },
    ],
    [formatCurrency],
  );

  // Custom actions for each row
  const customActions = useMemo(
    () => [
      {
        type: "custom" as const,
        placement: "cell" as const,
        icon: <Eye className="h-4 w-4" />,
        label: "View Details",
        tooltip: "View order details",
        onClick: (row: PurchaseOrder) => handleViewOrder(row),
      },
      {
        type: "custom" as const,
        placement: "cell" as const,
        icon: <PackageCheck className="h-4 w-4" />,
        label: "Confirm Order",
        tooltip: "Receive items from this order",
        onClick: (row: PurchaseOrder) => handleConfirmOrder(row),
        disabled: (row: PurchaseOrder) =>
          row.status !== "ordered" && row.status !== "partial",
      },
      {
        type: "custom" as const,
        placement: "cell" as const,
        icon: <XCircle className="h-4 w-4" />,
        label: "Cancel Order",
        tooltip: "Cancel this order",
        onClick: (row: PurchaseOrder) => handleCancelOrder(row),
        disabled: (row: PurchaseOrder) =>
          row.status !== "ordered" && row.status !== "draft",
      },
    ],
    [handleViewOrder, handleConfirmOrder, handleCancelOrder],
  );

  // Filter configuration
  const filterConfig = useMemo(
    () => ({
      fields: [
        {
          name: "status",
          label: "Status",
          type: "select" as const,
          options: [
            { label: "Ordered", value: "ordered" },
            { label: "Partial", value: "partial" },
            { label: "Draft", value: "draft" },
            { label: "All Statuses", value: "" },
          ],
        },
        {
          name: "search",
          label: "Search",
          type: "text" as const,
          placeholder: "Order number...",
        },
      ] as FilterField[],
      onApply: (newFilters: Record<string, unknown>) => {
        setFilters(newFilters as PurchaseOrderFilters);
        setPage(1);
      },
      onReset: () => {
        setFilters({ status: "ordered" });
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
                  orders.reduce((sum, o) => sum + o.totalAmount, 0),
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
      <Sheet open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {selectedOrder?.orderNumber}
            </SheetTitle>
            <SheetDescription>View purchase order information</SheetDescription>
          </SheetHeader>

          {isLoadingDetail ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6 mt-6">
              {/* Order Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusConfig[selectedOrder.status].variant}>
                    {statusConfig[selectedOrder.status].icon}
                    <span className="ml-1">
                      {statusConfig[selectedOrder.status].label}
                    </span>
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="font-medium">
                    {selectedOrder.supplierId?.name || "Unknown"}
                  </span>
                </div>
                {selectedOrder.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Supplier Invoice
                    </span>
                    <span>{selectedOrder.invoiceNumber}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selectedOrder.invoiceAmount)}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-medium mb-3">Order Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Cost Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.productName || item.product?.name || "Unknown"}
                          {item.variantName && (
                            <span className="text-muted-foreground text-sm ml-1">
                              ({item.variantName})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                          {item.conversionFactor > 1 &&
                            ` X ${item.conversionFactor} = ${item.quantity * item.conversionFactor}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            item.unitPrice *
                              (item.quantity * (item.conversionFactor || 1)),
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            item.costPrice *
                              (item.quantity * (item.conversionFactor || 1)),
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-muted-foreground text-sm">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {(selectedOrder.status === "ordered" ||
                selectedOrder.status === "partial") && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setViewDrawerOpen(false);
                      initializeReceiveItems(selectedOrder);
                      setConfirmDialogOpen(true);
                    }}
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Receive Items
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Confirm/Receive Order Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Receive Items
            </DialogTitle>
            <DialogDescription>
              Enter the quantity received for each item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right w-32">Receive Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiveItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.maxQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={item.maxQuantity}
                        value={item.receivedQuantity}
                        onChange={(e) =>
                          updateReceiveQuantity(
                            index,
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-24 text-right ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="rounded-lg bg-muted p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total items to receive
                </span>
                <span className="font-medium">
                  {receiveItems.reduce(
                    (sum, item) => sum + item.receivedQuantity,
                    0,
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={receiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReceiveSubmit}
              disabled={receiveMutation.isPending}
            >
              {receiveMutation.isPending ? "Processing..." : "Confirm Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
