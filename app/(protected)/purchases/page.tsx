"use client";

import { useCurrency } from "@/lib/currency";
import { useCreatePurchaseOrder } from "@/services/api";
import {
  type PurchaseOrderItem,
  useAuthStore,
  usePurchasePageStore,
} from "@/services/stores";
import type {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderItemDto,
} from "@/types";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/components/collapsible";
import { CardTable } from "@/ui/components/custom/card-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import DynamicForm from "@/ui/components/form";
import type {
  DynamicFormConfig,
  FormFieldConfig,
  SelectOption,
} from "@/ui/components/form/type";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { Separator } from "@/ui/components/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Package,
  Trash2,
  Truck,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// =====================
// Schema Definitions
// =====================

const supplierFormSchema = z.object({
  supplierId: z.union([
    z.string().min(1, "Supplier is required"),
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ]),
  purchaseType: z.enum(["instant", "order"]),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().min(0).optional(),
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

type SupplierFormData = z.infer<typeof supplierFormSchema>;
type ProductFormData = z.infer<typeof productFormSchema>;

// =====================
// Types for API Responses
// =====================

interface SupplierApiItem {
  _id: string;
  name: string;
  defaultDiscount: {
    type: "percentage" | "fixed";
    value: number;
  };
}

interface ProductApiItem {
  _id: string; // inventoryId
  name: string;
  price: number;
  productId: string;
  variantId: string | null;
  conversionFactor?: number;
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
  response: SupplierApiResponse,
): SelectOption[] => {
  const items = response?.data?.items || [];
  return items.map((item) => ({
    value: item._id,
    label: item.name,
    defaultDiscountValue: item.defaultDiscount?.value ?? 0,
    defaultDiscountType: item.defaultDiscount?.type ?? "fixed",
  })) as SelectOption[];
};

const productItemsCreateCallback = (
  response: ProductApiResponse,
): SelectOption[] => {
  const items = response?.data || [];
  return items.map((item) => ({
    value: item._id, // inventoryId
    label: item.name,
    price: item.price,
    productId: item.productId,
    variantId: item.variantId,
    conversionFactor: item.conversionFactor ?? 1,
  })) as SelectOption[];
};

const accountItemsCreateCallback = (
  response: AccountApiResponse,
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
  defaultDiscountType: "percentage" | "fixed";
  defaultDiscountValue: number;
}

const extractSupplierValue = (
  val: SupplierFormData["supplierId"],
): ExtractedSupplier => {
  if (!val) {
    return {
      value: null,
      label: null,
      defaultDiscountType: "fixed",
      defaultDiscountValue: 0,
    };
  }
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value,
      label: val.label,
      defaultDiscountType: (val as any).defaultDiscountType || "fixed",
      defaultDiscountValue: (val as any).defaultDiscountValue || 0,
    };
  }
  return {
    value: val as string,
    label: null,
    defaultDiscountType: "fixed",
    defaultDiscountValue: 0,
  };
};

interface ExtractedProduct {
  value: string; // inventoryId
  label: string;
  price: number;
  conversionFactor: number;
  productId: string;
  variantId: string | null;
}

