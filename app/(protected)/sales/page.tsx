"use client";

import {
  salesColumns,
  extractCustomerValue,
  extractProductValue,
  formatCurrency,
  getCustomerFormConfig,
  getProductFormConfig,
  type CreateSalesOrderData,
} from "@/components/sales";
import { useCreateSalesOrder } from "@/services/api";
import { useAuthStore, useSellPageStore } from "@/services/stores";
import { applyDiscountWithPriority, type DiscountType } from "@/utils/discount";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { DataTable } from "@/ui/components/dataTable";
import type { CustomAction } from "@/types/DataTable";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/components/collapsible";
import DynamicForm from "@/ui/components/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { Separator } from "@/ui/components/separator";
import { CheckCircleIcon, ChevronDown, ChevronUp, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// =====================
// Main Component
// =====================

export default function SalesPage() {
  const [isOrderOpen, setIsOrderOpen] = useState(true);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [localAdditionalDiscount, setLocalAdditionalDiscount] = useState(0);

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
    removeItem,
    clearAll,
  } = useSellPageStore();

  // API mutations
  const createOrderMutation = useCreateSalesOrder();

  // Form configurations
  const customerFormConfig = useMemo(
    () => getCustomerFormConfig(isAccountsEnabled),
    [isAccountsEnabled]
  );

  // Customer form (must be defined before productFormConfig uses it)
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

  // Product form (must be defined before productFormConfig uses it)
  const productForm = useForm({
    defaultValues: {
      productId: "",
      quantity: 1,
      costPrice: 0,
      unitPrice: 0,
      discountAmount: 0,
      salePrice: 0,
    },
  });

  // Product form config (depends on both forms being defined)
  const productFormConfig = useMemo(
    () => getProductFormConfig(customerForm, productForm),
    [customerForm, productForm]
  );

  // Sync local additional discount with store
  useEffect(() => {
    setLocalAdditionalDiscount(additionalDiscount);
  }, [additionalDiscount]);

  // =====================
  // Event Handlers
  // =====================

  /**
   * Handle customer field changes - auto-fill discount from customer
   */
  const handleCustomerFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "customerId") {
        const customer = extractCustomerValue(value);

        // Update store
        setCustomer(
          customer.value,
          customer.label,
          customer.discountType,
          customer.discountValue,
        );

        // Auto-fill discount fields when customer is selected
        if (customer.value) {
          customerForm.setValue("discountType", customer.discountType);
          customerForm.setValue("discountValue", customer.discountValue);
        }
      } else if (fieldName === "discountType") {
        // Read current discount value directly from form
        const currentDiscountValue = customerForm.getValues("discountValue");
        setOrderDiscount(value as DiscountType, currentDiscountValue);
      } else if (fieldName === "discountValue") {
        // Read current discount type directly from form
        const currentDiscountType = customerForm.getValues("discountType");
        setOrderDiscount(currentDiscountType, value as number);
      } else if (fieldName === "paidAmount") {
        // Update local state for reactive display
        setPaidAmount(value as number);
      } else if (fieldName === "notes") {
        setNotes(value as string);
      }
    },
    [customerForm, setCustomer, setOrderDiscount, setNotes],
  );

  /**
   * Handle product field changes - recalculate when unitPrice is auto-filled
   */
  const handleProductFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      // When unitPrice is auto-filled from product selection, recalculate discount and sale price
      if (fieldName === 'unitPrice' && value) {
        const currentDiscountType = customerForm.getValues("discountType");
        const currentDiscountValue = customerForm.getValues("discountValue");
        const { discountAmount, salePrice } = applyDiscountWithPriority({
          unitPrice: value as number,
          orderDiscountType: currentDiscountType,
          orderDiscountValue: currentDiscountValue,
        });
        productForm.setValue("discountAmount", discountAmount);
        productForm.setValue("salePrice", salePrice);
      }
    },
    [customerForm, productForm],
  );

  /**
   * Handle add to order
   */
  const handleAddToOrder = useCallback(
    (data: any) => {
      const product = extractProductValue(data.productId);
      if (!product) {
        toast.error("Please select a product");
        return;
      }

      // Validate quantity
      if (data.quantity > product.availableQuantity) {
        toast.error(`Only ${product.availableQuantity} items available`);
        return;
      }

      // Add item to store
      addItem({
        inventoryId: product.value,
        productId: product.productId,
        variantId: product.variantId,
        productName: product.label,
        quantity: data.quantity,
        costPrice: data.costPrice,
        unitPrice: data.unitPrice,
        discountType: customerForm.getValues("discountType"),
        discountValue: customerForm.getValues("discountValue"),
        discountAmount: data.discountAmount,
        salePrice: data.salePrice,
        availableQuantity: product.availableQuantity,
      });

      toast.success(`${product.label} added to order`);

      // Reset product form
      productForm.reset({
        productId: "",
        quantity: 1,
        costPrice: 0,
        unitPrice: 0,
        discountAmount: 0,
        salePrice: 0,
      });
    },
    [addItem, productForm, customerForm],
  );

  /**
   * Handle mark as sold
   */
  const handleMarkAsSold = useCallback(async () => {
    if (items.length === 0) {
      toast.error("Please add items to the order");
      return;
    }

    // Get form values
    const accountId = customerForm.getValues("accountId");
    const paidAmount = customerForm.getValues("paidAmount") || 0;
    const formAdditionalDiscount = localAdditionalDiscount;

    // Extract account ID if it's an object
    const extractedAccountId =
      typeof accountId === "object" &&
        accountId !== null &&
        "value" in accountId
        ? accountId.value
        : typeof accountId === "string"
          ? accountId
          : null;

    // Validate: if accounts enabled and payment provided, accountId is required
    if (isAccountsEnabled && paidAmount > 0 && !extractedAccountId) {
      toast.error("Please select a payment account");
      return;
    }

    try {
      const totalSalePrice = getTotalSalePrice();
      const totalCostPrice = getTotalCostPrice();
      const dueAmount = Math.max(totalSalePrice - paidAmount, 0);

      // Prepare order data
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

      // Add payment info if accounts enabled and payment is provided
      if (isAccountsEnabled && extractedAccountId && paidAmount > 0) {
        orderData.payment = {
          paidAmount,
          accountId: extractedAccountId,
        };
        orderData.dueAmount = dueAmount;
      }

      // Create and complete order
      const createResult = await createOrderMutation.mutateAsync(orderData);

      if (createResult.data?._id) {
        // Show success
        setShowSuccessPopover(true);
        setTimeout(() => setShowSuccessPopover(false), 3000);

        // Reset all
        clearAll();
        customerForm.reset({
          customerId: null,
          discountType: "percentage",
          discountValue: 0,
          accountId: null,
          paidAmount: 0,
          notes: "",
        });
        productForm.reset();
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
    productForm,
    localAdditionalDiscount,
  ]);

  const isLoading = createOrderMutation.isPending;

  // Custom actions for removing items
  const customActions: CustomAction[] = useMemo(
    () => [
      {
        type: "remove",
        placement: "cell",
        variant: "destructive",
        icon: <Trash2 className="h-2 w-2" />,
        onClick: (row) => removeItem(row.id),
      },
    ],
    [removeItem]
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Sales</h1>
        <p className="text-muted-foreground">
          Create a new sale and record stock movement
        </p>
      </div>

      {/* Section 1: Customer & Order Discount */}
     
          <DynamicForm
            form={customerForm}
            config={customerFormConfig}
            onFieldChange={handleCustomerFieldChange}
            hideCancel
          />

      {/* Section 2: Product Selection */}
   
          <DynamicForm
            form={productForm}
            config={productFormConfig}
            onSubmit={handleAddToOrder}
            onFieldChange={handleProductFieldChange}
            submitLabel="Add to Order"
            hideCancel
          />
     

      {/* Section 4: Order Summary */}
      {items.length > 0 && (
        <Card>
          <Collapsible open={isOrderOpen} onOpenChange={setIsOrderOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {customerName || "Walk-in Customer"}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({items.length} item{items.length !== 1 ? "s" : ""})
                    </span>
                  </CardTitle>
                  {isOrderOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent>
                {/* Items Table */}
                <DataTable
                  cardTitle=""
                  columns={salesColumns as any}
                  data={items as any}
                  customActions={customActions}
                />

                <Separator className="my-4" />

                {/* Summary Footer */}
                <div className="space-y-3">
                  {/* Items Subtotal */}
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-muted-foreground">
                      Items Subtotal
                    </span>
                    <span className="font-medium">{formatCurrency(items.reduce((sum, item) => sum + item.total, 0))}</span>
                  </div>

                  {/* Additional Discount Input */}
                  <div className="flex justify-between items-center gap-4 py-2 px-3 bg-muted/50 rounded-lg">
                    <label htmlFor="additionalDiscount" className="text-sm font-medium text-foreground">
                      Additional Discount
                    </label>
                    <input
                      id="additionalDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={localAdditionalDiscount}
                      onChange={(e) => {
                        const value = Math.max(0, Number(e.target.value) || 0);
                        setLocalAdditionalDiscount(value);
                        setAdditionalDiscount(value);
                      }}
                      placeholder="0"
                      className="w-32 px-3 py-2 text-sm border border-input bg-background rounded-md text-right focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                  </div>

                  <Separator className="my-2" />

                  {/* Total Sale Price (After Discount) */}
                  <div className="flex justify-between items-center py-3 px-4 bg-primary/10 rounded-lg">
                    <span className="text-lg font-bold text-foreground">Total Sale Price</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(getTotalSalePrice())}
                    </span>
                  </div>

                  {/* Total Cost Price */}
                  <div className="flex justify-between text-sm py-2 px-2">
                    <span className="text-muted-foreground">
                      Total Cost Price
                    </span>
                    <span className="font-medium text-muted-foreground">{formatCurrency(getTotalCostPrice())}</span>
                  </div>

                  {/* Payment Info - only show if accounts enabled */}
                  {isAccountsEnabled && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 px-2">
                          <span className="text-sm text-muted-foreground">
                            Paid Amount
                          </span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                            {formatCurrency(paidAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 px-2">
                          <span className="text-sm text-muted-foreground">
                            Due Amount
                          </span>
                          <span className="text-sm font-semibold text-orange-600 dark:text-orange-500">
                            {formatCurrency(
                              Math.max(
                                getTotalSalePrice() - (paidAmount || 0),
                                0,
                              ),
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Actions */}
                <div className="flex gap-3">
                  <Popover open={showSuccessPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        onClick={handleMarkAsSold}
                        disabled={isLoading || items.length === 0}
                        className="flex-1 text-base font-semibold"
                      >
                        {isLoading ? "Processing..." : "Mark as Sold"}
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
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    disabled={isLoading}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}
