"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  getProductFormConfig,
  getSupplierFormConfig,
} from "@/components/purchases";
import { extractProductValue } from "@/components/sales";
import { useCurrency } from "@/lib/currency";
import { usePurchaseOrder, useUpdatePurchaseOrder } from "@/services/api";
import { useAuthStore, type PurchaseOrderItem } from "@/services/stores";
import type { CreatePurchaseOrderItemDto, UpdatePurchaseOrderDto } from "@/types";
import type { SupplierFormData } from "@/components/purchases";
import { useRouter } from "next/navigation";

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
      purchaseUnitName: z.string().nullable().optional(),
      unitName: z.string().nullable().optional(),
    }),
  ]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  convertedQuantity: z.number().min(0),
  price: z.number().min(0),
  discount: z.number().min(0),
  costPrice: z.number().min(0),
  rememberCostPrice: z.boolean().optional(),
  stock: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function useEditPurchaseOrder(orderId: string | undefined) {
  const router = useRouter();
  const { format: formatCurrency, symbol } = useCurrency();
  const { user } = useAuthStore();
  const isUOMEnabled = user?.organization?.features?.uomConversion ?? false;

  const { data: orderResponse, isLoading } = usePurchaseOrder(orderId || "");
  const order = orderResponse?.data;

  const updateMutation = useUpdatePurchaseOrder();

  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [invoiceAmount, setInvoiceAmountState] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  const [editingItem, setEditingItem] = useState<PurchaseOrderItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const supplierForm = useForm<SupplierFormData>({
    defaultValues: {
      supplierId: null,
      purchaseType: "order",
      discountType: "fixed",
      discountValue: 0,
      invoiceNumber: "",
      invoiceDate: "",
    },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      convertedQuantity: 1,
      price: 0,
      discount: 0,
      costPrice: 0,
      rememberCostPrice: false,
      stock: "",
    },
  });

  const editForm = useForm<ProductFormValues>({
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

  const editQuantity = useWatch({ control: editForm.control, name: "quantity", defaultValue: 1 });
  const editPrice = useWatch({ control: editForm.control, name: "price", defaultValue: 0 });
  const editDiscount = useWatch({ control: editForm.control, name: "discount", defaultValue: 0 });
  const editCostPrice = useWatch({ control: editForm.control, name: "costPrice", defaultValue: 0 });

  useEffect(() => {
    if (!order) return;
    setItems(
      order.items.map((it) => {
        const conversionFactor = it.conversionFactor ?? 1;
        const qty = it.quantity;
        const costPrice = it.costPrice ?? 0;
        return {
          id: uuidv4(),
          productId: it.productId,
          variantId: it.variantId ?? null,
          inventoryId: it.inventoryId ?? "",
          productName: it.productName ?? it.product?.name ?? "Unknown",
          quantity: qty,
          price: it.price,
          costPrice,
          discount: Math.max(0, (it.price ?? 0) - costPrice),
          total: costPrice * qty,
          conversionFactor,
          convertedQuantity: qty * conversionFactor,
          purchaseUnitName: it.purchaseUnitName ?? undefined,
        };
      }),
    );
    setAdditionalDiscount(order.additionalDiscount ?? 0);
    setInvoiceAmountState(order.invoiceAmount ?? "");
    setNotes(order.notes ?? "");
    setInvoiceNumber(order.invoiceNumber ?? "");
    setInvoiceDate(order.invoiceDate ? order.invoiceDate.slice(0, 10) : "");

    supplierForm.reset({
      supplierId: order.supplierId
        ? {
            value: order.supplierId._id ?? (order.supplierId as unknown as string),
            label: order.supplierId.name ?? "",
          }
        : null,
      purchaseType: order.status === "draft" ? "order" : "order",
      discountType: (() => {
        const d = order.supplierId?.defaultDiscountId;
        return (d && typeof d === "object" ? d.type : undefined) ?? "percentage";
      })(),
      discountValue: (() => {
        const d = order.supplierId?.defaultDiscountId;
        return (d && typeof d === "object" ? d.value : undefined) ?? 0;
      })(),
      invoiceNumber: order.invoiceNumber ?? "",
      invoiceDate: order.invoiceDate ? order.invoiceDate.slice(0, 10) : "",
    });
  }, [order]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0),
    [items],
  );

  const computedNet = Math.max(0, subtotal - (additionalDiscount || 0));
  const finalNet = computedNet || Number(invoiceAmount) || 0;
  const paidSoFar = order?.paidAmount ?? 0;
  const newDue = Math.max(0, finalNet - paidSoFar);

  const productFormConfig = useMemo(() => getProductFormConfig(isUOMEnabled), [isUOMEnabled]);
  const supplierFormConfig = useMemo(() => {
    const cfg = getSupplierFormConfig();
    return {
      ...cfg,
      fields: cfg.fields.map((f) =>
        ["supplierId", "purchaseType"].includes(f.name) ? { ...f, disabled: true } : f,
      ),
    };
  }, []);

  const handleProductFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "productId") {
        const product = extractProductValue(value);
        if (product) {
          const quantity = productForm.getValues("quantity") || 1;
          const conversionFactor = product.conversionFactor || 1;
          const boxPrice = product.price * conversionFactor;
          const discountType = supplierForm.getValues("discountType") || "percentage";
          const discountValue = supplierForm.getValues("discountValue") || 0;
          let boxDiscount = 0;
          if (discountType === "percentage") {
            boxDiscount = parseFloat(((boxPrice * discountValue) / 100).toFixed(2));
          } else {
            boxDiscount = discountValue;
          }
          const boxCostPrice = Math.max(0, boxPrice - boxDiscount);
          productForm.setValue("convertedQuantity", quantity * conversionFactor);
          productForm.setValue("price", boxPrice);
          productForm.setValue("discount", boxDiscount);
          productForm.setValue("costPrice", boxCostPrice);
          productForm.setValue(
            "stock",
            product.purchaseUnitName
              ? `${Math.floor((product.availableQuantity || 0) / conversionFactor)} ${product.purchaseUnitName}`
              : `${product.availableQuantity || 0} ${product.unitName ?? ""}`,
          );
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

  const handleAddItem = useCallback(
    (data: ProductFormValues) => {
      const product = extractProductValue(data.productId);
      if (!product) {
        toast.error("Please select a product");
        return;
      }
      const conversionFactor = product.conversionFactor || 1;
      const newItem: PurchaseOrderItem = {
        id: uuidv4(),
        productId: product.productId,
        variantId: product.variantId,
        inventoryId: product.value,
        productName: product.label,
        quantity: data.quantity,
        price: data.price || 0,
        costPrice: data.costPrice || 0,
        discount: data.discount || 0,
        total: (data.costPrice || 0) * data.quantity,
        conversionFactor,
        convertedQuantity: data.convertedQuantity,
        unitName: product.unitName ?? undefined,
        purchaseUnitName: product.purchaseUnitName ?? undefined,
      };
      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.inventoryId === product.value);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = { ...newItem, id: prev[existingIndex].id };
          return updated;
        }
        return [...prev, newItem];
      });
      toast.success(`${product.label} added`);
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
    [productForm],
  );

  const handleRemoveItem = useCallback((_sellerId: string, itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const handleEditItem = useCallback((_sellerId: string, item: PurchaseOrderItem) => {
    setEditingItem(item);
    editForm.reset({
      productId: {
        value: item.inventoryId,
        label: item.productName,
        price: item.price,
        conversionFactor: item.conversionFactor || 1,
        productId: item.productId,
        variantId: item.variantId,
      },
      quantity: item.quantity,
      convertedQuantity: item.convertedQuantity || item.quantity,
      price: item.price,
      discount: item.discount,
      costPrice: item.costPrice,
      rememberCostPrice: false,
    });
    setIsEditDialogOpen(true);
  }, [editForm]);

  const handleEditFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "quantity") {
        const conversionFactor = editingItem?.conversionFactor || 1;
        editForm.setValue("convertedQuantity", ((value as number) || 1) * conversionFactor);
      } else if (fieldName === "discount") {
        const boxPrice = editForm.getValues("price") || 0;
        editForm.setValue("costPrice", Math.max(0, boxPrice - ((value as number) || 0)));
      } else if (fieldName === "costPrice") {
        const boxPrice = editForm.getValues("price") || 0;
        editForm.setValue("discount", Math.max(0, boxPrice - ((value as number) || 0)));
      }
    },
    [editForm, editingItem],
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingItem) return;
    const data = editForm.getValues();
    setItems((prev) =>
      prev.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              quantity: data.quantity,
              price: data.price,
              discount: data.discount,
              costPrice: data.costPrice,
              convertedQuantity: data.convertedQuantity,
              total: data.costPrice * data.quantity,
            }
          : it,
      ),
    );
    setIsEditDialogOpen(false);
    setEditingItem(null);
  }, [editForm, editingItem, router]);

  const handleSave = useCallback(async () => {
    if (!order) return;
    if (items.length === 0) {
      toast.error("Order must contain at least one item");
      return;
    }

    const itemsDto: CreatePurchaseOrderItemDto[] = items.map((item) => {
      const dto: CreatePurchaseOrderItemDto = {
        productId: item.productId,
        variantId: item.variantId,
        inventoryId: item.inventoryId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice,
        discount: item.discount,
        purchaseUnitName: item.purchaseUnitName,
      };
      if (item.conversionFactor && item.conversionFactor !== 1) {
        dto.conversionFactor = item.conversionFactor;
      }
      return dto;
    });

    const payload: UpdatePurchaseOrderDto = {
      items: itemsDto,
      additionalDiscount: additionalDiscount || 0,
      invoiceNumber: invoiceNumber || undefined,
      invoiceDate: invoiceDate || undefined,
      notes: notes || undefined,
    };

    try {
      await updateMutation.mutateAsync({ id: order._id, ...payload });
      router.push("/purchases/orders");
    } catch {
      // mutation toasts
    }
  }, [order, items, additionalDiscount, invoiceNumber, invoiceDate, notes, updateMutation, router]);

  const isEditable = order?.status === "ordered" || order?.status === "draft";

  return {
    // Data + loading
    order,
    isLoading,

    // Forms
    supplierForm,
    productForm,
    editForm,

    // UI state
    items,
    editingItem,
    isEditDialogOpen,
    setIsEditDialogOpen,
    setEditingItem,

    // Values
    subtotal,
    computedNet,
    finalNet,
    paidSoFar,
    newDue,
    symbol,
    isUOMEnabled,
    isEditable,

    // Inputs
    additionalDiscount,
    setAdditionalDiscount,
    invoiceAmount,
    setInvoiceAmountState,
    notes,
    setNotes,
    invoiceNumber,
    setInvoiceNumber,
    invoiceDate,
    setInvoiceDate,

    // Configs
    supplierFormConfig,
    productFormConfig,

    // Handlers
    handleProductFieldChange,
    handleAddItem,
    handleRemoveItem,
    handleEditItem,
    handleEditFieldChange,
    handleSaveEdit,
    handleSave,

    // edit form watches
    editQuantity,
    editPrice,
    editDiscount,
    editCostPrice,

    // mutation
    isSaving: updateMutation.isPending,
    formatCurrency,
  } as const;
}

export type UseEditPurchaseOrder = ReturnType<typeof useEditPurchaseOrder>;
