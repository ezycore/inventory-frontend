"use client";

import { useCreatePurchaseOrder } from "@/services/api";
import {
  type PurchaseOrderItem,
  useAuthStore,
  usePurchasePageStore,
} from "@/services/stores";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/components/collapsible";
import { CardTable } from "@/ui/components/custom/card-table";
import DynamicForm from "@/ui/components/form";
import type {
  DynamicFormConfig,
  FormFieldConfig,
  SelectOption,
} from "@/ui/components/form/type";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { Separator } from "@/ui/components/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Badge } from "@/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  X,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useCurrency } from "@/lib/currency";
import type { CreatePurchaseOrderDto, CreatePurchaseOrderItemDto } from "@/types";

// =====================
// Schema Definitions
// =====================

const supplierFormSchema = z.object({
  supplierId: z
    .union([
      z.string(),
      z.object({
        label: z.string(),
        value: z.string(),
        phone: z.string().optional(),
        email: z.string().optional(),
      }),
    ])
    .optional()
    .nullable(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0),
  purchaseType: z.enum(["instant", "order"]),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  accountId: z
    .union([
      z.string(),
      z.object({
        label: z.string(),
        value: z.string(),
        isDefault: z.boolean().optional(),
      }),
    ])
    .optional()
    .nullable(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const productFormSchema = z.object({
  productId: z.union([
    z.string().min(1, "Product is required"),
    z.object({
      label: z.string(),
      value: z.string(),
      costPrice: z.number().optional(),
      sellingPrice: z.number().optional(),
      currentQuantity: z.number().optional(),
      productId: z.string().optional(),
      variantId: z.string().nullable().optional(),
    }),
  ]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0),
  costPrice: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;
type ProductFormData = z.infer<typeof productFormSchema>;

// =====================
// Types for API Responses
// =====================

interface SupplierApiItem {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface ProductApiItem {
  _id: string; // inventoryId
  name: string;
  costPrice: number;
  price: number;
  quantity: number;
  productId: string;
  variantId: string | null;
}

interface SupplierApiResponse {
  data?: {
    items?: SupplierApiItem[];
  };
}

interface ProductApiResponse {
  data?: ProductApiItem[];
}

interface AccountApiItem {
  _id: string;
  name: string;
  isDefault: boolean;
  balance: number;
}

interface AccountApiResponse {
  data?: {
    items?: AccountApiItem[];
  };
}

// =====================
// Transform Callbacks
// =====================

const supplierItemsCreateCallback = (
  response: SupplierApiResponse
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: item.name,
    phone: item.phone,
    email: item.email,
  })) as SelectOption[];
};

const productItemsCreateCallback = (
  response: ProductApiResponse
): SelectOption[] => {
  const items = response?.data || [];
  return items.map((item) => ({
    value: item._id, // inventoryId
    label: item.name,
    costPrice: item.costPrice,
    sellingPrice: item.price,
    currentQuantity: item.quantity,
    productId: item.productId,
    variantId: item.variantId,
  })) as SelectOption[];
};

const accountItemsCreateCallback = (
  response: AccountApiResponse
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: `${item.name} (৳${item.balance.toFixed(2)})`,
    isDefault: item.isDefault,
  })) as SelectOption[];
};

// =====================
// Helper Functions
// =====================

interface ExtractedSupplier {
  value: string | null;
  label: string | null;
}

const extractSupplierValue = (
  val: SupplierFormData["supplierId"]
): ExtractedSupplier => {
  if (!val) {
    return { value: null, label: null };
  }
  if (typeof val === "object" && "value" in val) {
    return { value: val.value, label: val.label };
  }
  return { value: val as string, label: null };
};

interface ExtractedProduct {
  value: string; // inventoryId
  label: string;
  costPrice: number;
  sellingPrice: number;
  currentQuantity: number;
  productId: string;
  variantId: string | null;
}

const extractProductValue = (
  val: ProductFormData["productId"]
): ExtractedProduct | null => {
  if (!val) return null;
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value,
      label: val.label,
      costPrice: val.costPrice ?? 0,
      sellingPrice: val.sellingPrice ?? 0,
      currentQuantity: val.currentQuantity ?? 0,
      productId: (val as any).productId ?? "",
      variantId: (val as any).variantId ?? null,
    };
  }
  return null;
};

// =====================
// Main Component
// =====================

