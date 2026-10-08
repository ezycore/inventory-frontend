"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useState } from "react";
import { populatedRef } from "@/utils/populated-ref";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  discountForEditedPrice,
  getProductFormConfig,
  getSupplierFormConfig,
  hasDiscountTerms,
  isMrpEdited,
  linePricingAfterEdit,
  makeProductFormSchema,
  openingLinePricing,
  type DiscountTerms,
} from "@/components/purchases";
import { roundMoney } from "@/lib/money";
import { extractProductValue, inventoryIdForApi } from "@/components/sales";
import { isVatActive } from "@/lib/feature-utils";
import { useCurrency } from "@/lib/currency";
import { computeOrderTax, type TaxLineInput } from "@/utils/tax";
import { usePurchaseOrder, useUpdatePurchaseOrder } from "@/services/api";
import { useAuthStore, type PurchaseOrderItem } from "@/services/stores";
import type { CreatePurchaseOrderItemDto, UpdatePurchaseOrderDto } from "@/types";
import type { SupplierFormData } from "@/components/purchases";
import { useRouter } from "next/navigation";

export type ProductFormValues = z.infer<ReturnType<typeof makeProductFormSchema>>;

/**
 * Map edit-PO items to the tax util's input shape. Per-line net is `costPrice *
 * quantity` (costPrice already nets the per-line discount), so `discount` is 0 —
 * the order-level additionalDiscount is passed separately. Mirrors the store.
 */
const toPurchaseTaxInputs = (
  items: PurchaseOrderItem[],
  includeTax: boolean,
): TaxLineInput[] =>
  items.map((i) => ({
    price: i.costPrice,
    quantity: i.quantity,
    discount: 0,
    taxRate: includeTax ? i.taxRate : 0,
    taxType: includeTax ? i.taxType : undefined,
  }));

