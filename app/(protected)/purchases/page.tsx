"use client";

import { getPurchaseColumns, getSupplierFormConfig, getProductFormConfig, getPaymentFormConfig, extractSupplierValue, SupplierFormData, ImportLowStockDialog, type ImportedLowStockItem } from "@/components/purchases";
import { extractProductValue } from "@/components/sales";
import { useCurrency } from "@/lib/currency";
import { useCreatePurchaseOrder, useDashboardStats } from "@/services/api";
import {
  type PurchaseOrderItem,
  useAuthStore,
  usePurchasePageStore,
} from "@/services/stores";
import type {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderItemDto,
} from "@/types";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import { CardTable } from "@/ui/components/custom/card-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import DynamicForm from "@/ui/components/form";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Separator } from "@/ui/components/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircleIcon,
  ClipboardList,
  Download,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const productFormSchema = z.object({
  productId: z.union([
    z.string().min(1, "Product is required"),
    z.object({
      label: z.string(),
      value: z.string(),
      price: z.number().optional(),
      conversionFactor: z.number().optional(),
      productId: z.string().optional(),
      variantId: z.string().nullable().optional(),
    }),
  ]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  convertedQuantity: z.number().min(0),
  price: z.number().min(0),
  discount: z.number().min(0),
  costPrice: z.number().min(0),
  rememberCostPrice: z.boolean().optional(),
});

export default function PurchasesPage() {
  const { format: formatCurrency, symbol } = useCurrency();

  // Edit dialog state
  const [editingItem, setEditingItem] = useState<PurchaseOrderItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);

  // Auto-open import dialog if redirected from low stock page.
  // Read sessionStorage synchronously via lazy initializers so we never
  // call setState() inside an effect just to bootstrap initial UI state.
  const lowStockImport = useMemo<{ ids: string[]; shouldOpen: boolean }>(() => {
    if (typeof window === "undefined") return { ids: [], shouldOpen: false };
    try {
      const stored = sessionStorage.getItem("lowstock-import-ids");
      if (!stored) return { ids: [], shouldOpen: false };
      sessionStorage.removeItem("lowstock-import-ids");
      const ids = JSON.parse(stored) as string[];
      if (Array.isArray(ids) && ids.length > 0) {
        return { ids, shouldOpen: true };
      }
    } catch {
      // ignore invalid data
    }
    return { ids: [], shouldOpen: false };
  }, []);

  // Import low stock dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(
    () => lowStockImport.shouldOpen,
  );
  const [preSelectedLowStockIds, setPreSelectedLowStockIds] = useState<string[]>(
    () => lowStockImport.ids,
  );

  // Dashboard stats for low stock badge count
  const { data: dashboardData } = useDashboardStats();
  const lowStockCount = dashboardData?.data?.variants?.lowStock || 0;

  // Get organization features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const isUOMEnabled = user?.organization?.features?.uomConversion ?? false;

  // Store state
  const {
    sellers,
    activeSellerIndex,
    getSellerSubtotal,
    getSellerTotal,
    getSellerNetAmount,
    getSellerDueAmount,
    getGrandTotal,
    getTotalItemCount,
    addSeller,
    removeSeller,
    setActiveSeller,
    setSupplier,
    setPurchaseType,
    setPaymentInfo,
    setNotes,
    setAdditionalDiscount,
    setInvoiceAmount,
    setInvoiceNumber,
    setInvoiceDate,
    setDiscountType,
    setDiscountValue,
    addItem,
    updateItem,
    removeItem,
    clearSellerItems,
    clearAll,
  } = usePurchasePageStore();

  const activeSeller = sellers[activeSellerIndex];

  // API mutations
  const { mutateAsync, isPending } = useCreatePurchaseOrder();

  const supplierFormConfig = useMemo(() => getSupplierFormConfig(), []);
  const productFormConfig = useMemo(() => getProductFormConfig(isUOMEnabled), [isUOMEnabled]);
  const paymentFormConfig = useMemo(() => getPaymentFormConfig(isAccountsEnabled), [isAccountsEnabled]);

  const supplierForm = useForm({
    defaultValues: {
      supplierId: activeSeller?.supplierId
        ? { value: activeSeller.supplierId, label: activeSeller.supplierName || "" }
        : null,
      purchaseType: activeSeller?.purchaseType || "instant",
      discountType: activeSeller?.discountType || "fixed",
      discountValue: activeSeller?.discountValue || 0,
      invoiceNumber: activeSeller?.invoiceNumber || "",
      invoiceDate: activeSeller?.invoiceDate || "",
    },
  });
  
  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      convertedQuantity: 1,
      price: 0,
      discount: 0,
      costPrice: 0,
      rememberCostPrice: false,
    },
  });

  const paymentForm = useForm({
    defaultValues: {
      accountId: null as any,
      paidAmount: 0,
      notes: activeSeller?.notes || "",
    },
  });

  // Edit product form
  const editForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      convertedQuantity: 1,
      price: 0,
      discount: 0,
      costPrice: 0,
      rememberCostPrice: false,
    },
  });

  // Watch edit form values for reactive updates
  const editQuantity = useWatch({ control: editForm.control, name: "quantity", defaultValue: 1 });
  const editConvertedQuantity = useWatch({ control: editForm.control, name: "convertedQuantity", defaultValue: 1 });
  const editPrice = useWatch({ control: editForm.control, name: "price", defaultValue: 0 });
  const editDiscount = useWatch({ control: editForm.control, name: "discount", defaultValue: 0 });
  const editCostPrice = useWatch({ control: editForm.control, name: "costPrice", defaultValue: 0 });
  const editRememberCostPrice = useWatch({ control: editForm.control, name: "rememberCostPrice", defaultValue: false });

  // =====================
  // Table Columns
  // =====================

  const handleEditItem = useCallback(
    (sellerId: string, item: PurchaseOrderItem) => {
      setEditingItem(item);
      setEditingSellerId(sellerId);

      const convertedQuantity = item.convertedQuantity || item.quantity;
      const boxPrice = item.price;

      editForm.reset({
        productId: {
          value: item.inventoryId,
          label: item.productName,
          price: boxPrice,
          conversionFactor: item.conversionFactor || 1,
          productId: item.productId,
          variantId: item.variantId,
        },
        quantity: item.quantity,
        convertedQuantity,
        price: boxPrice,
        discount: item.discount,
        costPrice: item.costPrice,
        rememberCostPrice: false,
      });

      setIsEditDialogOpen(true);
    },
    [editForm],
  );

  // =====================
  // Event Handlers
  // =====================

  const handleSupplierFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (!activeSeller) return;

      if (fieldName === "supplierId") {
        const supplier = extractSupplierValue(value as SupplierFormData["supplierId"]);

        if (activeSeller.items.length > 0 && supplier.value !== activeSeller.supplierId) {
          const existingSellerIndex = sellers.findIndex((s) => s.supplierId === supplier.value);
          if (existingSellerIndex !== -1) {
            setActiveSeller(existingSellerIndex);
          } else {
            const newSellerId = addSeller();
            setSupplier(newSellerId, supplier.value, supplier.label);
          }
        } else {
          setSupplier(activeSeller.id, supplier.value, supplier.label);
        }
        setDiscountType(activeSeller.id, supplier.defaultDiscountType);
        setDiscountValue(activeSeller.id, supplier.defaultDiscountValue);
        supplierForm.setValue("discountType", supplier.defaultDiscountType);
        supplierForm.setValue("discountValue", supplier.defaultDiscountValue);
      } else if (fieldName === "discountType") {
        setDiscountType(activeSeller.id, value as "percentage" | "fixed");
      } else if (fieldName === "discountValue") {
        setDiscountValue(activeSeller.id, value as number);
      } else if (fieldName === "purchaseType") {
        setPurchaseType(activeSeller.id, value as "instant" | "order");
      } else if (fieldName === "invoiceNumber") {
        setInvoiceNumber(activeSeller.id, value as string);
      } else if (fieldName === "invoiceDate") {
        setInvoiceDate(activeSeller.id, value as string);
      }
    },
    [
      activeSeller,
      sellers,
      addSeller,
      setActiveSeller,
      setSupplier,
      setPurchaseType,
      setInvoiceNumber,
      setInvoiceDate,
      setDiscountType,
      setDiscountValue,
      supplierForm,
    ],
  );

  const handleProductFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "productId") {
        const product = extractProductValue(value);
        if (product) {
          const quantity = productForm.getValues("quantity") || 1;
          const conversionFactor = product.conversionFactor || 1;
          const convertedQuantity = quantity * conversionFactor;
          const perUnitPrice = product.price;
          const boxPrice = perUnitPrice * conversionFactor;

          const discountType = supplierForm.getValues("discountType") || "fixed";
          const discountValue = supplierForm.getValues("discountValue") || 0;

          let boxDiscount = 0;
          if (discountType === "percentage") {
            boxDiscount = (boxPrice * discountValue) / 100;
          } else {
            boxDiscount = discountValue;
          }

          const boxCostPrice = Math.max(0, boxPrice - boxDiscount);

          productForm.setValue("convertedQuantity", convertedQuantity);
          productForm.setValue("price", boxPrice);
          productForm.setValue("discount", boxDiscount);
          productForm.setValue("costPrice", boxCostPrice);
        }
      } else if (fieldName === "quantity") {
        const product = extractProductValue(productForm.getValues("productId"));
        if (product) {
          const quantity = (value as number) || 1;
          const conversionFactor = product.conversionFactor || 1;
          productForm.setValue("convertedQuantity", quantity * conversionFactor);
        }
      } else if (fieldName === "discount") {
        const boxPrice = productForm.getValues("price") || 0;
        const boxDiscount = (value as number) || 0;
        productForm.setValue("costPrice", Math.max(0, boxPrice - boxDiscount));
      } else if (fieldName === "costPrice") {
        const boxPrice = productForm.getValues("price") || 0;
        const boxCostPrice = (value as number) || 0;
        productForm.setValue("discount", Math.max(0, boxPrice - boxCostPrice));
      }
    },
    [productForm, supplierForm],
  );

  const handlePaymentFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (!activeSeller) return;

      if (fieldName === "notes") {
        setNotes(activeSeller.id, value as string);
      } else if (fieldName === "paidAmount" || fieldName === "accountId") {
        const currentPaid = paymentForm.getValues("paidAmount") || 0;
        const currentAccount = paymentForm.getValues("accountId");
        const extractedAccountId =
          typeof currentAccount === "object" && currentAccount !== null
            ? currentAccount.value
            : typeof currentAccount === "string"
              ? currentAccount
              : "";

        if (extractedAccountId && currentPaid > 0) {
          setPaymentInfo(activeSeller.id, {
            paymentMethod: "cash",
            accountId: extractedAccountId,
            paidAmount: currentPaid,
          });
        } else {
          setPaymentInfo(activeSeller.id, null);
        }
      }
    },
    [activeSeller, paymentForm, setNotes, setPaymentInfo],
  );

  const handleAddToOrder = useCallback(
    (data: z.infer<typeof productFormSchema>) => {
      const supplierValue = supplierForm.getValues("supplierId");
      const supplier = extractSupplierValue(supplierValue);

      if (!supplier.value) {
        toast.error("Please select a supplier first");
        return;
      }

      const storeState = usePurchasePageStore.getState();
      let currentSeller = storeState.sellers[storeState.activeSellerIndex];

      if (!currentSeller || currentSeller.supplierId !== supplier.value) {
        const existingSellerIndex = storeState.sellers.findIndex(
          (s) => s.supplierId === supplier.value,
        );

        if (existingSellerIndex !== -1) {
          setActiveSeller(existingSellerIndex);
          currentSeller = storeState.sellers[existingSellerIndex];
        } else if (currentSeller && currentSeller.items.length === 0) {
          setSupplier(currentSeller.id, supplier.value, supplier.label);
        } else {
          const newSellerId = addSeller();
          setSupplier(newSellerId, supplier.value, supplier.label);
          const newState = usePurchasePageStore.getState();
          currentSeller = newState.sellers[newState.activeSellerIndex];
        }
      }

      const product = extractProductValue(data.productId);
      if (!product) {
        toast.error("Please select a product");
        return;
      }

      const conversionFactor = product.conversionFactor || 1;
      const boxPrice = product.price * conversionFactor;

      addItem(currentSeller.id, {
        inventoryId: product.value,
        productId: product.productId,
        variantId: product.variantId,
        productName: product.label,
        quantity: data.quantity,
        price: boxPrice,
        costPrice: data.costPrice,
        discount: data.discount,
        conversionFactor,
        convertedQuantity: data.convertedQuantity,
      });

      toast.success(`${product.label} added to order`);

      productForm.reset({
        productId: "",
        quantity: 1,
        convertedQuantity: 1,
        price: 0,
        discount: 0,
        costPrice: 0,
        rememberCostPrice: false,
      });
    },
    [addItem, productForm, supplierForm, setActiveSeller, setSupplier, addSeller],
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingItem || !editingSellerId) return;

    const data = editForm.getValues();
    updateItem(editingSellerId, editingItem.id, {
      quantity: data.quantity,
      discount: data.discount,
      costPrice: data.costPrice,
      convertedQuantity: data.convertedQuantity,
    });

    toast.success("Item updated successfully");
    setIsEditDialogOpen(false);
    setEditingItem(null);
    setEditingSellerId(null);
  }, [editingItem, editingSellerId, editForm, updateItem]);

  const handleEditFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "quantity") {
        const product = extractProductValue(editForm.getValues("productId"));
        if (product) {
          const quantity = (value as number) || 1;
          const conversionFactor = product.conversionFactor || 1;
          editForm.setValue("convertedQuantity", quantity * conversionFactor);
        }
      } else if (fieldName === "discount") {
        const boxPrice = editForm.getValues("price") || 0;
        const boxDiscount = (value as number) || 0;
        editForm.setValue("costPrice", Math.max(0, boxPrice - boxDiscount));
      }
    },
    [editForm],
  );

  const handleImportLowStock = useCallback(
    (importedItems: ImportedLowStockItem[]) => {
      const supplierValue = supplierForm.getValues("supplierId");
      const supplier = extractSupplierValue(supplierValue);

      if (!supplier.value) {
        toast.error("Please select a supplier first");
        return;
      }

      const storeState = usePurchasePageStore.getState();
      let currentSeller = storeState.sellers[storeState.activeSellerIndex];

      if (!currentSeller || currentSeller.supplierId !== supplier.value) {
        const existingSellerIndex = storeState.sellers.findIndex(
          (s) => s.supplierId === supplier.value,
        );

        if (existingSellerIndex !== -1) {
          setActiveSeller(existingSellerIndex);
          currentSeller = storeState.sellers[existingSellerIndex];
        } else if (currentSeller && currentSeller.items.length === 0) {
          setSupplier(currentSeller.id, supplier.value, supplier.label);
        } else {
          const newSellerId = addSeller();
          setSupplier(newSellerId, supplier.value, supplier.label);
          const newState = usePurchasePageStore.getState();
          currentSeller = newState.sellers[newState.activeSellerIndex];
        }
      }
      let addedCount = 0;
      for (const item of importedItems) {
        addItem(currentSeller.id, {
          inventoryId: item.inventoryId,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          costPrice: item.costPrice,
          discount: item.discount,
          conversionFactor: item.conversionFactor,
          convertedQuantity: item.convertedQuantity,
        });
        addedCount++;
      }

      toast.success(`${addedCount} ${addedCount === 1 ? "product" : "products"} imported to order`);
    },
    [addItem, supplierForm, setActiveSeller, setSupplier, addSeller],
  );

  const handleCompleteOrder = useCallback(async () => {
    const validSellers = sellers.filter((s) => s.items.length > 0 && s.supplierId);
    if (validSellers.length === 0) {
      toast.error("Please add items to at least one supplier");
      return;
    }

    const accountId = paymentForm.getValues("accountId");
    const paidAmount = paymentForm.getValues("paidAmount") || 0;
    const extractedAccountId =
      typeof accountId === "object" && accountId !== null && "value" in accountId
        ? accountId.value
        : typeof accountId === "string"
          ? accountId
          : null;

    try {
      const ordersData: CreatePurchaseOrderDto[] = validSellers.map((seller) => {
        const items: CreatePurchaseOrderItemDto[] = seller.items.map((item) => {
          const conversionFactor = item.conversionFactor || 1;
          const perUnitPrice = item.price / conversionFactor;
          const perUnitCostPrice = item.costPrice / conversionFactor;
          const perUnitDiscount = item.discount / conversionFactor;

          const itemDto: CreatePurchaseOrderItemDto = {
            productId: item.productId,
            variantId: item.variantId,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            price: perUnitPrice,
            costPrice: perUnitCostPrice,
            discount: perUnitDiscount,
            productName: item.productName,
          };

          if (item.conversionFactor && item.conversionFactor !== 1) {
            itemDto.conversionFactor = item.conversionFactor;
          }

          return itemDto;
        });

        const status = seller.purchaseType === "instant" ? "received" : "ordered";
        const netAmount = getSellerNetAmount(seller.id);

        const orderData: CreatePurchaseOrderDto = {
          supplierId: seller.supplierId || "",
          items,
          additionalDiscount: seller.additionalDiscount || 0,
          status,
          invoiceNumber: seller.invoiceNumber || undefined,
          invoiceDate: seller.invoiceDate || undefined,
          taxTotal: 0,
          notes: seller.notes || undefined,
        };

        if (isAccountsEnabled && extractedAccountId && paidAmount > 0) {
          orderData.payment = {
            paymentMethod: "cash",
            accountId: extractedAccountId,
            paidAmount: Math.min(paidAmount, netAmount),
          };
        }

        return orderData;
      });
      console.log("Submitting orders:", ordersData);
      

      await mutateAsync(ordersData);

      clearAll();
      supplierForm.reset({
        supplierId: null,
        purchaseType: "instant",
        discountType: "fixed",
        discountValue: 0,
        invoiceNumber: "",
        invoiceDate: "",
      });
      productForm.reset();
      paymentForm.reset({
        accountId: null,
        paidAmount: 0,
        notes: "",
      });
    } catch (error) {
      console.error("Failed to complete purchase:", error);
      toast.error("Failed to complete purchase");
    }
  }, [
    sellers,
    paymentForm,
    isAccountsEnabled,
    getSellerNetAmount,
    mutateAsync,
    clearAll,
    supplierForm,
    productForm,
  ]);

  // =====================
  // Computed Values
  // =====================

  const sellersWithItems = useMemo(
    () => sellers.filter((s) => s.items.length > 0),
    [sellers],
  );

  const totalItemCount = getTotalItemCount();
  const grandTotal = getGrandTotal();
  const paidAmount = activeSeller?.paymentInfo?.paidAmount || 0;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Supplier & Purchase Settings */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  1
                </span>
                <h3 className="font-semibold text-sm">Select Supplier</h3>
              </div>
              <DynamicForm
                form={supplierForm}
                config={supplierFormConfig}
                onFieldChange={handleSupplierFieldChange}
                hideCancel
              />
            </CardContent>
          </Card>

          {/* Step 2: Add Products */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </span>
                  <h3 className="font-semibold text-sm">Add Products</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportDialogOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Import Low Stock
                  {lowStockCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-[10px] rounded-full">
                      {lowStockCount}
                    </Badge>
                  )}
                </Button>
              </div>
              <DynamicForm
                form={productForm}
                config={productFormConfig}
                onSubmit={handleAddToOrder}
                onFieldChange={handleProductFieldChange}
                submitLabel="Add to Order"
                hideCancel
              />
            </CardContent>
          </Card>

          {/* Step 3: Order Items per Supplier */}
          {sellersWithItems.map((seller) => (
            <Card key={seller.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      3
                    </span>
                    <h3 className="font-semibold text-sm">
                      {seller.supplierName || "—"}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {seller.items.length} {seller.items.length === 1 ? "item" : "items"}
                    </Badge>
                    <Badge className="text-xs bg-primary/15 text-primary hover:bg-primary/20 border-0">
                      {seller.purchaseType === "instant" ? "Instant" : "Order"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      {formatCurrency(getSellerNetAmount(seller.id))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Remove all items for this supplier?")) {
                          removeSeller(seller.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive text-xs h-7"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <CardTable
                  columns={getPurchaseColumns(
                    handleEditItem,
                    removeItem,
                    formatCurrency,
                    seller.id,
                    isUOMEnabled,
                  )}
                  data={seller.items}
                  emptyMessage="No items added yet"
                  showCard={false}
                />

                {/* Per-seller summary */}
                <div className="mt-3 space-y-2">
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (Cost Price)</span>
                    <span className="tabular-nums">{formatCurrency(getSellerSubtotal(seller.id))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Additional Discount</span>
                    <div className="flex items-center gap-1">
                      <span className="text-base text-muted-foreground">{symbol}</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={seller.additionalDiscount || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setAdditionalDiscount(seller.id, value);
                        }}
                        placeholder="0"
                        className="w-20 h-7 text-right text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Net Amount (Invoice)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-base text-muted-foreground">{symbol}</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={seller.invoiceAmount || getSellerTotal(seller.id)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setInvoiceAmount(seller.id, value);
                        }}
                        className="w-24 h-7 text-right text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

                {/* Seller count & item count */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Suppliers</span>
                  <span className="tabular-nums">{sellersWithItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="tabular-nums">{totalItemCount}</span>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold">Grand Total</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <Separator />

                {/* Payment Form */}
                <DynamicForm
                  form={paymentForm}
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
                        className={`font-semibold tabular-nums ${grandTotal - paidAmount > 0
                          ? "text-orange-600 dark:text-orange-500"
                          : "text-green-600 dark:text-green-500"
                          }`}
                      >
                        {formatCurrency(Math.max(0, grandTotal - paidAmount))}
                      </span>
                    </div>
                    {paidAmount > grandTotal && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Change</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          {formatCurrency(paidAmount - grandTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Complete Order Button */}
                <Button
                  onClick={handleCompleteOrder}
                  disabled={isPending || sellersWithItems.length === 0}
                  size="lg"
                  className="w-full font-semibold"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {isPending ? "Processing..." : "Complete Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ==================== Import Low Stock Dialog ==================== */}
      <ImportLowStockDialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) setPreSelectedLowStockIds([]);
        }}
        onImport={handleImportLowStock}
        discountInfo = {
          {
            type: supplierForm.getValues("discountType") || "fixed",
          value: supplierForm.getValues("discountValue") || 0,
          }
        }
        preSelectedIds={preSelectedLowStockIds}
      />

      {/* ==================== Edit Product Dialog ==================== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Input value={editingItem.productName} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min={1}
                  value={editQuantity}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 1;
                    editForm.setValue("quantity", value);
                    handleEditFieldChange("quantity", value);
                  }}
                />
              </div>

              {isUOMEnabled && (
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input
                    value={editConvertedQuantity?.toFixed(2) || "0"}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Conversion Factor: {editingItem.conversionFactor || 1}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Total Price</Label>
                <Input
                  value={formatCurrency(editPrice || 0)}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-discount">Discount</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  min={0}
                  value={editDiscount}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    editForm.setValue("discount", value);
                    handleEditFieldChange("discount", value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  value={formatCurrency(editCostPrice || 0)}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-remember"
                  checked={editRememberCostPrice}
                  onCheckedChange={(checked) =>
                    editForm.setValue("rememberCostPrice", checked as boolean)
                  }
                />
                <Label htmlFor="edit-remember" className="text-sm font-normal">
                  Remember Cost Price
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