export default function PurchasesPage() {
  const { format: formatCurrency } = useCurrency();
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [expandedSellers, setExpandedSellers] = useState<Set<string>>(
    new Set()
  );

  // Get organization features
  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;

  // Store state
  const {
    sellers,
    activeSellerIndex,
    getSellerSubtotal,
    getSellerTotal,
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
    setDiscountType,
    setInvoiceNumber,
    setInvoiceDate,
    addItem,
    updateItem,
    removeItem,
    clearAll,
  } = usePurchasePageStore();

  const activeSeller = sellers[activeSellerIndex];

  // API mutations
  const createOrderMutation = useCreatePurchaseOrder();

  // Toggle seller expansion
  const toggleSellerExpansion = useCallback((sellerId: string) => {
    setExpandedSellers((prev) => {
      const next = new Set(prev);
      if (next.has(sellerId)) {
        next.delete(sellerId);
      } else {
        next.add(sellerId);
      }
      return next;
    });
  }, []);

  // Supplier form for active seller
  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      supplierId: activeSeller?.supplierId
        ? { value: activeSeller.supplierId, label: activeSeller.supplierName || "" }
        : null,
      discountType: activeSeller?.discountType || "fixed",
      discountValue: activeSeller?.additionalDiscount || 0,
      purchaseType: activeSeller?.purchaseType || "instant",
      invoiceNumber: activeSeller?.invoiceNumber || "",
      invoiceDate: activeSeller?.invoiceDate || "",
      accountId: null,
      paidAmount: 0,
      notes: activeSeller?.notes || "",
    },
  });

  // Product form
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      unitPrice: 0,
      costPrice: 0,
      discount: 0,
      total: 0,
    },
  });

  // =====================
  // Form Configurations
  // =====================

  const supplierFormConfig: DynamicFormConfig = useMemo(() => {
    const fields: FormFieldConfig[] = [
      {
        name: "supplierId",
        label: "Supplier",
        type: "select",
        required: false,
        optionsApi: "/purchases/suppliers",
        placeholder: "Select supplier (optional)",
        labelInValue: true,
        itemsCreateCallback: supplierItemsCreateCallback,
        columnSpan: 6,
      },
      {
        name: "discountType",
        label: "Discount Type",
        type: "select",
        required: true,
        options: [
          { value: "percentage", label: "Percentage (%)" },
          { value: "fixed", label: "Fixed Amount" },
        ],
        columnSpan: 3,
      },
      {
        name: "discountValue",
        label: "Discount Value",
        type: "number",
        required: false,
        placeholder: "0",
        columnSpan: 3,
        validation: { min: 0 },
      },
      {
        name: "purchaseType",
        label: "Purchase Type",
        type: "select",
        required: true,
        options: [
          { value: "instant", label: "Instant Purchase (Receive Now)" },
          { value: "order", label: "Create Order (Receive Later)" },
        ],
        columnSpan: 4,
      },
      {
        name: "invoiceNumber",
        label: "Supplier Invoice #",
        type: "input",
        required: false,
        placeholder: "Invoice number (optional)",
        columnSpan: 4,
      },
      {
        name: "invoiceDate",
        label: "Invoice Date",
        type: "date",
        required: false,
        columnSpan: 4,
      },
    ];

    // Add account and payment fields if accounts feature is enabled
    if (isAccountsEnabled) {
      fields.push(
        {
          name: "accountId",
          label: "Payment Account",
          type: "select",
          required: false,
          optionsApi: "/accounts",
          placeholder: "Select account",
          labelInValue: true,
          itemsCreateCallback: accountItemsCreateCallback,
          columnSpan: 6,
        },
        {
          name: "paidAmount",
          label: "Paid Amount",
          type: "number",
          required: false,
          placeholder: "0",
          columnSpan: 6,
          validation: { min: 0 },
        }
      );
    }

    fields.push({
      name: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      placeholder: "Add any notes for this purchase (optional)",
      columnSpan: 12,
      rows: 2,
    });

    return {
      sections: [
        {
          title: "Supplier & Purchase Info",
          icon: <Truck className="h-5 w-5 text-primary" />,
          fields,
        },
      ],
    };
  }, [isAccountsEnabled]);

  const productFormConfig: DynamicFormConfig = useMemo(
    () => ({
      sections: [
        {
          title: "Add Product",
          icon: <Package className="h-5 w-5 text-primary" />,
          fields: [
            {
              name: "productId",
              label: "Product",
              type: "select",
              required: true,
              optionsApi: "/inventory/purchasable-products",
              placeholder: "Select product",
              labelInValue: true,
              itemsCreateCallback: productItemsCreateCallback,
              columnSpan: 4,
            },
            {
              name: "quantity",
              label: "Quantity",
              type: "number",
              required: true,
              placeholder: "1",
              columnSpan: 2,
              validation: { min: 1 },
            },
            {
              name: "unitPrice",
              label: "Unit Price",
              type: "number",
              required: true,
              placeholder: "0",
              columnSpan: 2,
              validation: { min: 0 },
            },
            {
              name: "costPrice",
              label: "Cost Price",
              type: "number",
              required: false,
              disabled: true,
              columnSpan: 2,
            },
            {
              name: "discount",
              label: "Discount",
              type: "number",
              required: false,
              placeholder: "0",
              columnSpan: 1,
              validation: { min: 0 },
            },
            {
              name: "total",
              label: "Total",
              type: "number",
              required: false,
              disabled: true,
              columnSpan: 1,
            },
          ],
        },
      ],
    }),
    []
  );

  // =====================
  // Event Handlers
  // =====================

  const handleSupplierFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (!activeSeller) return;

      if (fieldName === "supplierId") {
        const supplier = extractSupplierValue(
          value as SupplierFormData["supplierId"]
        );
        setSupplier(activeSeller.id, supplier.value, supplier.label);
      } else if (fieldName === "discountType") {
        setDiscountType(activeSeller.id, value as "percentage" | "fixed");
      } else if (fieldName === "discountValue") {
        setAdditionalDiscount(activeSeller.id, value as number);
      } else if (fieldName === "purchaseType") {
        setPurchaseType(activeSeller.id, value as "instant" | "order");
      } else if (fieldName === "notes") {
        setNotes(activeSeller.id, value as string);
      } else if (fieldName === "invoiceNumber") {
        setInvoiceNumber(activeSeller.id, value as string);
      } else if (fieldName === "invoiceDate") {
        setInvoiceDate(activeSeller.id, value as string);
      } else if (fieldName === "paidAmount" || fieldName === "accountId") {
        // Handle payment info updates
        const currentPaid = supplierForm.getValues("paidAmount") || 0;
        const currentAccount = supplierForm.getValues("accountId");
        const extractedAccountId =
          typeof currentAccount === "object" && currentAccount !== null
            ? currentAccount.value
            : typeof currentAccount === "string" ? currentAccount : "";

        if (extractedAccountId && currentPaid > 0) {
          setPaymentInfo(activeSeller.id, {
            paymentMethod: "cash",
            accountId: extractedAccountId,
            amount: currentPaid,
          });
        } else {
          setPaymentInfo(activeSeller.id, null);
        }
      }
    },
    [
      activeSeller,
      setSupplier,
      setDiscountType,
      setAdditionalDiscount,
      setPurchaseType,
      setNotes,
      setInvoiceNumber,
      setInvoiceDate,
      setPaymentInfo,
      supplierForm,
    ]
  );

  const handleProductFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "productId") {
        const product = extractProductValue(
          value as ProductFormData["productId"]
        );
        if (product) {
          // Auto-fill product fields with cost price
          productForm.setValue("unitPrice", product.costPrice);
          productForm.setValue("costPrice", product.costPrice);
          productForm.setValue("discount", 0);
          productForm.setValue("total", product.costPrice);
        }
      } else if (fieldName === "unitPrice" || fieldName === "quantity" || fieldName === "discount") {
        // Recalculate total
        const quantity = productForm.getValues("quantity") || 1;
        const unitPrice = productForm.getValues("unitPrice") || 0;
        const discount = productForm.getValues("discount") || 0;
        const total = quantity * unitPrice - discount;
        productForm.setValue("total", Math.max(0, total));
      }
    },
    [productForm]
  );

  const handleAddToOrder = useCallback(
    (data: ProductFormData) => {
      if (!activeSeller) {
        toast.error("No active seller session");
        return;
      }

      const product = extractProductValue(data.productId);
      if (!product) {
        toast.error("Please select a product");
        return;
      }

      // Add item to store
      addItem(activeSeller.id, {
        inventoryId: product.value,
        productId: product.productId,
        variantId: product.variantId,
        productName: product.label,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        costPrice: data.costPrice,
        discount: data.discount,
        sellingPrice: product.sellingPrice,
      });

      toast.success(`${product.label} added to order`);

      // Reset product form
      productForm.reset({
        productId: "",
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        discount: 0,
        total: 0,
      });
    },
    [activeSeller, addItem, productForm]
  );

  const handleSubmitPurchase = useCallback(async () => {
    // Filter sellers with items
    const validSellers = sellers.filter((s) => s.items.length > 0);

    if (validSellers.length === 0) {
      toast.error("Please add items to at least one seller");
      return;
    }

    // Get form values for payment
    const accountId = supplierForm.getValues("accountId");
    const paidAmount = supplierForm.getValues("paidAmount") || 0;
    const extractedAccountId =
      typeof accountId === "object" && accountId !== null && "value" in accountId
        ? accountId.value
        : typeof accountId === "string"
          ? accountId
          : null;

    try {
      // Create separate purchase order for each seller
      for (const seller of validSellers) {
        const status = seller.purchaseType === "instant" ? "received" : "ordered";
        const total = getSellerTotal(seller.id);

        const orderData: CreatePurchaseOrderDto = {
          supplierId: seller.supplierId || "",
          items: seller.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            discount: item.discount,
            productName: item.productName,
          })),
          status,
          invoiceNumber: seller.invoiceNumber || undefined,
          invoiceDate: seller.invoiceDate || undefined,
          discountType: seller.discountType,
          discountValue: seller.additionalDiscount,
          notes: seller.notes || undefined,
        };

        // Add payment info if accounts enabled and payment provided
        // Backend expects 'payment' field, not 'paymentInfo'
        if (
          isAccountsEnabled &&
          extractedAccountId &&
          paidAmount > 0 &&
          seller.purchaseType === "instant"
        ) {
          orderData.payment = {
            paymentMethod: "cash",
            accountId: extractedAccountId,
            amount: Math.min(paidAmount, total),
          };
        }

        await createOrderMutation.mutateAsync(orderData);
      }

      // Show success
      setShowSuccessPopover(true);
      setTimeout(() => setShowSuccessPopover(false), 3000);

      // Reset all
      clearAll();
      supplierForm.reset({
        supplierId: null,
        discountType: "fixed",
        discountValue: 0,
        purchaseType: "instant",
        invoiceNumber: "",
        invoiceDate: "",
        accountId: null,
        paidAmount: 0,
        notes: "",
      });
      productForm.reset();
    } catch (error) {
      console.error("Failed to complete purchase:", error);
    }
  }, [
    sellers,
    supplierForm,
    isAccountsEnabled,
    getSellerTotal,
    createOrderMutation,
    clearAll,
    productForm,
  ]);

  // =====================
  // Table Columns
  // =====================

  const columns: ColumnDef<PurchaseOrderItem>[] = useMemo(
    () => [
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.productName}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        cell: ({ row }) => row.original.quantity,
      },
      {
        accessorKey: "unitPrice",
        header: "Unit Price",
        cell: ({ row }) => formatCurrency(row.original.unitPrice),
      },
      {
        accessorKey: "discount",
        header: "Discount",
        cell: ({ row }) => formatCurrency(row.original.discount),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(row.original.total)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (activeSeller) {
                removeItem(activeSeller.id, row.original.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        ),
      },
    ],
    [activeSeller, removeItem, formatCurrency]
  );

  // =====================
  // Render
  // =====================

  const isLoading = createOrderMutation.isPending;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">New Purchase</h1>
          <p className="text-muted-foreground">
            Record stock purchases from suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => addSeller()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Seller Tabs */}
      {sellers.length > 1 && (
        <Tabs
          value={activeSellerIndex.toString()}
          onValueChange={(v) => setActiveSeller(parseInt(v))}
        >
          <TabsList>
            {sellers.map((seller, index) => (
              <TabsTrigger key={seller.id} value={index.toString()}>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {seller.supplierName || `Supplier ${index + 1}`}
                  {seller.items.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {seller.items.length}
                    </Badge>
                  )}
                  {sellers.length > 1 && (
                    <button
                      className="ml-2 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSeller(seller.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Section 1: Supplier & Purchase Info */}
      <Card>
        <CardContent className="pt-6">
          <DynamicForm
            form={supplierForm}
            config={supplierFormConfig}
            onFieldChange={handleSupplierFieldChange}
            hideCancel
          />
        </CardContent>
      </Card>

      {/* Section 2: Product Selection */}
      <Card>
        <CardContent className="pt-6">
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

      {/* Section 3: Current Order Items */}
      {activeSeller && activeSeller.items.length > 0 && (
        <Card>
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {activeSeller.supplierName || "Unknown Supplier"}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({activeSeller.items.length} item
                      {activeSeller.items.length !== 1 ? "s" : ""})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        activeSeller.purchaseType === "instant"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {activeSeller.purchaseType === "instant"
                        ? "Instant Purchase"
                        : "Create Order"}
                    </Badge>
                    <span className="font-semibold">
                      {formatCurrency(getSellerTotal(activeSeller.id))}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <CardTable columns={columns} data={activeSeller.items} />

                {/* Order Footer */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>
                          {formatCurrency(getSellerSubtotal(activeSeller.id))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Additional Discount:
                        </span>
                        <Input
                          type="number"
                          className="w-24 h-8 text-right"
                          value={activeSeller.additionalDiscount}
                          onChange={(e) =>
                            setAdditionalDiscount(
                              activeSeller.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min={0}
                        />
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>
                          {formatCurrency(getSellerTotal(activeSeller.id))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Section 4: Grand Total & Submit */}
      {getTotalItemCount() > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  {sellers.filter((s) => s.items.length > 0).length} supplier(s),{" "}
                  {getTotalItemCount()} item(s)
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(getGrandTotal())}
                  </p>
                </div>
                <Popover open={showSuccessPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      size="lg"
                      onClick={handleSubmitPurchase}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete Purchase
                        </>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-4 bg-green-50 border-green-200"
                    side="top"
                  >
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">
                        Purchase completed successfully!
                      </span>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
