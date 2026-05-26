"use client";

import { getSalesColumns, formatCurrency, getPaymentFormConfig, ProductSearch, type CreateSalesOrderData, customerFormConfig, ProductApiItem, ExtractedProduct } from "@/components/sales";
import { useCreateSalesOrder, useCustomerPendingDues } from "@/services/api";
import { useAuthStore, useSellPageStore } from "@/services/stores";
import { applyDiscountWithPriority, type DiscountType } from "@/utils/discount";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { CardTable } from "@/ui/components/custom/card-table";
import DynamicForm from "@/ui/components/form";
import { Input } from "@/ui/components/input";
import { Separator } from "@/ui/components/separator";
import { Switch } from "@/ui/components/switch";
import { Label } from "@/ui/components/label";
import { CheckCircleIcon, ClipboardList, WalletIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";

export default function SalesPage() {
  const [paidAmount, setPaidAmount] = useState(0);
  const [localAdditionalDiscount, setLocalAdditionalDiscount] = useState(0);
  const [useCreditBalance, setUseCreditBalance] = useState(false);
  const [creditBalanceAmount, setCreditBalanceAmount] = useState(0);
  const { symbol } = useCurrency();

  // Get organization features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const defaultCustomer = user?.defaultData?.customerId;
  const defaultAccountType = user?.defaultData?.accountId;

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

  // Customer outstanding due + store credit (reused from refund-allocation endpoint)
  const { data: pendingDuesResp } = useCustomerPendingDues(customerId || "");
  const customerInfo = (pendingDuesResp as any)?.data ?? {};
  const customerOutstandingDue: number = customerInfo.totalDue ?? 0;
  const customerCreditBalance: number = customerInfo.creditBalance ?? 0;

  const paymentFormConfig = useMemo(
    () => getPaymentFormConfig(isAccountsEnabled),
    [isAccountsEnabled],
  );

  // Customer form (also holds payment fields)
  const customerForm = useForm({
    defaultValues: {
      customerId: defaultCustomer,
      accountId: defaultAccountType,
      discountType: orderDiscountType || "percentage",
      discountValue: orderDiscountValue || 0,
      paidAmount: 0,
      notes: notes,
    },
  });

  // Sync local additional discount with store
  useEffect(() => {
    setLocalAdditionalDiscount(additionalDiscount);
  }, [additionalDiscount]);

  // Auto-fill paid amount with total sale price minus credit applied
  useEffect(() => {
    const total = Number(getTotalSalePrice().toFixed(2) || 0);
    const remaining = Math.max(0, total - creditBalanceAmount);
    setPaidAmount(remaining);
    customerForm.setValue("paidAmount", remaining);
  }, [items, additionalDiscount, creditBalanceAmount, getTotalSalePrice, customerForm]);

  // When customer changes, reset credit selection
  useEffect(() => {
    setUseCreditBalance(false);
    setCreditBalanceAmount(0);
  }, [customerId]);

  // Cap credit applied to min(creditBalance, total)
  useEffect(() => {
    const total = getTotalSalePrice();
    const cap = Math.min(customerCreditBalance, total);
    if (!useCreditBalance) {
      if (creditBalanceAmount !== 0) setCreditBalanceAmount(0);
      return;
    }
    if (creditBalanceAmount > cap) setCreditBalanceAmount(cap);
    else if (creditBalanceAmount === 0 && cap > 0) setCreditBalanceAmount(cap);
  }, [useCreditBalance, customerCreditBalance, items, additionalDiscount, getTotalSalePrice, creditBalanceAmount]);

  // Recalculate all item discounts when customer discount changes
  useEffect(() => {
    if (items.length === 0) return;
    items.forEach((item) => {
      const { discount, salePrice } = applyDiscountWithPriority({
        price: item.price,
        orderDiscountType: orderDiscountType,
        orderDiscountValue: orderDiscountValue,
      });
      if (item.discount !== discount || item.salePrice !== salePrice) {
        updateItem(item.id, { discount, salePrice });
      }
    });
    // Only react to discount type/value changes, not items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderDiscountType, orderDiscountValue, updateItem]);

  // Handle inline discount change in table (direct amount)
  const handleUpdateDiscount = useCallback(
    (id: string, discount: number, price: number) => {
      const salePrice = Math.max(0, price - discount);
      updateItem(id, {
        discount,
        salePrice,
      });
    },
    [updateItem],
  );

  // Columns with quantity controls, discount editing, and remove
  const salesColumns = useMemo(() =>
    getSalesColumns(
      (id, quantity) => updateItem(id, { quantity }),
      handleUpdateDiscount,
      removeItem,
      symbol,
    ),
    [updateItem, handleUpdateDiscount, removeItem, symbol]);


  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (fieldName === "customerId") {
      setCustomer(value);
    } else if (fieldName === "discountType") {
      const currentDiscountValue = customerForm.getValues("discountValue");
      setOrderDiscount(value as DiscountType, currentDiscountValue);
    } else if (fieldName === "discountValue") {
      const currentDiscountType = customerForm.getValues("discountType");
      setOrderDiscount(currentDiscountType, value as number);
    }
    else if (fieldName === "paidAmount") {
      setPaidAmount(value as number);
    } else if (fieldName === "notes") {
      setNotes(value as string);
    }
  },
    [customerForm, setCustomer, setNotes, setOrderDiscount],
  );


  const handleProductSelect = useCallback(
    (product: ExtractedProduct) => {
      if (!product) return;
      if (product.availableQuantity <= 0) {
        toast.error(`${product.label} is out of stock`);
        return;
      }

      const { value: inventoryId, label: productName, price, costPrice, productId, variantId, availableQuantity } = product;
      const discountType = customerForm.getValues("discountType");
      const discountValue = customerForm.getValues("discountValue");
      const { discount, salePrice } = applyDiscountWithPriority({
        price: product.price,
        orderDiscountType: discountType,
        orderDiscountValue: discountValue,
      });
      addItem({
        inventoryId, productId, variantId, productName, quantity: 1, costPrice, price, discountType, discountValue, discount, salePrice, availableQuantity, unitName: product.unitName, saleUnitName: product.saleUnitName,
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
    let updatedCustomerId = customerForm.getValues("customerId") as any;
    updatedCustomerId = updatedCustomerId?.value || updatedCustomerId || customerId
    const paidAmount = customerForm.getValues("paidAmount") || 0;
    const formAdditionalDiscount = localAdditionalDiscount;
    if (isAccountsEnabled && paidAmount > 0 && !accountId) {
      toast.error("Please select a payment account");
      return;
    }
    if (!updatedCustomerId) {
      toast.error("Please select a customer for the order");
      return;
    }
    try {
      const totalSalePrice = getTotalSalePrice();
      const totalCostPrice = getTotalCostPrice();
      const creditApplied = useCreditBalance ? Math.min(creditBalanceAmount, customerCreditBalance, totalSalePrice) : 0;
      const dueAmount = Math.max(totalSalePrice - paidAmount - creditApplied, 0);
      const orderData: CreateSalesOrderData = {
        customerId: updatedCustomerId,
        items: items.map((item) => ({
          productId: item.productId,
          inventoryId: item.inventoryId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          costPrice: item.costPrice,
          discount: item.discount,
          productName: item.productName,
        })),
        additionalDiscount: formAdditionalDiscount,
        totalPrice: totalSalePrice,
        costPrice: totalCostPrice,
        notes,
      };
      if (isAccountsEnabled && accountId && paidAmount > 0) {
        orderData.payment = { paidAmount, accountId };
        orderData.dueAmount = dueAmount;
      }
      if (isAccountsEnabled && creditApplied > 0) {
        orderData.creditBalanceAmount = creditApplied;
        orderData.dueAmount = dueAmount;
      }
      const createResult = await mutateAsync(orderData);
      if (createResult.data?.sale?._id) {
        clearAll();
        customerForm.reset({
          paidAmount: 0,
          notes: "",
        });
        setPaidAmount(0);
        setLocalAdditionalDiscount(0);
        setUseCreditBalance(false);
        setCreditBalanceAmount(0);
      }
    } catch (error) {
      console.error("Failed to complete sale:", error);
      toast.error("Failed to complete sale");
    }
  }, [items, customerId, notes, isAccountsEnabled, getTotalSalePrice, getTotalCostPrice, clearAll, customerForm, localAdditionalDiscount, useCreditBalance, creditBalanceAmount, customerCreditBalance, mutateAsync]);

  const itemsSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalSalePrice = getTotalSalePrice();
  const appliedCredit = useCreditBalance
    ? Math.min(creditBalanceAmount, customerCreditBalance, totalSalePrice)
    : 0;
  const dueAmount = Math.max(totalSalePrice - paidAmount - appliedCredit, 0);
  const showCustomerBalances = !!customerId && (customerOutstandingDue > 0 || customerCreditBalance > 0);
  const maxCreditApplicable = Math.min(customerCreditBalance, totalSalePrice);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                  onFieldChange={handleFieldChange}
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

                {/* Customer balance chips */}
                {showCustomerBalances && (
                  <div className="flex flex-wrap gap-2 -mt-1">
                    {customerOutstandingDue > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                        Due: {formatCurrency(customerOutstandingDue)}
                      </span>
                    )}
                    {customerCreditBalance > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <WalletIcon className="h-3 w-3" />
                        Credit: {formatCurrency(customerCreditBalance)}
                      </span>
                    )}
                  </div>
                )}

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
                        // Sync paidAmount immediately to prevent payment summary flicker.
                        // Zustand updates are synchronous, so getTotalSalePrice() already
                        // reflects the new discount — no need to wait for the useEffect.
                        const newTotal = getTotalSalePrice();
                        const remaining = Math.max(0, newTotal - creditBalanceAmount);
                        setPaidAmount(remaining);
                        customerForm.setValue("paidAmount", remaining);
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
                  onFieldChange={handleFieldChange}
                  hideCancel
                />

                {/* Store credit application */}
                {isAccountsEnabled && customerCreditBalance > 0 && totalSalePrice > 0 && (
                  <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="use-store-credit" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <WalletIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Use store credit
                      </Label>
                      <Switch
                        id="use-store-credit"
                        checked={useCreditBalance}
                        onCheckedChange={(checked) => {
                          setUseCreditBalance(checked);
                          if (!checked) setCreditBalanceAmount(0);
                          else setCreditBalanceAmount(maxCreditApplicable);
                        }}
                      />
                    </div>
                    {useCreditBalance && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Available {formatCurrency(customerCreditBalance)}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          max={maxCreditApplicable}
                          step="0.01"
                          value={creditBalanceAmount}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(maxCreditApplicable, Number(e.target.value) || 0));
                            setCreditBalanceAmount(v);
                          }}
                          className="w-28 h-8 text-right text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Summary */}
                {isAccountsEnabled && (paidAmount > 0 || appliedCredit > 0) && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="font-semibold text-green-600 dark:text-green-500 tabular-nums">
                        {formatCurrency(paidAmount)}
                      </span>
                    </div>
                    {appliedCredit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Store credit applied</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          −{formatCurrency(appliedCredit)}
                        </span>
                      </div>
                    )}
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
