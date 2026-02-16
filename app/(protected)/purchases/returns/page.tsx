"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Clock,
  CornerUpLeft,
  FileText,
  Minus,
  Package,
  Plus,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import { CardTable } from "@/ui/components/custom/card-table";
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
import { Skeleton } from "@/ui/components/skeleton";
import { Textarea } from "@/ui/components/textarea";

import { useCurrency } from "@/lib/currency";
import {
  useAccounts,
  useCreatePurchaseReturn,
  usePurchaseOrder,
  usePurchaseReturns,
  usePurchaseReturnsSummary,
  useSupplierPendingDues,
} from "@/services/api";
import { useAuthStore } from "@/services/stores";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseReturn,
  PurchaseReturnReason,
} from "@/types";

// =====================
// Schema Definitions
// =====================

const orderSearchSchema = z.object({
  orderId: z.string().min(1, "Please enter an order ID or order number"),
});

type OrderSearchData = z.infer<typeof orderSearchSchema>;

// =====================
// Types
// =====================

interface ReturnableItem extends PurchaseOrderItem {
  maxReturnableQty: number;
  returnQty: number;
  refundAmount: number;
  selected: boolean;
}

interface DueAllocation {
  dueId: string;
  purchaseOrderId: string;
  orderNumber: string;
  dueAmount: number;
  allocatedAmount: number;
  selected: boolean;
}

const RETURN_REASONS: { value: PurchaseReturnReason; label: string }[] = [
  { value: "damaged", label: "Damaged" },
  { value: "defective", label: "Defective" },
  { value: "wrong_item", label: "Wrong Item" },
  { value: "excess_quantity", label: "Excess Quantity" },
  { value: "expired", label: "Expired" },
  { value: "other", label: "Other" },
];

// =====================
// Helper Functions
// =====================

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// =====================
// Main Component
// =====================