const extractProductValue = (
  val: ProductFormData["productId"],
): ExtractedProduct | null => {
  if (!val) return null;
  if (typeof val === "object" && "value" in val) {
    return {
      value: val.value,
      label: val.label,
      price: (val as any).price ?? 0,
      conversionFactor: (val as any).conversionFactor ?? 1,
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
    new Set(),
  );
  const [editingItem, setEditingItem] = useState<PurchaseOrderItem | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);

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

  // Supplier form
  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      supplierId: activeSeller?.supplierId
        ? {
            value: activeSeller.supplierId,
            label: activeSeller.supplierName || "",
          }
        : null,
      purchaseType: activeSeller?.purchaseType || "instant",
      discountType: activeSeller?.discountType || "fixed",
      discountValue: activeSeller?.discountValue || 0,
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
      convertedQuantity: 1,
      price: 0,
      discount: 0,
      costPrice: 0,
      rememberCostPrice: false,
    },
  });

  // Edit product form
  const editForm = useForm<ProductFormData>({
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
  const editQuantity = useWatch({
    control: editForm.control,
    name: "quantity",
    defaultValue: 1,
  });
  const editConvertedQuantity = useWatch({
    control: editForm.control,
    name: "convertedQuantity",
    defaultValue: 1,
  });
  const editPrice = useWatch({
    control: editForm.control,
    name: "price",
    defaultValue: 0,
  });
  const editDiscount = useWatch({
    control: editForm.control,
    name: "discount",
    defaultValue: 0,
  });
  const editCostPrice = useWatch({
    control: editForm.control,
    name: "costPrice",
    defaultValue: 0,
  });
  const editRememberCostPrice = useWatch({
    control: editForm.control,
    name: "rememberCostPrice",
    defaultValue: false,
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
        required: true,
        optionsApi: "/purchases/suppliers",
        placeholder: "Select supplier",
        labelInValue: true,
        itemsCreateCallback: supplierItemsCreateCallback,
        columnSpan: 6,
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
        columnSpan: 6,
      },
      {
        name: "discountType",
        label: "Discount Type",
        type: "select",
        required: false,
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
        name: "invoiceNumber",
        label: "Invoice Number",
        type: "input",
        required: false,
        placeholder: "Invoice number (optional)",
        columnSpan: 3,
      },
      {
        name: "invoiceDate",
        label: "Invoice Date",
        type: "date",
        required: true,
        columnSpan: 3,
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
        },
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
          title: "Supplier Information",
          icon: <Truck className="h-5 w-5 text-primary" />,
          fields,
        },
      ],
    };
  }, [isAccountsEnabled]);

  const productFormConfig: DynamicFormConfig = useMemo(() => {
    const fields: FormFieldConfig[] = [
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
        label: "Purchase Quantity",
        type: "number",
        required: true,
        placeholder: "1",
        columnSpan: 2,
        validation: { min: 1 },
      },
    ];

    // Add UOM converted quantity field if enabled
    if (isUOMEnabled) {
      fields.push({
        name: "convertedQuantity",
        label: "Stock Quantity",
        type: "number",
        required: false,
        disabled: true,
        columnSpan: 2,
        helperText: "Qty × Conversion Factor",
      });
    }

    // Add rest of fields
    fields.push(
      {
        name: "price",
        label: "Total Price",
        type: "number",
        required: true,
        placeholder: "0",
        columnSpan: isUOMEnabled ? 2 : 3,
        validation: { min: 0 },
        disabled: true,
      },
      {
        name: "discount",
        label: "Discount",
        type: "number",
        required: false,
        placeholder: "0",
        columnSpan: isUOMEnabled ? 2 : 3,
        validation: { min: 0 },
      },
      {
        name: "costPrice",
        label: "Cost Price",
        type: "number",
        required: false,
        placeholder: "0",
        columnSpan: isUOMEnabled ? 2 : 2,
        validation: { min: 0 },
      },
      {
        name: "rememberCostPrice",
        label: "Remember Cost Price",
        type: "checkbox",
        required: false,
        columnSpan: isUOMEnabled ? 2 : 2,
      },
    );

    return {
      sections: [
        {
          title: "Add Product",
          icon: <Package className="h-5 w-5 text-primary" />,
          fields,
        },
      ],
    };
  }, [isUOMEnabled]);

  // =====================
  // Event Handlers
  // =====================

  /**
   * Handle supplier field changes
   */
  const handleSupplierFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (!activeSeller) return;

      if (fieldName === "supplierId") {
        const supplier = extractSupplierValue(
          value as SupplierFormData["supplierId"],
        );

        // Check if supplier changed and current seller has items
        if (
          activeSeller.items.length > 0 &&
          supplier.value !== activeSeller.supplierId
        ) {
          // Check if there's already a seller for this supplier
          const existingSellerIndex = sellers.findIndex(
            (s) => s.supplierId === supplier.value,
          );

          if (existingSellerIndex !== -1) {
            // Switch to existing seller for this supplier
            setActiveSeller(existingSellerIndex);
          } else {
            // Create new seller session for the new supplier
            const newSellerId = addSeller();
            setSupplier(newSellerId, supplier.value, supplier.label);
          }
        } else {
          // Update current seller (no items yet or same supplier)
          setSupplier(activeSeller.id, supplier.value, supplier.label);
        }
        // Auto-fill discount type and value from supplier's default
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
      } else if (fieldName === "notes") {
        setNotes(activeSeller.id, value as string);
      } else if (fieldName === "paidAmount" || fieldName === "accountId") {
        const currentPaid = supplierForm.getValues("paidAmount") || 0;
        const currentAccount = supplierForm.getValues("accountId");
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
    [
      activeSeller,
      sellers,
      addSeller,
      setActiveSeller,
      setSupplier,
      setPurchaseType,
      setNotes,
      setInvoiceNumber,
      setInvoiceDate,
      setPaymentInfo,
      setDiscountType,
      setDiscountValue,
      supplierForm,
    ],
  );

  /**
   * Handle product field changes
   */
  const handleProductFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "productId") {
        const product = extractProductValue(
          value as ProductFormData["productId"],
        );
        if (product) {
          const quantity = productForm.getValues("quantity") || 1;
          const conversionFactor = product.conversionFactor || 1;
          const convertedQuantity = quantity * conversionFactor;

          // Calculate per-unit price from product
          const perUnitPrice = product.price;

          // Calculate box-level price (what user sees when UOM enabled)
          // Box price = per-unit price * conversionFactor
          const boxPrice = perUnitPrice * conversionFactor;

          // Get supplier discount from form
          const discountType =
            supplierForm.getValues("discountType") || "fixed";
          const discountValue = supplierForm.getValues("discountValue") || 0;

          // Calculate discount per box based on supplier discount settings
          let boxDiscount = 0;
          if (discountType === "percentage") {
            boxDiscount = (boxPrice * discountValue) / 100;
          } else {
            // Fixed discount is per box
            boxDiscount = discountValue;
          }

          // Box cost price = box price - box discount
          const boxCostPrice = Math.max(0, boxPrice - boxDiscount);

          // Update form values with box-level prices (what user sees)
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
          const convertedQuantity = quantity * conversionFactor;

          // Update converted quantity only - box price and costPrice stay the same
          productForm.setValue("convertedQuantity", convertedQuantity);
        }
      } else if (fieldName === "discount") {
        // Recalculate box cost price when box discount is manually changed
        const boxPrice = productForm.getValues("price") || 0;
        const boxDiscount = (value as number) || 0;
        const boxCostPrice = Math.max(0, boxPrice - boxDiscount);
        productForm.setValue("costPrice", boxCostPrice);
      } else if (fieldName === "costPrice") {
        // Recalculate box discount when box cost price is manually changed
        const boxPrice = productForm.getValues("price") || 0;
        const boxCostPrice = (value as number) || 0;
        const boxDiscount = Math.max(0, boxPrice - boxCostPrice);
        productForm.setValue("discount", boxDiscount);
      }
    },
    [productForm, supplierForm],
  );

  /**
   * Handle add to order
   */
  const handleAddToOrder = useCallback(
    (data: ProductFormData) => {
      // Check if supplier is selected from the form
      const supplierValue = supplierForm.getValues("supplierId");
      const supplier = extractSupplierValue(supplierValue);

      if (!supplier.value) {
        toast.error("Please select a supplier first");
        return;
      }

      // Get current state from store to avoid stale closure
      const storeState = usePurchasePageStore.getState();
      let currentSeller = storeState.sellers[storeState.activeSellerIndex];

      // If current seller doesn't have the selected supplier, find or create one
      if (!currentSeller || currentSeller.supplierId !== supplier.value) {
        // Find existing seller for this supplier
        const existingSellerIndex = storeState.sellers.findIndex(
          (s) => s.supplierId === supplier.value,
        );

        if (existingSellerIndex !== -1) {
          setActiveSeller(existingSellerIndex);
          currentSeller = storeState.sellers[existingSellerIndex];
        } else if (currentSeller && currentSeller.items.length === 0) {
          // Update current seller with this supplier if it has no items
          setSupplier(currentSeller.id, supplier.value, supplier.label);
        } else {
          // Create new seller for this supplier
          const newSellerId = addSeller();
          setSupplier(newSellerId, supplier.value, supplier.label);
          // Get updated state
          const newState = usePurchasePageStore.getState();
          currentSeller = newState.sellers[newState.activeSellerIndex];
        }
      }

      const product = extractProductValue(data.productId);
      if (!product) {
        toast.error("Please select a product");
        return;
      }

      // Add item to store with box-level prices (what user sees in UI)
      // Box price = per-unit price * conversionFactor
      const conversionFactor = product.conversionFactor || 1;
      const boxPrice = product.price * conversionFactor;

      addItem(currentSeller.id, {
        inventoryId: product.value,
        productId: product.productId,
        variantId: product.variantId,
        productName: product.label,
        quantity: data.quantity,
        price: boxPrice, // Store box price for display
        costPrice: data.costPrice, // Box cost price
        discount: data.discount, // Box discount
        conversionFactor: conversionFactor,
        convertedQuantity: data.convertedQuantity,
      });

      toast.success(`${product.label} added to order`);

      // Reset product form
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
    [
      addItem,
      productForm,
      supplierForm,
      setActiveSeller,
      setSupplier,
      addSeller,
    ],
  );

  /**
   * Handle edit item
   */
  const handleEditItem = useCallback(
    (sellerId: string, item: PurchaseOrderItem) => {
      setEditingItem(item);
      setEditingSellerId(sellerId);

      const convertedQuantity = item.convertedQuantity || item.quantity;
      // item.price is already box price (per purchase unit)
      // Use it directly for display
      const boxPrice = item.price;

      editForm.reset({
        productId: {
          value: item.inventoryId,
          label: item.productName,
          price: boxPrice, // Store box price for calculations
          conversionFactor: item.conversionFactor || 1,
          productId: item.productId,
          variantId: item.variantId,
        },
        quantity: item.quantity,
        convertedQuantity: convertedQuantity,
        price: boxPrice, // Display box price
        discount: item.discount, // Box discount
        costPrice: item.costPrice, // Box cost price
        rememberCostPrice: false,
      });

      setIsEditDialogOpen(true);
    },
    [editForm],
  );

  /**
   * Handle save edit
   */
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

  /**
   * Handle edit field change
   */
  const handleEditFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "quantity") {
        const product = extractProductValue(editForm.getValues("productId"));
        if (product) {
          const quantity = (value as number) || 1;
          const conversionFactor = product.conversionFactor || 1;
          const convertedQuantity = quantity * conversionFactor;

          // Box price stays the same - only convertedQuantity changes
          // product.price here is already the box price (stored in form)
          editForm.setValue("convertedQuantity", convertedQuantity);
        }
      } else if (fieldName === "discount") {
        // Recalculate box cost price when box discount changes
        const boxPrice = editForm.getValues("price") || 0;
        const boxDiscount = (value as number) || 0;
        const boxCostPrice = Math.max(0, boxPrice - boxDiscount);
        editForm.setValue("costPrice", boxCostPrice);
      }
    },
    [editForm],
  );

  /**
   * Handle delete seller
   */
  const handleDeleteSeller = useCallback(
    (sellerId: string) => {
      if (
        confirm("Are you sure you want to delete all items for this supplier?")
      ) {
        removeSeller(sellerId);
        toast.success("Supplier removed");
      }
    },
    [removeSeller],
  );

  /**
   * Handle complete order
   */
  const handleCompleteOrder = useCallback(async () => {
    // Filter sellers with items and valid supplier
    const validSellers = sellers.filter(
      (s) => s.items.length > 0 && s.supplierId,
    );
    console.log("Valid sellers for order:", validSellers);
    if (validSellers.length === 0) {
      toast.error("Please add items to at least one supplier");
      return;
    }

    // Get form values for payment
    const accountId = supplierForm.getValues("accountId");
    const paidAmount = supplierForm.getValues("paidAmount") || 0;
    const extractedAccountId =
      typeof accountId === "object" &&
      accountId !== null &&
      "value" in accountId
        ? accountId.value
        : typeof accountId === "string"
          ? accountId
          : null;

    try {
      // Create array of purchase orders (one per supplier)
      const ordersData: CreatePurchaseOrderDto[] = validSellers.map(
        (seller) => {
          const items: CreatePurchaseOrderItemDto[] = seller.items.map(
            (item) => {
              // Convert box-level prices to per-unit prices for backend
              // Frontend stores box prices (e.g., price for 1 box of 12 units)
              // Backend needs per-unit prices (price for 1 unit)
              const conversionFactor = item.conversionFactor || 1;
              const perUnitPrice = item.price / conversionFactor;
              const perUnitCostPrice = item.costPrice / conversionFactor;
              const perUnitDiscount = item.discount / conversionFactor;

              const itemDto: CreatePurchaseOrderItemDto = {
                productId: item.productId,
                variantId: item.variantId,
                inventoryId: item.inventoryId,
                quantity: item.quantity,
                price: perUnitPrice, // Per-unit price for backend
                costPrice: perUnitCostPrice, // Per-unit cost price for backend
                discount: perUnitDiscount, // Per-unit discount for backend
                productName: item.productName,
              };

              // Add UOM fields if present
              if (item.conversionFactor && item.conversionFactor !== 1) {
                itemDto.conversionFactor = item.conversionFactor;
              }

              return itemDto;
            },
          );

          const status =
            seller.purchaseType === "instant" ? "received" : "ordered";
          const netAmount = getSellerNetAmount(seller.id);

          const orderData: CreatePurchaseOrderDto = {
            supplierId: seller.supplierId || "",
            items,
            additionalDiscount: seller.additionalDiscount || 0,
            status,
            invoiceNumber: seller.invoiceNumber || undefined,
            invoiceDate: seller.invoiceDate || undefined,
            taxTotal: 0, // Tax is not implemented yet
            notes: seller.notes || undefined,
          };

          // Add payment info if accounts enabled and payment provided
          if (isAccountsEnabled && extractedAccountId && paidAmount > 0) {
            orderData.payment = {
              paymentMethod: "cash",
              accountId: extractedAccountId,
              paidAmount: Math.min(paidAmount, netAmount),
            };
          }

          return orderData;
        },
      );

      await createOrderMutation.mutateAsync(ordersData);

      // Show success
      setShowSuccessPopover(true);
      setTimeout(() => setShowSuccessPopover(false), 3000);

      // Reset all
      clearAll();
      supplierForm.reset({
        supplierId: null,
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
      toast.error("Failed to complete purchase");
    }
  }, [
    sellers,
    supplierForm,
    isAccountsEnabled,
    getSellerNetAmount,
    createOrderMutation,
    clearAll,
    productForm,
  ]);

  // =====================
  // Table Columns
  // =====================

  const createColumns = useCallback(
    (sellerId: string): ColumnDef<PurchaseOrderItem>[] => [
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
      ...(isUOMEnabled
        ? [
            {
              accessorKey: "convertedQuantity" as const,
              header: "Stock Qty",
              cell: ({ row }: { row: any }) => {
                const item = row.original;
                return item.convertedQuantity
                  ? item.convertedQuantity.toFixed(2)
                  : "-";
              },
            },
          ]
        : []),
      {
        accessorKey: "price",
        header: "Price (MRP)",
        cell: ({ row }) => formatCurrency(row.original.price),
      },
      {
        accessorKey: "discount",
        header: "Discount",
        cell: ({ row }) => formatCurrency(row.original.discount),
      },
      {
        accessorKey: "costPrice",
        header: "Cost Price",
        cell: ({ row }) => formatCurrency(row.original.costPrice),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditItem(sellerId, row.original)}
            >
              <Edit2 className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(sellerId, row.original.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [formatCurrency, handleEditItem, removeItem, isUOMEnabled],
  );

  // =====================
  // Computed Values
  // =====================

  // Get sellers with items for display
  const sellersWithItems = useMemo(
    () => sellers.filter((s) => s.items.length > 0),
    [sellers],
  );

  const isLoading = createOrderMutation.isPending;

  // =====================
  // Render
  // =====================

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">New Purchase</h1>
        <p className="text-muted-foreground">
          Record stock purchases from suppliers
        </p>
      </div>

      {/* Section 1: Supplier Info */}
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

      {/* Section 2: Add Product */}
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

      {/* Section 3: Order Summary */}
      {sellersWithItems.map((seller) => (
        <Card key={seller.id}>
          <Collapsible
            open={!expandedSellers.has(seller.id)}
            onOpenChange={() => toggleSellerExpansion(seller.id)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {seller.supplierName || "Walk-in Supplier"}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({seller.purchaseType === "instant" ? "Instant" : "Order"}
                      )
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      - {seller.items.length} item
                      {seller.items.length !== 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSeller(seller.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {expandedSellers.has(seller.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <CardTable
                  columns={createColumns(seller.id)}
                  data={seller.items}
                  emptyMessage="No items"
                  showCard={false}
                />

                <Separator className="my-4" />

                {/* Purchase Summary */}
                <div className="space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal (Cost Price)</span>
                    <span>{formatCurrency(getSellerSubtotal(seller.id))}</span>
                  </div>

                  {/* Additional Discount */}
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor={`discount-${seller.id}`}
                      className="text-sm"
                    >
                      Additional Discount
                    </Label>
                    <Input
                      id={`discount-${seller.id}`}
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-32 text-right"
                      value={seller.additionalDiscount || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setAdditionalDiscount(seller.id, value);
                      }}
                    />
                  </div>

                  {/* Invoice Amount / Net Price */}
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor={`invoice-amount-${seller.id}`}
                      className="text-sm"
                    >
                      Net Amount (Invoice)
                    </Label>
                    <Input
                      id={`invoice-amount-${seller.id}`}
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-32 text-right"
                      value={seller.invoiceAmount || getSellerTotal(seller.id)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setInvoiceAmount(seller.id, value);
                      }}
                    />
                  </div>

                  <Separator />

                  {/* Net Total */}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Total</span>
                    <span className="text-primary">
                      {formatCurrency(getSellerNetAmount(seller.id))}
                    </span>
                  </div>

                  {/* Due Amount - only show if accounts are enabled */}
                  {isAccountsEnabled && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Due Amount</span>
                      <span
                        className={
                          getSellerDueAmount(seller.id) > 0
                            ? "text-destructive"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(getSellerDueAmount(seller.id))}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {/* Grand Total & Complete Order */}
      {sellersWithItems.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            {/* Show grand total if more than one supplier */}
            {sellersWithItems.length > 1 && (
              <>
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Grand Total (All Suppliers)</span>
                  <span className="text-primary">
                    {formatCurrency(getGrandTotal())}
                  </span>
                </div>
                <Separator className="mb-4" />
              </>
            )}

            {/* Complete Order Button */}
            <Popover open={showSuccessPopover}>
              <PopoverTrigger asChild>
                <Button
                  onClick={handleCompleteOrder}
                  disabled={isLoading || sellersWithItems.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Processing..." : "Complete Order"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="flex items-center gap-2 text-green-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">
                    Purchase completed successfully!
                  </span>
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-4">
              {/* Product Name (readonly) */}
              <div className="space-y-2">
                <Label>Product</Label>
                <Input
                  value={editingItem.productName}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Quantity */}
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

              {/* Converted Quantity (if UOM enabled) */}
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

              {/* Price (readonly) */}
              <div className="space-y-2">
                <Label>Total Price</Label>
                <Input
                  value={formatCurrency(editPrice || 0)}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Discount */}
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

              {/* Cost Price (readonly) */}
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  value={formatCurrency(editCostPrice || 0)}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Remember Cost Price */}
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
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
