"use client";

import { useCurrency } from "@/lib/currency";
import {
  useAccounts,
  useAddPurchasePayment,
  usePurchaseOrderPayments,
  usePurchaseOrders,
  usePurchaseOrdersSummary,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type {
  AddPurchasePaymentDto,
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderStatus,
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
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Separator } from "@/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Skeleton } from "@/ui/components/skeleton";
import { Textarea } from "@/ui/components/textarea";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  Plus,
  Receipt,
  Wallet,
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

// Payment type definition
interface Payment {
  _id: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  notes?: string;
  accountId?: { name: string };
  createdBy?: { firstName: string; lastName: string };
}

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // State for pagination and filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});

  // State for modals/drawers
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [paymentsDrawerOpen, setPaymentsDrawerOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Data fetching - only received, partial, cancelled for history
  const {
    data: purchaseData,
    isLoading,
    refetch,
  } = usePurchaseOrders({
    page,
    limit,
    ...filters,
  });

  const { data: paymentsData, isLoading: isLoadingPayments } =
    usePurchaseOrderPayments(selectedOrder?._id || "");

  const { data: accountsData } = useAccounts();
  const addPaymentMutation = useAddPurchasePayment();

  // Summary data
  const { data: summaryData, isLoading: isSummaryLoading } =
    usePurchaseOrdersSummary();
  const summary = summaryData?.data;

  const purchases: PurchaseOrder[] = purchaseData?.data?.items || [];
  const payments: Payment[] = (paymentsData?.data || []) as Payment[];
  const accounts = accountsData?.items || [];

  // Pagination info
  const paginationInfo = useMemo(() => {
    if (!purchaseData?.data) return null;
    const { total, totalPages, hasNext, hasPrev } = purchaseData.data;
    return { total, totalPages, hasNext, hasPrev };
  }, [purchaseData]);

  // Handlers
  const handleViewPayments = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setPaymentsDrawerOpen(true);
  }, []);

  const handleViewDetails = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDetailDrawerOpen(true);
  }, []);

  const handleMakePayment = useCallback((order: PurchaseOrder) => {
    setSelectedOrder(order);
    setPaymentAmount((order.dueAmount || 0).toFixed(2));
    setPaymentAccountId("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setPaymentModalOpen(true);
  }, []);

  const handlePaymentSubmit = useCallback(async () => {
    if (!selectedOrder || !paymentAccountId) {
      toast.error("Please select a payment account");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > (selectedOrder.dueAmount || 0)) {
      toast.error("Payment amount cannot exceed due amount");
      return;
    }

    try {
      await addPaymentMutation.mutateAsync({
        id: selectedOrder._id,
        data: {
          paidAmount: amount,
          amount: amount,
          accountId: paymentAccountId,
          paymentMethod:
            paymentMethod as AddPurchasePaymentDto["paymentMethod"],
          notes: paymentNotes || undefined,
        },
      });
      setPaymentModalOpen(false);
      refetch();
    } catch (error) {
      // Error is handled by mutation's onError
    }
  }, [
    selectedOrder,
    paymentAmount,
    paymentAccountId,
    paymentMethod,
    paymentNotes,
    addPaymentMutation,
    refetch,
  ]);

  const formatDateTime = (date: string | Date) =>
    format(new Date(date), "dd MMM yyyy HH:mm");

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
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => {
          const supplier = row.original.supplier;
          return (
            <span className="font-medium">
              {supplier?.name || (
                <span className="text-muted-foreground">Unknown</span>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.items.length}</Badge>
        ),
      },
      {
        accessorKey: "grandTotal",
        header: () => <span className="flex justify-end">Total</span>,
        cell: ({ row }) => (
          <span className="flex justify-end font-medium">
            {formatCurrency(row.original.invoiceAmount || 0)}
          </span>
        ),
      },
      {
        accessorKey: "paidAmount",
        header: () => <span className="flex justify-end">Paid</span>,
        cell: ({ row }) => (
          <span className="flex justify-end text-green-600">
            {formatCurrency(row.original.paidAmount || 0)}
          </span>
        ),
      },
      {
        accessorKey: "dueAmount",
        header: () => <span className="flex justify-end">Due</span>,
        cell: ({ row }) => (
          <span
            className={`flex justify-end ${
              (row.original.dueAmount || 0) > 0
                ? "text-red-600 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {formatCurrency(row.original.dueAmount || 0)}
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
        icon: <Package className="h-4 w-4" />,
        label: "View Details",
        tooltip: "View order details",
        onClick: (row: PurchaseOrder) => handleViewDetails(row),
      },
      {
        type: "custom" as const,
        placement: "cell" as const,
        icon: <Receipt className="h-4 w-4" />,
        label: "View Payments",
        tooltip: "View payment history",
        onClick: (row: PurchaseOrder) => handleViewPayments(row),
      },
      ...(isAccountsEnabled
        ? [
            {
              type: "custom" as const,
              placement: "cell" as const,
              icon: <CreditCard className="h-4 w-4" />,
              label: "Make Payment",
              tooltip: "Add payment for this purchase",
              onClick: (row: PurchaseOrder) => handleMakePayment(row),
              disabled: (row: PurchaseOrder) =>
                (row.dueAmount || 0) <= 0 || row.status === "cancelled",
            },
          ]
        : []),
    ],
    [
      handleViewDetails,
      handleViewPayments,
      handleMakePayment,
      isAccountsEnabled,
    ],
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
            { label: "All Statuses", value: "" },
            { label: "Received", value: "received" },
            { label: "Ordered", value: "ordered" },
            { label: "Partial", value: "partial" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
        {
          name: "search",
          label: "Search",
          type: "text" as const,
          placeholder: "Order number, supplier...",
        },
      ] as FilterField[],
      onApply: (newFilters: Record<string, unknown>) => {
        setFilters(newFilters as PurchaseOrderFilters);
        setPage(1);
      },
      onReset: () => {
        setFilters({});
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

      {/* Summary Stats Cards */}
      <div
        className={`grid gap-4 ${
          isAccountsEnabled ? "md:grid-cols-4" : "md:grid-cols-2"
        }`}
      >
        {/* Total Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                (summary?.totalOrders ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isSummaryLoading
                ? "..."
                : `${summary?.receivedOrders ?? 0} received, ${
                    summary?.orderedOrders ?? 0
                  } pending`}
            </p>
          </CardContent>
        </Card>

        {/* Total Amount */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-2xl">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(summary?.totalAmount ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time purchases</p>
          </CardContent>
        </Card>

        {/* Total Paid - Only when accounts enabled */}
        {isAccountsEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {isSummaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(summary?.totalPaid ?? 0)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Amount paid to suppliers
              </p>
            </CardContent>
          </Card>
        )}

        {/* Total Due - Only when accounts enabled */}
        {isAccountsEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Due</CardDescription>
              <CardTitle
                className={`text-2xl ${
                  (summary?.totalDue ?? 0) > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {isSummaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(summary?.totalDue ?? 0)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Outstanding balance
              </p>
            </CardContent>
          </Card>
        )}
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
            data={purchases}
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
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {selectedOrder?.orderNumber}
            </SheetTitle>
            <SheetDescription>Purchase order information</SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-6">
              {/* Order Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="font-medium">
                    {selectedOrder.supplier?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={statusConfig[selectedOrder.status].variant}>
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
                {selectedOrder.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice #</span>
                    <span>{selectedOrder.invoiceNumber}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border p-3 flex justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {item.productName || "Product"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} ×{" "}
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(selectedOrder.discountValue)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
                {isAccountsEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="text-green-600">
                        {formatCurrency(selectedOrder.paidAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due</span>
                      <span
                        className={
                          (selectedOrder.dueAmount || 0) > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(selectedOrder.dueAmount || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* View Payments Drawer */}
      <Sheet open={paymentsDrawerOpen} onOpenChange={setPaymentsDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payments - {selectedOrder?.orderNumber}
            </SheetTitle>
            <SheetDescription>
              Payment history for this purchase
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-6">
              {/* Order Summary */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">
                    {formatCurrency(selectedOrder.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Amount</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(selectedOrder.paidAmount || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Due Amount</span>
                  <span
                    className={`font-bold ${
                      (selectedOrder.dueAmount || 0) > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(selectedOrder.dueAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Payment Action Button */}
              {isAccountsEnabled &&
                (selectedOrder.dueAmount || 0) > 0 &&
                selectedOrder.status !== "cancelled" && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setPaymentsDrawerOpen(false);
                      handleMakePayment(selectedOrder);
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                )}

              {/* Payments List */}
              <div>
                <h4 className="font-medium mb-3">Payment History</h4>

                {isLoadingPayments ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment._id}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-green-600">
                              +{formatCurrency(payment.amount)}
                            </span>
                            <div className="text-sm text-muted-foreground">
                              {formatDateTime(payment.createdAt)}
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {payment.paymentMethod}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Wallet className="h-3 w-3" />
                          {payment.accountId?.name || "Unknown Account"}
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground">
                            {payment.notes}
                          </p>
                        )}
                        {payment.createdBy && (
                          <p className="text-xs text-muted-foreground">
                            By {payment.createdBy.firstName}{" "}
                            {payment.createdBy.lastName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Make Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Payment
            </DialogTitle>
            <DialogDescription>
              Add payment for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Due Amount Info */}
              <div className="rounded-lg bg-muted p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Due Amount
                  </span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedOrder.dueAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedOrder.dueAmount || 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              {/* Payment Account */}
              <div className="space-y-2">
                <Label htmlFor="account">Payment Account</Label>
                <Select
                  value={paymentAccountId}
                  onValueChange={setPaymentAccountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="mfs">Mobile Banking</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={addPaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={
                addPaymentMutation.isPending ||
                !paymentAccountId ||
                !paymentAmount
              }
            >
              {addPaymentMutation.isPending ? "Processing..." : "Add Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