export default function PurchaseReturnsPage() {
  const searchParams = useSearchParams();
  const { format: formatCurrency } = useCurrency();

  // State
  const [searchId, setSearchId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    searchParams.get("orderId"),
  );
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);
  const [reason, setReason] = useState<PurchaseReturnReason>("damaged");
  const [notes, setNotes] = useState("");
  const [dueAllocations, setDueAllocations] = useState<DueAllocation[]>([]);
  const [accountRefundAmount, setAccountRefundAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Auth & Features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // API Hooks
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    refetch: refetchOrder,
  } = usePurchaseOrder(selectedOrderId || "");
  const { data: returnsData, isLoading: isLoadingReturns } = usePurchaseReturns(
    {
      limit: 50,
    },
  );
  const { data: accountsData } = useAccounts();
  const { data: summaryData, isLoading: isSummaryLoading } =
    usePurchaseReturnsSummary();

  // Derived Data
  const order = orderData?.data as PurchaseOrder | undefined;
  const returns = (returnsData?.data?.items || []) as PurchaseReturn[];
  const accounts = (accountsData?.items || []) as any[];
  const summary = summaryData?.data;

  // Extract supplier ID - handle both populated object and string formats
  const orderSupplierId = useMemo(() => {
    if (!order) return "";
    // supplierId might be populated object or string
    if (typeof order.supplierId === "object" && order.supplierId?._id) {
      return order.supplierId._id;
    }
    if (typeof order.supplierId === "string") {
      return order.supplierId;
    }
    return order.supplierId?._id || "";
  }, [order]);

  const { data: pendingDuesData } = useSupplierPendingDues(
    orderSupplierId,
    selectedOrderId || "",
  );
  const pendingDues = useMemo(
    () => (pendingDuesData as any)?.data || [],
    [pendingDuesData],
  );

  const createReturnMutation = useCreatePurchaseReturn();

  // Form
  const searchForm = useForm<OrderSearchData>({
    resolver: zodResolver(orderSearchSchema),
    defaultValues: { orderId: "" },
  });

  // Initialize returnable items from order
  const initialReturnableItems = useMemo((): ReturnableItem[] => {
    if (!order?.items) return [];
    return order.items.map((item) => ({
      ...item,
      maxReturnableQty: item.receivedQuantity || 0,
      returnQty: 0,
      refundAmount: 0,
      selected: false,
    }));
  }, [order]);

  // Initialize due allocations from pending dues
  const initialDueAllocations = useMemo((): DueAllocation[] => {
    if (pendingDues.length === 0) return [];
    return pendingDues.map((due: any) => ({
      dueId: due.id || due._id,
      purchaseOrderId: due.purchaseOrderId,
      orderNumber: due.orderNumber,
      dueAmount: due.dueAmount,
      allocatedAmount: 0,
      selected: false,
    }));
  }, [pendingDues]);

  // Sync state with initial values when they change
  useEffect(() => {
    setReturnableItems(initialReturnableItems);
  }, [initialReturnableItems]);

  useEffect(() => {
    setDueAllocations(initialDueAllocations);
  }, [initialDueAllocations]);

  // Calculate totals
  const totalReturnQty = useMemo(
    () =>
      returnableItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.returnQty, 0),
    [returnableItems],
  );

  const totalRefundAmount = useMemo(
    () =>
      returnableItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.refundAmount, 0),
    [returnableItems],
  );

  // Order due amount that can be adjusted
  const orderDueAmount = order?.dueAmount || 0;

  // Amount that can adjust the current order due
  const adjustOrderDueAmount = useMemo(() => {
    return Math.min(totalRefundAmount, orderDueAmount);
  }, [totalRefundAmount, orderDueAmount]);

  // Total allocated to other dues
  const totalOtherDuesAllocated = useMemo(
    () =>
      dueAllocations
        .filter((d) => d.selected)
        .reduce((sum, d) => sum + d.allocatedAmount, 0),
    [dueAllocations],
  );

  // Remaining amount after due adjustments (for account refund)
  const remainingForRefund = useMemo(() => {
    const afterOrderDue = totalRefundAmount - adjustOrderDueAmount;
    return Math.max(0, afterOrderDue - totalOtherDuesAllocated);
  }, [totalRefundAmount, adjustOrderDueAmount, totalOtherDuesAllocated]);

  // Handlers
  const handleSearch = (data: OrderSearchData) => {
    setSelectedOrderId(data.orderId.trim());
  };

  const handleClearSearch = () => {
    setSelectedOrderId(null);
    setReturnableItems([]);
    setDueAllocations([]);
    setAccountRefundAmount(0);
    setNotes("");
    searchForm.reset();
  };

  const handleItemSelect = (index: number, selected: boolean) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected };
      if (!selected) {
        updated[index].returnQty = 0;
        updated[index].refundAmount = 0;
      }
      return updated;
    });
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validQty = Math.max(0, Math.min(qty, item.maxReturnableQty));

      // Calculate refund based on conversionFactor if available
      // When conversionFactor exists: refund = qty × conversionFactor × costPrice
      // Otherwise: refund = qty × costPrice (or unitPrice if costPrice not available)
      const conversionFactor = item.conversionFactor || 1;
      const pricePerUnit = item.costPrice || item.unitPrice;
      const calculatedRefund = validQty * conversionFactor * pricePerUnit;

      updated[index] = {
        ...item,
        returnQty: validQty,
        refundAmount: calculatedRefund,
        selected: validQty > 0,
      };
      return updated;
    });
  };

  const handleRefundAmountChange = (index: number, amount: number) => {
    setReturnableItems((prev) => {
      const updated = [...prev];
      const item = updated[index];

      // Calculate max refund based on conversionFactor if available
      const conversionFactor = item.conversionFactor || 1;
      const pricePerUnit = item.costPrice || item.unitPrice;
      const maxRefund = item.returnQty * conversionFactor * pricePerUnit;

      updated[index] = {
        ...item,
        refundAmount: Math.max(0, Math.min(amount, maxRefund)),
      };
      return updated;
    });
  };

  const handleDueAllocationToggle = (index: number, selected: boolean) => {
    setDueAllocations((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected,
        allocatedAmount: selected ? updated[index].dueAmount : 0,
      };
      return updated;
    });
  };

  const handleDueAllocationAmountChange = (index: number, amount: number) => {
    setDueAllocations((prev) => {
      const updated = [...prev];
      const due = updated[index];
      updated[index] = {
        ...due,
        allocatedAmount: Math.max(0, Math.min(amount, due.dueAmount)),
      };
      return updated;
    });
  };

  const handleSubmitReturn = async () => {
    if (!selectedOrderId || !order) {
      toast.error("Please select an order first");
      return;
    }

    const selectedItems = returnableItems.filter(
      (i) => i.selected && i.returnQty > 0,
    );
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    // Build return items
    const items = selectedItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      inventoryId: item.inventoryId,
      productName: item.productName || item.product?.name,
      quantity: item.returnQty,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice || item.unitPrice,
      discount: item.discount,
      // Include conversionFactor if available (for UoM conversion on return)
      ...(item.conversionFactor && item.conversionFactor > 1
        ? { conversionFactor: item.conversionFactor }
        : {}),
    }));

    // Build refund allocation (only if accounts enabled)
    let refundAllocation: any = undefined;
    if (isAccountsEnabled && totalRefundAmount > 0) {
      refundAllocation = {};

      // Calculate total amounts allocated to other dues
      const selectedDues = dueAllocations.filter(
        (d) => d.selected && d.allocatedAmount > 0,
      );
      const totalOtherDueAllocation = selectedDues.reduce(
        (sum, d) => sum + d.allocatedAmount,
        0,
      );

      // Adjust supplier due (combines current order due + selected other dues)
      // Backend expects single adjustSupplierDue field for the supplier
      const totalDueAdjustment =
        Math.min(adjustOrderDueAmount, orderDueAmount) +
        totalOtherDueAllocation;
      if (totalDueAdjustment > 0) {
        refundAllocation.adjustSupplierDue = totalDueAdjustment;
      }

      // Account refund
      if (accountRefundAmount > 0 && selectedAccountId) {
        refundAllocation.accountRefund = {
          accountId: selectedAccountId,
          amount: accountRefundAmount,
          paymentMethod: "cash",
        };
      }
    }

    try {
      await createReturnMutation.mutateAsync({
        purchaseOrderId: selectedOrderId,
        items,
        reason,
        notes: notes || undefined,
        refundAllocation,
      });

      // Reset form
      handleClearSearch();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Table columns for existing returns
  const returnsColumns: ColumnDef<PurchaseReturn>[] = useMemo(
    () => [
      {
        accessorKey: "returnNumber",
        header: "Return #",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.returnNumber}</span>
        ),
      },
      {
        accessorKey: "purchaseOrderId",
        header: "Original Order",
        cell: ({ row }) => {
          const purchaseOrderId = row.original.purchaseOrderId;
          let orderNumber: string;
          if (
            typeof purchaseOrderId === "object" &&
            purchaseOrderId?.orderNumber
          ) {
            orderNumber = purchaseOrderId.orderNumber;
          } else if (row.original.orderNumber) {
            orderNumber = row.original.orderNumber;
          } else {
            orderNumber = String(purchaseOrderId);
          }
          return <span className="font-mono text-sm">{orderNumber}</span>;
        },
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.items?.length || 0} item(s)
          </span>
        ),
      },
      {
        accessorKey: "totalRefundAmount",
        header: "Refund Amount",
        cell: ({ row }) => (
          <span className="font-medium text-orange-600">
            {formatCurrency(row.original.totalRefundAmount || 0)}
          </span>
        ),
      },
      ...(isAccountsEnabled
        ? [
            {
              accessorKey: "refundAllocation" as const,
              header: "Allocation",
              cell: ({ row }: { row: { original: PurchaseReturn } }) => {
                const ret = row.original;
                const cashRefund = ret.refundedAmount || 0;
                const dueAdjusted = (ret.totalRefundAmount || 0) - cashRefund;

                if (cashRefund > 0 && dueAdjusted > 0) {
                  return (
                    <div className="text-xs space-y-0.5">
                      <div className="text-red-600">
                        Cash: {formatCurrency(cashRefund)}
                      </div>
                      <div className="text-blue-600">
                        Due Adj: {formatCurrency(dueAdjusted)}
                      </div>
                    </div>
                  );
                } else if (cashRefund > 0) {
                  return (
                    <span className="text-xs text-red-600">Cash Refund</span>
                  );
                } else if (dueAdjusted > 0) {
                  return (
                    <span className="text-xs text-blue-600">Due Adjusted</span>
                  );
                }
                return <span className="text-xs text-muted-foreground">-</span>;
              },
            },
          ]
        : []),
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize text-xs">
            {row.original.reason?.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [isAccountsEnabled, formatCurrency],
  );

  // Items table columns
  const itemsColumns: ColumnDef<ReturnableItem>[] = useMemo(
    () => [
      {
        id: "select",
        header: "",
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.selected}
            onCheckedChange={(checked) =>
              handleItemSelect(row.index, checked as boolean)
            }
            disabled={row.original.maxReturnableQty === 0}
          />
        ),
      },
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <span className="font-medium">
              {row.original.productName ||
                row.original.product?.name ||
                "Unknown"}
            </span>
            {row.original.variantName && (
              <span className="text-muted-foreground text-sm ml-1">
                ({row.original.variantName})
              </span>
            )}
            {row.original.conversionFactor &&
              row.original.conversionFactor > 1 && (
                <div className="text-xs text-muted-foreground">
                  1 unit = {row.original.conversionFactor} pcs
                </div>
              )}
          </div>
        ),
      },
      {
        accessorKey: "receivedQuantity",
        header: "Received",
        cell: ({ row }) => row.original.receivedQuantity,
      },
      {
        accessorKey: "maxReturnableQty",
        header: "Returnable",
        cell: ({ row }) => (
          <span
            className={
              row.original.maxReturnableQty === 0 ? "text-muted-foreground" : ""
            }
          >
            {row.original.maxReturnableQty}
          </span>
        ),
      },
      {
        id: "returnQty",
        header: "Return Qty",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                handleItemQtyChange(row.index, row.original.returnQty - 1)
              }
              disabled={!row.original.selected || row.original.returnQty === 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              className="w-16 h-7 text-center"
              value={row.original.returnQty}
              onChange={(e) =>
                handleItemQtyChange(row.index, parseInt(e.target.value) || 0)
              }
              disabled={row.original.maxReturnableQty === 0}
              min={0}
              max={row.original.maxReturnableQty}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                handleItemQtyChange(row.index, row.original.returnQty + 1)
              }
              disabled={row.original.returnQty >= row.original.maxReturnableQty}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "unitPrice",
        header: "Unit Price",
        cell: ({ row }) => {
          const item = row.original;
          const displayPrice = item.costPrice || item.unitPrice;

          // If there's a conversion factor, show both per-unit and per-piece prices
          if (item.conversionFactor && item.conversionFactor > 1) {
            const pricePerPiece = displayPrice;
            const pricePerUnit = displayPrice * item.conversionFactor;
            return (
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(pricePerUnit)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(pricePerPiece)}/pc
                </div>
              </div>
            );
          }

          return (
            <div className="text-right">{formatCurrency(displayPrice)}</div>
          );
        },
      },
      {
        id: "refundAmount",
        header: "Refund Amount",
        cell: ({ row }) => {
          const item = row.original;
          const conversionFactor = item.conversionFactor || 1;
          const pricePerUnit = item.costPrice || item.unitPrice;
          const maxRefund = item.returnQty * conversionFactor * pricePerUnit;

          return (
            <div className="space-y-1">
              <Input
                type="number"
                className="w-28 h-7 text-right"
                value={row.original.refundAmount}
                onChange={(e) =>
                  handleRefundAmountChange(
                    row.index,
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={!row.original.selected}
                min={0}
                max={maxRefund}
              />
              {item.selected &&
                item.returnQty > 0 &&
                item.conversionFactor &&
                item.conversionFactor > 1 && (
                  <div className="text-xs text-muted-foreground">
                    {item.returnQty} \u00d7 {item.conversionFactor} \u00d7{" "}
                    {formatCurrency(pricePerUnit)}
                  </div>
                )}
            </div>
          );
        },
      },
    ],
    [formatCurrency],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Purchase Returns</h1>
        <p className="text-muted-foreground">
          Return items to suppliers and manage refunds
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Returns</CardDescription>
            <CardTitle className="text-2xl">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (summary?.totalReturns ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Refund Amount</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(summary?.totalRefundAmount ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Value returned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Returns</CardDescription>
            <CardTitle className="text-2xl">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (summary?.pendingReturns ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Purchase Order
          </CardTitle>
          <CardDescription>
            Search by order ID or order number to initiate a return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={searchForm.handleSubmit(handleSearch)}
            className="flex gap-4"
          >
            <div className="flex-1">
              <Input
                {...searchForm.register("orderId")}
                placeholder="Enter order ID or order number..."
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isLoadingOrder}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {selectedOrderId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSearch}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Order Details & Return Form */}
      {selectedOrderId && (
        <>
          {isLoadingOrder ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : order ? (
            <>
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order: {order.orderNumber}
                  </CardTitle>
                  <CardDescription>
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Supplier: {order.supplierId?.name || "Unknown"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-medium">
                        {formatCurrency(
                          order.grandTotal || order.totalAmount || 0,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(order.paidAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due:</span>
                      <span
                        className={`ml-2 font-medium ${(order.dueAmount || 0) > 0 ? "text-red-600" : ""}`}
                      >
                        {formatCurrency(order.dueAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="ml-2">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Items to Return</CardTitle>
                  <CardDescription>
                    Choose items and enter return quantities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CardTable columns={itemsColumns} data={returnableItems} />
                </CardContent>
              </Card>

              {/* Return Details */}
              {totalReturnQty > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Return Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Reason & Notes */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reason for Return</Label>
                        <Select
                          value={reason}
                          onValueChange={(v) =>
                            setReason(v as PurchaseReturnReason)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RETURN_REASONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Additional notes..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Refund Allocation (if accounts enabled) */}
                    {isAccountsEnabled && totalRefundAmount > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-4">
                            Refund Allocation
                          </h4>

                          {/* Adjust current order due */}
                          {orderDueAmount > 0 && (
                            <div className="rounded-lg border p-4 mb-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    Adjust This Order&apos;s Due
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Current due:{" "}
                                    {formatCurrency(orderDueAmount)}
                                  </p>
                                </div>
                                <span className="font-medium text-blue-600">
                                  -{formatCurrency(adjustOrderDueAmount)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Adjust other dues */}
                          {dueAllocations.length > 0 && (
                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-medium">
                                Adjust Other Dues to This Supplier
                              </p>
                              {dueAllocations.map((due, index) => (
                                <div
                                  key={due.dueId}
                                  className="flex items-center gap-4 p-3 rounded-lg border"
                                >
                                  <Checkbox
                                    checked={due.selected}
                                    onCheckedChange={(checked) =>
                                      handleDueAllocationToggle(
                                        index,
                                        checked as boolean,
                                      )
                                    }
                                  />
                                  <div className="flex-1">
                                    <span className="font-mono text-sm">
                                      {due.orderNumber}
                                    </span>
                                    <span className="text-muted-foreground text-sm ml-2">
                                      (Due: {formatCurrency(due.dueAmount)})
                                    </span>
                                  </div>
                                  <Input
                                    type="number"
                                    className="w-28 text-right"
                                    value={due.allocatedAmount}
                                    onChange={(e) =>
                                      handleDueAllocationAmountChange(
                                        index,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    disabled={!due.selected}
                                    min={0}
                                    max={due.dueAmount}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Cash refund to account */}
                          {remainingForRefund > 0 && (
                            <div className="rounded-lg border p-4">
                              <p className="text-sm font-medium mb-3">
                                Cash Refund to Account
                              </p>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Account</Label>
                                  <Select
                                    value={selectedAccountId}
                                    onValueChange={setSelectedAccountId}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {accounts.map((acc: any) => (
                                        <SelectItem
                                          key={acc._id}
                                          value={acc._id}
                                        >
                                          {acc.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>
                                    Amount (Max:{" "}
                                    {formatCurrency(remainingForRefund)})
                                  </Label>
                                  <Input
                                    type="number"
                                    value={accountRefundAmount}
                                    onChange={(e) =>
                                      setAccountRefundAmount(
                                        Math.min(
                                          parseFloat(e.target.value) || 0,
                                          remainingForRefund,
                                        ),
                                      )
                                    }
                                    min={0}
                                    max={remainingForRefund}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Summary & Submit */}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Returning {totalReturnQty} item(s)
                        </p>
                        <p className="text-lg font-semibold">
                          Total Refund: {formatCurrency(totalRefundAmount)}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleSubmitReturn}
                        disabled={
                          createReturnMutation.isPending || totalReturnQty === 0
                        }
                      >
                        {createReturnMutation.isPending ? (
                          "Processing..."
                        ) : (
                          <>
                            <CornerUpLeft className="h-4 w-4 mr-2" />
                            Submit Return
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Order not found</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Returns
          </CardTitle>
          <CardDescription>History of purchase returns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReturns ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CornerUpLeft className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No returns recorded yet</p>
            </div>
          ) : (
            <CardTable columns={returnsColumns} data={returns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
