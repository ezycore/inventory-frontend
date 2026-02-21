"use client";

import { getSalesColumns, formatCurrency, getPaymentFormConfig, ProductSearch, type CreateSalesOrderData, customerFormConfig, ProductApiItem } from "@/components/sales";
import { useCreateSalesOrder } from "@/services/api";
import { useAuthStore, useSellPageStore } from "@/services/stores";
import { applyDiscountWithPriority, type DiscountType } from "@/utils/discount";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { CardTable } from "@/ui/components/custom/card-table";
import DynamicForm from "@/ui/components/form";
import { Input } from "@/ui/components/input";
import { Separator } from "@/ui/components/separator";
import { CheckCircleIcon, ClipboardList } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";

export default function SalesPage() {
  const [paidAmount, setPaidAmount] = useState(0);
  const [localAdditionalDiscount, setLocalAdditionalDiscount] = useState(0);
  const { symbol } = useCurrency();

  // Get organization features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const defaultCustomer = user.defaultData?.customerId;
  const defaultAccountType = user.defaultData?.accountId;

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
  const { mutateAsync, isPending } = useCreateSalesOrder();

  const paymentFormConfig = useMemo(
    () => getPaymentFormConfig(isAccountsEnabled),
    [isAccountsEnabled],
  );

  // Customer form (also holds payment fields)
  const customerForm = useForm({
    defaultValues: {
      customerId: defaultCustomer || customerId,
      discountType: orderDiscountType,
      discountValue: orderDiscountValue,
      accountId: defaultAccountType,
      paidAmount: 0,
      notes: notes,
    },
  });

  // Sync local additional discount with store
  useEffect(() => {
    setLocalAdditionalDiscount(additionalDiscount);
  }, [additionalDiscount]);

  // Handle inline discount change in table (direct amount)
  const handleUpdateDiscount = useCallback(
    (id: string, discountAmount: number, unitPrice: number) => {
      const salePrice = Math.max(0, unitPrice - discountAmount);
      updateItem(id, {
        discountAmount,
        salePrice,
      });
    },
    [updateItem],
  );

  // Columns with quantity controls, discount editing, and remove
  const salesColumns = useMemo(
    () =>
      getSalesColumns(
        (id, quantity) => updateItem(id, { quantity }),
        handleUpdateDiscount,
        removeItem,
        symbol,
      ),
    [updateItem, handleUpdateDiscount, removeItem, symbol],
  );

  // =====================
  // Event Handlers
  // =====================

  const handleCustomerFieldChange = useCallback(
    (fieldName: string, value: any) => {
      if (fieldName === "customerId") {
       console.log("Selected customer:", value);
        setCustomer(value);
        if (value.value) {
          customerForm.setValue("discountType", value.discountType);
          customerForm.setValue("discountValue", value.discountValue);
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
    (product: ProductApiItem) => {
      if (!product) return;
      if (product.quantity <= 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }
      const discountType = customerForm.getValues("discountType");
      const discountValue = customerForm.getValues("discountValue");
      const { discountAmount, salePrice } = applyDiscountWithPriority({
        price: product.price,
        orderDiscountType: discountType,
        orderDiscountValue: discountValue,
      });
      addItem({
        inventoryId: product._id,
        productId: product.productId,
        variantId: product.variantId,
        productName: product.name,
        quantity: 1,
        costPrice: product.costPrice,
        price: product.price,
        discountType,
        discountValue,
        discountAmount,
        salePrice,
        availableQuantity: product.quantity,
      });
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
    if (isAccountsEnabled && paidAmount > 0 && !accountId) {
      toast.error("Please select a payment account");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer for the order");
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
          unitPrice: item.price,
          costPrice: item.costPrice,
          discount: item.discountAmount,
          productName: item.productName,
        })),
        additionalDiscount: formAdditionalDiscount,
        totalPrice: totalSalePrice,
        costPrice: totalCostPrice,
        notes: notes || undefined,
      };
      if (isAccountsEnabled && accountId && paidAmount > 0) {
        orderData.payment = { paidAmount, accountId };
        orderData.dueAmount = dueAmount;
      }
      console.log("Submitting order data:", orderData);
      return
      const createResult = await mutateAsync(orderData);
      if (createResult.data?.sale?._id) {
        clearAll();
        toast.success("Order created successfully");
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
    clearAll,
    customerForm,
    localAdditionalDiscount,
  ]);

  const itemsSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalSalePrice = getTotalSalePrice();
  const dueAmount = Math.max(totalSalePrice - paidAmount, 0);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer & Product Search */}
          <Card>
            <CardContent className="pt-4 pb-3 space-y-4">
              <div>
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
              </div>
              <Separator className="my-6" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </span>
                  <h3 className="font-semibold text-sm">Add Products</h3>
                </div>
                <ProductSearch onSelect={handleProductSelect} />
              </div>
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
                    Additional Discount
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base text-muted-foreground">{symbol}</span>
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
                        className={`font-semibold tabular-nums ${dueAmount > 0
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
                <Button
                  onClick={handleMarkAsSold}
                  disabled={isPending || items.length === 0}
                  size="lg"
                  className="w-full font-semibold"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {isPending ? "Processing..." : "Confirm Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