export function useEditPurchaseOrder(orderId: string | undefined) {
  const router = useRouter();
  const t = useTranslations("purchases");
  const { format: formatCurrency, symbol } = useCurrency();
  const { user } = useAuthStore();
  const isUOMEnabled = user?.organization?.features?.uomConversion ?? false;
  const isTaxEnabled = isVatActive(user?.organization);

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

  const productFormSchema = useMemo(
    () =>
      makeProductFormSchema({
        productRequired: t("form.productRequired"),
        quantityMin: t("form.quantityMin"),
      }),
    [t],
  );

  const supplierForm = useForm<SupplierFormData>({
    defaultValues: {
      supplierId: null,
      purchaseType: "order",
      discountType: "percentage",
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
    },
  });

  const editQuantity = useWatch({ control: editForm.control, name: "quantity", defaultValue: 1 });
  const editPrice = useWatch({ control: editForm.control, name: "price", defaultValue: 0 });
  const editDiscount = useWatch({ control: editForm.control, name: "discount", defaultValue: 0 });
  const editCostPrice = useWatch({ control: editForm.control, name: "costPrice", defaultValue: 0 });

  // Hydrate local edit state from the fetched order. This synchronizes form
  // state with externally-fetched data, so setState here is intentional.
  useEffect(() => {
    if (!order) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          productName: it.productName ?? "Unknown",
          quantity: qty,
          price: it.price,
          // Never carry the stored flag: it was applied when the order was
          // saved, and resending it would revert a later hand edit of the MRP.
          updateMrp: false,
          costPrice,
          discount: Math.max(0, (it.price ?? 0) - costPrice),
          total: costPrice * qty,
          conversionFactor,
          convertedQuantity: qty * conversionFactor,
          purchaseUnitName: it.purchaseUnitName ?? undefined,
          // Carry the per-line tax snapshot so editing doesn't drop tax.
          taxRate: (it as { taxRate?: number }).taxRate,
          taxType: (it as { taxType?: "inclusive" | "exclusive" }).taxType,
        };
      }),
    );
    setAdditionalDiscount(order.additionalDiscount ?? 0);
    setInvoiceAmountState(order.invoiceAmount ?? "");
    setNotes(order.notes ?? "");
    setInvoiceNumber(order.invoiceNumber ?? "");
    setInvoiceDate(order.invoiceDate ? order.invoiceDate.slice(0, 10) : "");

    const sup = populatedRef(order.supplierId);
    const supDiscount = populatedRef(sup?.defaultDiscountId);
    supplierForm.reset({
      supplierId: sup
        ? { value: sup._id, label: sup.name ?? "" }
        : null,
      purchaseType: order.status === "draft" ? "order" : "order",
      discountType: (supDiscount?.type as "percentage" | "fixed" | undefined) ?? "percentage",
      discountValue: supDiscount?.value ?? 0,
      invoiceNumber: order.invoiceNumber ?? "",
      invoiceDate: order.invoiceDate ? order.invoiceDate.slice(0, 10) : "",
    });
  }, [order, supplierForm]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0),
    [items],
  );

  // Tax-correct rollup (per-line, mirrors the create page + backend).
  const taxResult = useMemo(
    () => computeOrderTax(toPurchaseTaxInputs(items, isTaxEnabled), additionalDiscount || 0),
    [items, additionalDiscount, isTaxEnabled],
  );
  const addedTax = taxResult.addedTax;
  const includedTax = taxResult.includedTax;
  const taxTotal = taxResult.taxTotal;

  // Net before tax (cost − additional discount); tax-correct payable adds the
  // exclusive tax on top (inclusive is already inside the cost).
  const computedNet = Math.max(0, subtotal - (additionalDiscount || 0));
  const finalNet = taxResult.grandTotal;
  const paidSoFar = order?.paidAmount ?? 0;
  const newDue = Math.max(0, finalNet - paidSoFar);

  // Discount (per unit) shows only while the order has a supplier discount.
  const supplierDiscountValue = useWatch({ control: supplierForm.control, name: "discountValue" });
  const showDiscount = hasDiscountTerms({ type: "percentage", value: Number(supplierDiscountValue) || 0 });
  const productFormConfig = useMemo(
    () => getProductFormConfig(t, isUOMEnabled, showDiscount),
    [t, isUOMEnabled, showDiscount],
  );
  const discountTerms = useCallback(
    (): DiscountTerms => ({
      type: supplierForm.getValues("discountType") || "percentage",
      value: Number(supplierForm.getValues("discountValue")) || 0,
    }),
    [supplierForm],
  );

  /** Prices the add-product row from its picked product; existing lines are never repriced. */
  const priceOpenRow = useCallback(
    (terms: DiscountTerms, rowPrice?: number) => {
      const product = extractProductValue(productForm.getValues("productId"));
      if (!product) return;
      const conversionFactor = product.conversionFactor || 1;
      const boxPrice = rowPrice ?? product.price * conversionFactor;
      const pricing = openingLinePricing(boxPrice, (product.costPrice || 0) * conversionFactor, terms);
      productForm.setValue("price", pricing.price);
      productForm.setValue("discount", pricing.discount);
      productForm.setValue("costPrice", pricing.costPrice);
    },
    [productForm],
  );

  /** The supplier discount changed: reprice the row being entered, not the order. */
  const handleDiscountValueChange = useCallback(
    (value: number) => {
      priceOpenRow({ ...discountTerms(), value: value || 0 }, productForm.getValues("price") || undefined);
    },
    [priceOpenRow, discountTerms, productForm],
  );
  const supplierFormConfig = useMemo(() => {
    const cfg = getSupplierFormConfig(t);
    return {
      ...cfg,
      fields: cfg.fields.map((f) =>
        ["supplierId", "purchaseType"].includes(f.name) ? { ...f, disabled: true } : f,
      ),
    };
  }, [t]);

  const handleProductFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "productId") {
        const product = extractProductValue(value);
        if (product) {
          const quantity = productForm.getValues("quantity") || 1;
          const conversionFactor = product.conversionFactor || 1;
          productForm.setValue("convertedQuantity", quantity * conversionFactor);
          priceOpenRow(discountTerms());
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
      } else if (fieldName === "price" || fieldName === "discount" || fieldName === "costPrice") {
        const line = {
          price: productForm.getValues("price") || 0,
          discount: productForm.getValues("discount") || 0,
          costPrice: productForm.getValues("costPrice") || 0,
          [fieldName]: (value as number) || 0,
        };
        for (const [key, next] of Object.entries(linePricingAfterEdit(fieldName, line, discountTerms()))) {
          productForm.setValue(key as "price" | "discount" | "costPrice", next);
        }
      }
    },
    [productForm, priceOpenRow, discountTerms],
  );

  const handleAddItem = useCallback(
    (data: ProductFormValues) => {
      const product = extractProductValue(data.productId);
      if (!product) {
        toast.error(t("create.selectProduct"));
        return;
      }
      const conversionFactor = product.conversionFactor || 1;
      const mrpBoxPrice = roundMoney((product.price || 0) * conversionFactor);
      const price = roundMoney(data.price || 0);
      const updateMrp = isMrpEdited(price, mrpBoxPrice);
      const newItem: PurchaseOrderItem = {
        id: uuidv4(),
        productId: product.productId,
        variantId: product.variantId,
        inventoryId: product.value,
        productName: product.label,
        quantity: data.quantity,
        price: updateMrp ? price : mrpBoxPrice,
        updateMrp,
        costPrice: data.costPrice || 0,
        // Stored as price − cost either way: the backend keeps only those two.
        discount: showDiscount ? data.discount || 0 : discountForEditedPrice(updateMrp ? price : mrpBoxPrice, data.costPrice || 0),
        total: (data.costPrice || 0) * data.quantity,
        conversionFactor,
        convertedQuantity: data.convertedQuantity,
        unitName: product.unitName ?? undefined,
        purchaseUnitName: product.purchaseUnitName ?? undefined,
        taxRate: isTaxEnabled ? product.purchaseTaxRate ?? 0 : 0,
        taxType: isTaxEnabled
          ? product.purchaseTaxType ?? "inclusive"
          : undefined,
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
      toast.success(t("edit.productAdded", { name: product.label }));
      // Free samples happen, so a zero cost is allowed — but said out loud.
      if (!((data.costPrice || 0) > 0)) toast.warning(t("form.zeroCostWarning", { name: product.label }));
      productForm.reset({
        productId: "",
        quantity: 1,
        convertedQuantity: 1,
        price: 0,
        discount: 0,
        costPrice: 0,
      });
    },
    [productForm, isTaxEnabled, showDiscount, t],
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
    });
    setIsEditDialogOpen(true);
  }, [editForm]);

  const handleEditFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "quantity") {
        const conversionFactor = editingItem?.conversionFactor || 1;
        editForm.setValue("convertedQuantity", ((value as number) || 1) * conversionFactor);
      } else if (fieldName === "price" || fieldName === "discount" || fieldName === "costPrice") {
        const line = {
          price: editForm.getValues("price") || 0,
          discount: editForm.getValues("discount") || 0,
          costPrice: editForm.getValues("costPrice") || 0,
          [fieldName]: (value as number) || 0,
        };
        for (const [key, next] of Object.entries(linePricingAfterEdit(fieldName, line, discountTerms()))) {
          editForm.setValue(key as "price" | "discount" | "costPrice", next);
        }
      }
    },
    [editForm, editingItem, discountTerms],
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingItem) return;
    const data = editForm.getValues();
    const price = roundMoney(data.price || 0);
    const updateMrp = editingItem.updateMrp === true || isMrpEdited(price, editingItem.price);
    const linePrice = updateMrp ? price : editingItem.price;
    // Without a supplier discount the line's discount is just price − cost, as the backend stores it.
    const discount = showDiscount
      ? data.discount
      : discountForEditedPrice(linePrice, data.costPrice || 0);
    setItems((prev) =>
      prev.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              quantity: data.quantity,
              price: linePrice,
              updateMrp,
              discount,
              costPrice: data.costPrice,
              convertedQuantity: data.convertedQuantity,
              total: data.costPrice * data.quantity,
            }
          : it,
      ),
    );
    setIsEditDialogOpen(false);
    setEditingItem(null);
  }, [editForm, editingItem, showDiscount]);

  const handleSave = useCallback(async () => {
    if (!order) return;
    if (items.length === 0) {
      toast.error(t("edit.orderMinOneItem"));
      return;
    }

    const itemsDto: CreatePurchaseOrderItemDto[] = items.map((item) => {
      const dto: CreatePurchaseOrderItemDto = {
        productId: item.productId,
        variantId: item.variantId,
        inventoryId: inventoryIdForApi(item.inventoryId),
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        updateMrp: item.updateMrp === true,
        costPrice: item.costPrice,
        discount: item.discount,
        taxRate: item.taxRate,
        taxType: item.taxType,
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
  }, [order, items, additionalDiscount, invoiceNumber, invoiceDate, notes, updateMutation, router, t]);

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
    addedTax,
    includedTax,
    taxTotal,
    paidSoFar,
    newDue,
    symbol,
    isUOMEnabled,
    isTaxEnabled,
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
    handleDiscountValueChange,
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
    editShowDiscount: showDiscount,

    // mutation
    isSaving: updateMutation.isPending,
    formatCurrency,
  } as const;
}

export type UseEditPurchaseOrder = ReturnType<typeof useEditPurchaseOrder>;
