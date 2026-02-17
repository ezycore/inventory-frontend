"use client";

import {
  getSalesColumns,
  extractCustomerValue,
  formatCurrency,
  getCustomerFormConfig,
  getPaymentFormConfig,
  ProductSearch,
  type CreateSalesOrderData,
} from "@/components/sales";
import { useCreateSalesOrder } from "@/services/api";
import { useAuthStore, useSellPageStore } from "@/services/stores";
import { applyDiscountWithPriority, type DiscountType } from "@/utils/discount";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { CardTable } from "@/ui/components/custom/card-table";
import DynamicForm from "@/ui/components/form";
import { Input } from "@/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { Separator } from "@/ui/components/separator";
import { CheckCircleIcon, ClipboardList } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";

// =====================
// Main Component
// =====================

export default function SalesPage() {
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [localAdditionalDiscount, setLocalAdditionalDiscount] = useState(0);
  const { symbol } = useCurrency();

  // Get organization features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // Store state
  const {
    customerId,
    customerName,
    orderDiscountType,
    orderDiscountValue,
    additionalDiscount,
    notes,
    items,
    getTotalCostPrice,
    getTotalSalePrice,
    setCustomer,
    setOrderDiscount,
    setAdditionalDiscount,
    setNotes,
    addItem,
    updateItem,
    removeItem,
    clearAll,
  } = useSellPageStore();

  // API mutations
  const createOrderMutation = useCreateSalesOrder();

  // Form configurations
  const customerFormConfig = useMemo(
    () => getCustomerFormConfig(isAccountsEnabled),
    [isAccountsEnabled],
  );

  const paymentFormConfig = useMemo(
    () => getPaymentFormConfig(isAccountsEnabled),
    [isAccountsEnabled],
  );

  // Customer form (also holds payment fields)
  const customerForm = useForm({
    defaultValues: {
      customerId: customerId
        ? { value: customerId, label: customerName || "" }
        : null,
      discountType: orderDiscountType,
      discountValue: orderDiscountValue,
      accountId: null,
      paidAmount: 0,
      notes: notes,
    },
  });

  // Sync local additional discount with store
  useEffect(() => {
    setLocalAdditionalDiscount(additionalDiscount);
  }, [additionalDiscount]);

  // Handle inline discount change in table
  const handleUpdateDiscount = useCallback(
    (id: string, discountPercent: number) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const discountAmount = item.unitPrice * (discountPercent / 100);
      const salePrice = Math.max(0, item.unitPrice - discountAmount);
      updateItem(id, {
        discountType: "percentage",
        discountValue: discountPercent,
        discountAmount,
        salePrice,
      });
    },
    [items, updateItem],
  );

  // Columns with quantity controls, discount editing, and remove
  const salesColumns = useMemo(
    () =>
      getSalesColumns(
        (id, quantity) => updateItem(id, { quantity }),
        handleUpdateDiscount,
        removeItem,
      ),
    [updateItem, handleUpdateDiscount, removeItem],
  );

  // =====================
  // Event Handlers
  // =====================

  const handleCustomerFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "customerId") {
        const customer = extractCustomerValue(value);
        setCustomer(
          customer.value,
          customer.label,
          customer.discountType,
          customer.discountValue,
        );
        if (customer.value) {
          customerForm.setValue("discountType", customer.discountType);
          customerForm.setValue("discountValue", customer.discountValue);
        }
      } else if (fieldName === "discountType") {
        const currentDiscountValue = customerForm.getValues("discountValue");
        setOrderDiscount(value as DiscountType, currentDiscountValue);
      } else if (fieldName === "discountValue") {
        const currentDiscountType = customerForm.getValues("discountType");
        setOrderDiscount(currentDiscountType, value as number);
      }
    },
    [customerForm, setCustomer, setOrderDiscount],
  );

  const handlePaymentFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "paidAmount") {
        setPaidAmount(value as number);
      } else if (fieldName === "notes") {
        setNotes(value as string);
      }
    },
    [setNotes],
  );

  const handleProductSelect = useCallback(
    (product: any) => {
      if (!product) return;
      if (product.availableQuantity <= 0) {
        toast.error(`${product.label} is out of stock`);
        return;
      }
      const discountType = customerForm.getValues("discountType");
      const discountValue = customerForm.getValues("discountValue");
      const { discountAmount, salePrice } = applyDiscountWithPriority({
        unitPrice: product.unitPrice,
        orderDiscountType: discountType,
        orderDiscountValue: discountValue,
      });
      addItem({
        inventoryId: product.value,
        productId: product.productId,
        variantId: product.variantId,
        productName: product.label,
        quantity: 1,
        costPrice: product.costPrice,
        unitPrice: product.unitPrice,
        discountType,
        discountValue,
        discountAmount,
        salePrice,
        availableQuantity: product.availableQuantity,
      });
      toast.success(`${product.label} added`);
    },
    [addItem, customerForm],
  );

  const handleMarkAsSold = useCallback(async () => {
    if (items.length === 0) {
      toast.error("Please add items to the order");
      return;
    }
    const accountId = customerForm.getValues("accountId");
    const paidAmount = customerForm.getValues("paidAmount") || 0;
    const formAdditionalDiscount = localAdditionalDiscount;
    const extractedAccountId =
      typeof accountId === "object" && accountId !== null && "value" in accountId
        ? accountId.value
        : typeof accountId === "string"
          ? accountId
          : null;
    if (isAccountsEnabled && paidAmount > 0 && !extractedAccountId) {
      toast.error("Please select a payment account");
      return;
    }
    try {
      const totalSalePrice = getTotalSalePrice();
      const totalCostPrice = getTotalCostPrice();
      const dueAmount = Math.max(totalSalePrice - paidAmount, 0);
      const orderData: CreateSalesOrderData = {
        customerId: customerId || undefined,
        locationId: "default",
        items: items.map((item) => ({
          productId: item.productId,
          inventoryId: item.inventoryId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          discount: item.discountAmount,
          productName: item.productName,
        })),
        additionalDiscount: formAdditionalDiscount,
        totalPrice: totalSalePrice,
        costPrice: totalCostPrice,
        notes: notes || undefined,
      };
      if (isAccountsEnabled && extractedAccountId && paidAmount > 0) {
        orderData.payment = { paidAmount, accountId: extractedAccountId };
        orderData.dueAmount = dueAmount;
      }
      const createResult = await createOrderMutation.mutateAsync(orderData);
      if (createResult.data?._id) {
        setShowSuccessPopover(true);
        setTimeout(() => setShowSuccessPopover(false), 3000);
        clearAll();
        customerForm.reset({
          customerId: null,
          discountType: "percentage",
          discountValue: 0,
          accountId: null,
          paidAmount: 0,
          notes: "",
        });
        setPaidAmount(0);
        setLocalAdditionalDiscount(0);
      }
    } catch (error) {
      console.error("Failed to complete sale:", error);
      toast.error("Failed to complete sale");
    }
  }, [
    items,
    customerId,
    notes,
    isAccountsEnabled,
    getTotalSalePrice,
    getTotalCostPrice,
    createOrderMutation,
    clearAll,
    customerForm,
    localAdditionalDiscount,
  ]);

  const isLoading = createOrderMutation.isPending;
  const itemsSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalSalePrice = getTotalSalePrice();
  const dueAmount = Math.max(totalSalePrice - paidAmount, 0);

  // =====================
  // Render
  // =====================

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Select Customer */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  1
                </span>
                <h3 className="font-semibold text-sm">Select Customer</h3>
              </div>
              <DynamicForm
                form={customerForm}
                config={customerFormConfig}
                onFieldChange={handleCustomerFieldChange}
                hideCancel
              />
            </CardContent>
          </Card>

          {/* Step 2: Add Products */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  2
                </span>
                <h3 className="font-semibold text-sm">Add Products</h3>
              </div>
              <ProductSearch onSelect={handleProductSelect} />
            </CardContent>
          </Card>

          {/* Step 3: Order Items Table */}
          {items.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      3
                    </span>
                    <h3 className="font-semibold text-sm">Order Items</h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-muted-foreground hover:text-destructive text-xs h-7"
                  >
                    Clear All
                  </Button>
                </div>
                <CardTable
                  columns={salesColumns}
                  data={items}
                  emptyMessage="No items added yet"
                  showCard={false}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* ==================== RIGHT COLUMN (Sticky Sidebar) ==================== */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardContent className="pt-4 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-base">Order Summary</h3>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(itemsSubtotal)}
                  </span>
                </div>

                {/* Additional Discount */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Additional Discount ({symbol})
                  </span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      value={localAdditionalDiscount || ""}
                      onChange={(e) => {
                        const value = Math.max(0, Number(e.target.value) || 0);
                        setLocalAdditionalDiscount(value);
                        setAdditionalDiscount(value);
                      }}
                      placeholder="0"
                      className="w-20 h-7 text-right text-sm"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatCurrency(totalSalePrice)}
                  </span>
                </div>

                <Separator />

                {/* Payment Form */}
                <DynamicForm
                  form={customerForm}
                  config={paymentFormConfig}
                  onFieldChange={handlePaymentFieldChange}
                  hideCancel
                />

                {/* Payment Summary */}
                {isAccountsEnabled && paidAmount > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="font-semibold text-green-600 dark:text-green-500 tabular-nums">
                        {formatCurrency(paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          dueAmount > 0
                            ? "text-orange-600 dark:text-orange-500"
                            : "text-green-600 dark:text-green-500"
                        }`}
                      >
                        {formatCurrency(dueAmount)}
                      </span>
                    </div>
                    {paidAmount > totalSalePrice && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Change</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          {formatCurrency(paidAmount - totalSalePrice)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Confirm Order */}
                <Popover open={showSuccessPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      onClick={handleMarkAsSold}
                      disabled={isLoading || items.length === 0}
                      size="lg"
                      className="w-full font-semibold"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      {isLoading ? "Processing..." : "Confirm Order"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="font-medium">
                        Sale completed successfully!
                      </span>
                    </div>
                  </PopoverContent>
                </Popover>

                {items.length > 0 && (
                  <p className="text-center text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? "item" : "items"} in
                    order
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
