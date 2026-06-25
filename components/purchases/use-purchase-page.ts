"use client";

import { getSupplierFormConfig, getProductFormConfig, extractSupplierValue } from "@/components/purchases";
import { extractProductValue } from "@/components/sales";
import { useCurrency } from "@/lib/currency";
import { isTaxActive } from "@/lib/feature-utils";
import { useCreatePurchaseOrder, useFinalizeDraftPurchaseOrder, usePurchaseOrder, useUpdateDraftPurchaseOrder } from "@/services/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { productFormSchema } from "./form-configs";
import { usePurchasePageStore, useAuthStore } from "@/services/stores";
import { useBarcodeLookupAction } from "@/services/api/modules/barcode";

export function usePurchasePage() {
  const { format: formatCurrency, symbol } = useCurrency();

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);

  const lowStockImport = useMemo<{ ids: string[]; shouldOpen: boolean }>(() => {
    if (typeof window === "undefined") return { ids: [], shouldOpen: false };
    try {
      const stored = sessionStorage.getItem("lowstock-import-ids");
      if (!stored) return { ids: [], shouldOpen: false };
      sessionStorage.removeItem("lowstock-import-ids");
      const ids = JSON.parse(stored) as string[];
      if (Array.isArray(ids) && ids.length > 0) return { ids, shouldOpen: true };
    } catch {
      // ignore
    }
    return { ids: [], shouldOpen: false };
  }, []);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(() => lowStockImport.shouldOpen);
  const [preSelectedLowStockIds, setPreSelectedLowStockIds] = useState<string[]>(() => lowStockImport.ids);

  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const isUOMEnabled = user?.organization?.features?.uomConversion ?? false;
  const isTaxEnabled = isTaxActive(user?.organization, "purchase");
  const isExpiryEnabled = user?.organization?.features?.expiryTracking ?? false;

  const {
    sellers,
    activeSellerIndex,
    getSellerSubtotal,
    getSellerTotal,
    getSellerNetAmount,
    getSellerTax,
    getSellerAddedTax,
    getSellerIncludedTax,
    getSellerDueAmount,
    getGrandTotal,
    getTotalItemCount,
    addSeller,
    removeSeller,
    setActiveSeller,
    setSupplier,
    setPurchaseType,
    setAdditionalDiscount,
    setInvoiceNumber,
    setInvoiceDate,
    setDiscountType,
    setDiscountValue,
    setNotes,
    addItem,
    updateItem,
    removeItem,
    clearSellerItems,
    clearAll,
  } = usePurchasePageStore();

  const activeSeller = sellers[activeSellerIndex];

  const { mutateAsync, isPending } = useCreatePurchaseOrder();
  const updateDraftMutation = useUpdateDraftPurchaseOrder();
  const finalizeDraftMutation = useFinalizeDraftPurchaseOrder();

  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const isDraftMode = !!draftId;
  const draftResp = usePurchaseOrder(draftId || "");
  const draftOrder = draftResp?.data?.data as any | undefined;
  const hydratedDraftIdRef = useRef<string | null>(null);

  const supplierFormConfig = useMemo(() => getSupplierFormConfig(isDraftMode), [isDraftMode]);
  const productFormConfig = useMemo(() => getProductFormConfig(isUOMEnabled), [isUOMEnabled]);

  const supplierForm = useForm({
    defaultValues: {
      supplierId: activeSeller?.supplierId ? { value: activeSeller.supplierId, label: activeSeller.supplierName || "" } : null,
      purchaseType: activeSeller?.purchaseType || "instant",
      discountType: activeSeller?.discountType || "percentage",
      discountValue: activeSeller?.discountValue || 0,
      invoiceNumber: activeSeller?.invoiceNumber || "",
      invoiceDate: activeSeller?.invoiceDate || "",
    },
  });

  const productForm = useForm({
    resolver: zodResolver(productFormSchema as any),
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

  const editForm = useForm({
    resolver: zodResolver(productFormSchema as any),
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

  useEffect(() => {
    if (!draftId || !draftOrder) return;
    if (draftOrder._id !== draftId) return;
    if (draftOrder.status !== "draft") return;
    if (hydratedDraftIdRef.current === draftId) return;
    hydratedDraftIdRef.current = draftId;

    clearAll();
    const state = usePurchasePageStore.getState();
    const sellerId = state.sellers[0]?.id;
    if (!sellerId) return;

    const supplierObj = typeof draftOrder.supplierId === "object" && draftOrder.supplierId ? draftOrder.supplierId : null;
    const supId = supplierObj?._id || (draftOrder.supplierId as unknown as string);
    const supName = supplierObj?.name || "";
    const supDiscount = supplierObj?.defaultDiscountId && typeof supplierObj.defaultDiscountId === "object" ? supplierObj.defaultDiscountId : null;
    const discountType: "percentage" | "fixed" = supDiscount?.type ?? "percentage";
    const discountValue = supDiscount?.value ?? 0;

    setSupplier(sellerId, supId, supName);
    setPurchaseType(sellerId, "instant");
    if (draftOrder.invoiceNumber) setInvoiceNumber(sellerId, draftOrder.invoiceNumber);
    if (draftOrder.invoiceDate) setInvoiceDate(sellerId, String(draftOrder.invoiceDate).slice(0, 10));
    setDiscountType(sellerId, discountType);
    setDiscountValue(sellerId, discountValue);
    if (draftOrder.notes) setNotes(sellerId, draftOrder.notes);

    for (const it of draftOrder.items || []) {
      const productIdStr = typeof it.productId === "object" && it.productId ? (it.productId as any)._id : (it.productId as string);
      const variantIdStr = it.variantId ? (typeof it.variantId === "object" ? (it.variantId as any)._id : (it.variantId as string)) : null;
      const inventoryIdStr = typeof it.inventoryId === "object" && it.inventoryId ? (it.inventoryId as any)._id : (it.inventoryId as string);
      const cf = it.conversionFactor ?? 1;
      const perUnitDiscount = Math.max(0, (it.price || 0) - (it.costPrice || 0));
      addItem(sellerId, {
        productId: productIdStr,
        variantId: variantIdStr,
        inventoryId: inventoryIdStr,
        productName: it.productName,
        quantity: it.quantity,
        costPrice: it.costPrice,
        price: it.price,
        discount: perUnitDiscount,
        conversionFactor: cf,
        purchaseUnitName: it.purchaseUnitName ?? undefined,
        unitName: it.unitName ?? undefined,
        // Restore per-line tax snapshot from the draft.
        taxRate: (it as { taxRate?: number }).taxRate,
        taxType: (it as { taxType?: "inclusive" | "exclusive" }).taxType,
      });
    }
    // Set additionalDiscount AFTER items are added so the store can correctly
    // clamp it against the actual subtotal (not zero). Tax is derived per-line.
    setAdditionalDiscount(sellerId, draftOrder.additionalDiscount || 0);

    supplierForm.reset({
      supplierId: { value: supId, label: supName } as never,
      purchaseType: "instant",
      discountType,
      discountValue,
      invoiceNumber: draftOrder.invoiceNumber || "",
      invoiceDate: draftOrder.invoiceDate ? String(draftOrder.invoiceDate).slice(0, 10) : "",
    });
  }, [draftId, draftOrder, addItem, clearAll, setAdditionalDiscount, setDiscountType, setDiscountValue, setInvoiceDate, setInvoiceNumber, setNotes, setPurchaseType, setSupplier, supplierForm]);

  const editQuantity = useWatch({ control: editForm.control, name: "quantity", defaultValue: 1 });
  const editConvertedQuantity = useWatch({ control: editForm.control, name: "convertedQuantity", defaultValue: 1 });
  const editPrice = useWatch({ control: editForm.control, name: "price", defaultValue: 0 });
  const editDiscount = useWatch({ control: editForm.control, name: "discount", defaultValue: 0 });
  const editCostPrice = useWatch({ control: editForm.control, name: "costPrice", defaultValue: 0 });
  const editRememberCostPrice = useWatch({ control: editForm.control, name: "rememberCostPrice", defaultValue: false });

  const handleEditItem = useCallback((sellerId: string, item: any) => {
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
  }, [editForm]);

  // Barcode scan-to-add-row for purchase orders.
  // Looks up by code, then appends a row to the active seller's cart with qty 1.
  const lookupBarcode = useBarcodeLookupAction();
  const handleBarcodeScan = useCallback(
    async (code: string) => {
      try {
        const r = await lookupBarcode(code);
        const state = usePurchasePageStore.getState();
        const sellerId = state.sellers[state.activeSellerIndex]?.id;
        if (!sellerId) {
          toast.error("Add a supplier first");
          return;
        }
        if (!r._id) {
          toast.error(
            `No inventory record for "${r.name}" at this location yet — open it in Inventory first.`,
          );
          return;
        }
        addItem(sellerId, {
          productId: r.productId,
          variantId: r.variantId,
          inventoryId: r._id,
          productName: r.name,
          quantity: 1,
          costPrice: r.costPrice || r.price,
          price: r.price,
          discount: 0,
          conversionFactor: 1,
          purchaseUnitName: undefined,
          unitName: r.unitName || undefined,
          // Per-line purchase tax from the scanned product (neutralized when tax inactive).
          taxRate: isTaxEnabled ? r.purchaseTaxRate ?? 0 : 0,
          taxType: isTaxEnabled ? r.purchaseTaxType ?? "inclusive" : undefined,
        });
      } catch (err: any) {
        toast.error(err?.message || `No product found for "${code}"`);
      }
    },
    [addItem, lookupBarcode, isTaxEnabled],
  );

  const handleSupplierFieldChange = useCallback((fieldName: string, value: unknown) => {
    const state = usePurchasePageStore.getState();
    const current = state.sellers[state.activeSellerIndex];
    if (!current) return;
    if (fieldName === "supplierId") {
      const supplier = extractSupplierValue(value as any);
      let targetSellerId = current.id;
      if (current.items.length > 0 && supplier.value !== current.supplierId) {
        const existingSellerIndex = state.sellers.findIndex((s) => s.supplierId === supplier.value);
        if (existingSellerIndex !== -1) {
          setActiveSeller(existingSellerIndex);
          targetSellerId = state.sellers[existingSellerIndex].id;
        } else {
          // Current seller already has items — create a fresh session for the new supplier
          targetSellerId = addSeller();
        }
      }
      setSupplier(targetSellerId, supplier.value, supplier.label);
      setDiscountType(targetSellerId, supplier.defaultDiscountType);
      setDiscountValue(targetSellerId, supplier.defaultDiscountValue);
      supplierForm.setValue("discountType", supplier.defaultDiscountType);
      supplierForm.setValue("discountValue", supplier.defaultDiscountValue);
    } else if (fieldName === "discountType") {
      setDiscountType(current.id, value as any);
    } else if (fieldName === "discountValue") {
      setDiscountValue(current.id, value as number);
    } else if (fieldName === "purchaseType") {
      setPurchaseType(current.id, value as any);
    } else if (fieldName === "invoiceNumber") {
      setInvoiceNumber(current.id, value as string);
    } else if (fieldName === "invoiceDate") {
      setInvoiceDate(current.id, value as string);
    }
  }, [addSeller, setActiveSeller, setSupplier, setPurchaseType, setInvoiceNumber, setInvoiceDate, setDiscountType, setDiscountValue, supplierForm]);

  const handleProductFieldChange = useCallback((fieldName: string, value: unknown) => {
    if (fieldName === "productId") {
      const product = extractProductValue(value);
      if (product) {
        const availableStock = product.availableQuantity || 0;
        const neededQuantity = Math.max(1, product.quantityAlert - (availableStock) + 1);
        const purchaseQuantity = Math.ceil(neededQuantity / (product.conversionFactor || 1));
        const quantity = productForm.getValues("quantity") || 1;
        const conversionFactor = product.conversionFactor || 1;
        const convertedQuantity = quantity * conversionFactor;
        const perUnitPrice = product.price;
        const boxPrice = perUnitPrice * conversionFactor;
        const discountType = supplierForm.getValues("discountType") || "percentage";
        const discountValue = supplierForm.getValues("discountValue") || 0;
        const stock = product.purchaseUnitName ? `${Math.floor(availableStock / conversionFactor)} ${product.purchaseUnitName} ${availableStock % conversionFactor > 0 ? `${availableStock % conversionFactor} ${product.unitName}` : ""}` : `${availableStock} ${product.unitName}`;
        let boxDiscount = 0;
        if (discountType === "percentage") boxDiscount = parseFloat(((boxPrice * discountValue) / 100).toFixed(2));
        else boxDiscount = discountValue;
        const boxCostPrice = Math.max(0, boxPrice - boxDiscount);
        productForm.setValue("stock", stock);
        productForm.setValue("quantity", purchaseQuantity);
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
  }, [productForm, supplierForm]);

  const handleAddToOrder = useCallback((data: any) => {
    const supplierValue = supplierForm.getValues("supplierId");
    const supplier = extractSupplierValue(supplierValue);
    if (!supplier.value) { toast.error("Please select a supplier first"); return; }
    const storeState = usePurchasePageStore.getState();
    let currentSeller = storeState.sellers[storeState.activeSellerIndex];
    if (!currentSeller || currentSeller.supplierId !== supplier.value) {
      const existingSellerIndex = storeState.sellers.findIndex((s) => s.supplierId === supplier.value);
      if (existingSellerIndex !== -1) { setActiveSeller(existingSellerIndex); currentSeller = storeState.sellers[existingSellerIndex]; }
      else if (currentSeller && currentSeller.items.length === 0) { setSupplier(currentSeller.id, supplier.value, supplier.label); }
      else { const newSellerId = addSeller(); setSupplier(newSellerId, supplier.value, supplier.label); const newState = usePurchasePageStore.getState(); currentSeller = newState.sellers[newState.activeSellerIndex]; }
    }
    const product = extractProductValue(data.productId);
    if (!product) { toast.error("Please select a product"); return; }
    const conversionFactor = product.conversionFactor || 1;
    const boxPrice = product.price * conversionFactor;
    addItem(currentSeller.id, { inventoryId: product.value, productId: product.productId, variantId: product.variantId, productName: product.label, quantity: data.quantity, price: boxPrice, costPrice: data.costPrice, discount: data.discount, conversionFactor, convertedQuantity: data.convertedQuantity, unitName: product.unitName ?? undefined, purchaseUnitName: product.purchaseUnitName ?? undefined,
      // Per-line purchase tax from the product (neutralized when tax is inactive).
      taxRate: isTaxEnabled ? product.purchaseTaxRate ?? 0 : 0,
      taxType: isTaxEnabled ? product.purchaseTaxType ?? "inclusive" : undefined,
    });
    toast.success(`${product.label} added to order`);
    productForm.reset({ productId: "", quantity: 1, convertedQuantity: 1, price: 0, discount: 0, costPrice: 0, rememberCostPrice: false });
  }, [addItem, productForm, supplierForm, setActiveSeller, setSupplier, addSeller, isTaxEnabled]);

  const handleSaveEdit = useCallback(() => {
    if (!editingItem || !editingSellerId) return;
    const data = editForm.getValues();
    updateItem(editingSellerId, editingItem.id, { quantity: data.quantity, discount: data.discount, costPrice: data.costPrice, convertedQuantity: data.convertedQuantity });
    toast.success("Item updated successfully");
    setIsEditDialogOpen(false);
    setEditingItem(null);
    setEditingSellerId(null);
  }, [editingItem, editingSellerId, editForm, updateItem]);

  const handleEditFieldChange = useCallback((fieldName: string, value: unknown) => {
    if (fieldName === "quantity") {
      const product = extractProductValue(editForm.getValues("productId"));
      if (product) { const quantity = (value as number) || 1; const conversionFactor = product.conversionFactor || 1; editForm.setValue("convertedQuantity", quantity * conversionFactor); }
    } else if (fieldName === "discount") {
      const boxPrice = editForm.getValues("price") || 0; const boxDiscount = (value as number) || 0; editForm.setValue("costPrice", Math.max(0, boxPrice - boxDiscount));
    }
  }, [editForm]);

  const handleImportLowStock = useCallback((result: any) => {
    const storeState = usePurchasePageStore.getState();
    let currentSeller = storeState.sellers[storeState.activeSellerIndex];
    if (!currentSeller || currentSeller.supplierId !== result.supplierId) {
      const existingSellerIndex = storeState.sellers.findIndex((s) => s.supplierId === result.supplierId);
      if (existingSellerIndex !== -1) { setActiveSeller(existingSellerIndex); currentSeller = storeState.sellers[existingSellerIndex]; }
      else if (currentSeller && currentSeller.items.length === 0) { setSupplier(currentSeller.id, result.supplierId, result.supplierName); currentSeller = usePurchasePageStore.getState().sellers[usePurchasePageStore.getState().activeSellerIndex]; }
      else { const newSellerId = addSeller(); setSupplier(newSellerId, result.supplierId, result.supplierName); const newState = usePurchasePageStore.getState(); currentSeller = newState.sellers[newState.activeSellerIndex]; }
    }
    setPurchaseType(currentSeller.id, result.purchaseType);
    setDiscountType(currentSeller.id, result.discountType);
    setDiscountValue(currentSeller.id, result.discountValue);
    supplierForm.setValue("supplierId", { value: result.supplierId, label: result.supplierName } as any);
    supplierForm.setValue("purchaseType", result.purchaseType);
    supplierForm.setValue("discountType", result.discountType);
    supplierForm.setValue("discountValue", result.discountValue);
    let addedCount = 0;
    for (const item of result.items) { addItem(currentSeller.id, { inventoryId: item.inventoryId, productId: item.productId, variantId: item.variantId, productName: item.productName, quantity: item.quantity, price: item.price, costPrice: item.costPrice, discount: item.discount, conversionFactor: item.conversionFactor, convertedQuantity: item.convertedQuantity, unitName: item.unitName ?? undefined, purchaseUnitName: item.purchaseUnitName ?? undefined,
      // Per-line purchase tax from the imported product (neutralized when tax inactive).
      taxRate: isTaxEnabled ? item.purchaseTaxRate ?? 0 : 0,
      taxType: isTaxEnabled ? item.purchaseTaxType ?? "inclusive" : undefined,
    }); addedCount++; }
    toast.success(`${addedCount} ${addedCount === 1 ? "product" : "products"} imported to order`);
  }, [addItem, supplierForm, setActiveSeller, setSupplier, addSeller, setPurchaseType, setDiscountType, setDiscountValue, isTaxEnabled]);

  const sellersWithItems = useMemo(() => sellers.filter((s) => s.items.length > 0), [sellers]);
  const totalItemCount = getTotalItemCount();
  const grandTotal = getGrandTotal();
  const grandTax = useMemo(() => sellersWithItems.reduce((sum, s) => sum + getSellerTax(s.id), 0), [sellersWithItems, getSellerTax]);
  const grandAddedTax = useMemo(() => sellersWithItems.reduce((sum, s) => sum + getSellerAddedTax(s.id), 0), [sellersWithItems, getSellerAddedTax]);
  const grandIncludedTax = useMemo(() => sellersWithItems.reduce((sum, s) => sum + getSellerIncludedTax(s.id), 0), [sellersWithItems, getSellerIncludedTax]);
  const grandPaid = useMemo(() => sellersWithItems.reduce((sum, s) => sum + (s.paymentInfo?.paidAmount || 0), 0), [sellersWithItems]);
  const grandCreditApplied = useMemo(() => sellersWithItems.reduce((sum, s) => sum + (s.creditApplied || 0), 0), [sellersWithItems]);
  const grandDue = useMemo(() => sellersWithItems.reduce((sum, s) => sum + getSellerDueAmount(s.id), 0), [sellersWithItems, getSellerDueAmount]);

  const handleCompleteOrder = useCallback(async () => {
    const validSellers = sellers.filter((s) => s.items.length > 0 && s.supplierId);
    if (validSellers.length === 0) { toast.error("Please add items to at least one supplier"); return; }
    try {
      const ordersData: any[] = validSellers.map((seller) => {
        const isInstant = seller.purchaseType === "instant";
        const items = seller.items.map((item: any) => ({ inventoryId: item.inventoryId, productId: item.productId, variantId: item.variantId, productName: item.productName, quantity: item.quantity, price: item.price, costPrice: item.costPrice, discount: item.discount, conversionFactor: item.conversionFactor, taxRate: item.taxRate, taxType: item.taxType,
          // Per-line expiry-batch — only sent for instant (received-on-create) and
          // only honoured by the backend for expiry-tracked products.
          ...(isExpiryEnabled && isInstant && item.expiryDate ? { expiryDate: item.expiryDate } : {}),
          ...(isExpiryEnabled && isInstant && item.batchNumber ? { batchNumber: item.batchNumber } : {}),
        }));
        const status = isInstant ? "received" : "ordered";
        const netAmount = getSellerNetAmount(seller.id);
        const sellerPaid = seller.paymentInfo?.paidAmount || 0;
        const sellerAccountId = seller.paymentInfo?.accountId || "";
        const sellerCredit = seller.creditApplied || 0;
        const orderData: any = { supplierId: seller.supplierId || "", items, additionalDiscount: seller.additionalDiscount || 0, status, invoiceNumber: seller.invoiceNumber || undefined, invoiceDate: seller.invoiceDate || undefined, notes: seller.notes || undefined };
        if (isAccountsEnabled && sellerAccountId && sellerPaid > 0) orderData.payment = { accountId: sellerAccountId, paidAmount: sellerPaid };
        if (isAccountsEnabled && sellerCredit > 0) orderData.creditBalanceAmount = sellerCredit;
        return orderData;
      });
      if (isDraftMode && draftId) {
        const first = ordersData[0];
        await finalizeDraftMutation.mutateAsync({ id: draftId, data: { supplierId: first.supplierId, items: first.items, additionalDiscount: first.additionalDiscount, taxTotal: first.taxTotal, status: first.status === "received" || first.status === "ordered" ? first.status : "ordered", invoiceNumber: first.invoiceNumber, invoiceDate: first.invoiceDate, payment: first.payment, creditBalanceAmount: first.creditBalanceAmount, notes: first.notes } });
        hydratedDraftIdRef.current = null;
        clearAll();
        supplierForm.reset({ supplierId: null, purchaseType: "instant", discountType: "percentage", discountValue: 0, invoiceNumber: "", invoiceDate: "" });
        productForm.reset();
        router.replace("/purchases/history");
        return;
      }
      await mutateAsync(ordersData);
      clearAll();
      supplierForm.reset({ supplierId: null, purchaseType: "instant", discountType: "percentage", discountValue: 0, invoiceNumber: "", invoiceDate: "" });
      productForm.reset();
    } catch (error) { console.error("Failed to complete purchase:", error); toast.error("Failed to complete purchase"); }
  }, [sellers, isAccountsEnabled, isExpiryEnabled, getSellerNetAmount, mutateAsync, clearAll, supplierForm, productForm, isDraftMode, draftId, finalizeDraftMutation, router]);

  const handleSaveAsDraft = useCallback(async () => {
    const validSellers = sellers.filter((s) => s.items.length > 0 && s.supplierId);
    if (validSellers.length === 0) { toast.error("Please add items to at least one supplier"); return; }
    try {
      const ordersData: any[] = validSellers.map((seller) => ({ supplierId: seller.supplierId || "", items: seller.items.map((item: any) => ({ inventoryId: item.inventoryId, productId: item.productId, variantId: item.variantId, productName: item.productName, quantity: item.quantity, price: item.price, costPrice: item.costPrice, discount: item.discount, conversionFactor: item.conversionFactor, taxRate: item.taxRate, taxType: item.taxType })), additionalDiscount: seller.additionalDiscount || 0, status: "draft", invoiceNumber: seller.invoiceNumber || undefined, invoiceDate: seller.invoiceDate || undefined, notes: seller.notes || undefined }));
      if (isDraftMode && draftId) {
        const first = ordersData[0];
        await updateDraftMutation.mutateAsync({ id: draftId, data: { supplierId: first.supplierId, items: first.items, additionalDiscount: first.additionalDiscount, taxTotal: first.taxTotal, invoiceNumber: first.invoiceNumber, invoiceDate: first.invoiceDate, notes: first.notes } });
        hydratedDraftIdRef.current = null;
        clearAll();
        supplierForm.reset({ supplierId: null, purchaseType: "instant", discountType: "percentage", discountValue: 0, invoiceNumber: "", invoiceDate: "" });
        productForm.reset();
        router.push("/purchases/history?status=draft");
        return;
      }
      await mutateAsync(ordersData);
      clearAll();
      supplierForm.reset({ supplierId: null, purchaseType: "instant", discountType: "percentage", discountValue: 0, invoiceNumber: "", invoiceDate: "" });
      productForm.reset();
      router.push("/purchases/history?status=draft");
    } catch (error) { console.error("Failed to save purchase draft:", error); toast.error("Failed to save draft"); }
  }, [sellers, mutateAsync, clearAll, supplierForm, productForm, isDraftMode, draftId, updateDraftMutation, router]);

  return {
    formatCurrency,
    symbol,
    suppliers: sellers,
    sellers,
    activeSeller,
    sellersWithItems,
    totalItemCount,
    grandTotal,
    grandTax,
    grandAddedTax,
    grandIncludedTax,
    grandPaid,
    grandCreditApplied,
    grandDue,
    supplierForm,
    productForm,
    editForm,
    editingItem,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editQuantity,
    editConvertedQuantity,
    editPrice,
    editDiscount,
    editCostPrice,
    editRememberCostPrice,
    supplierFormConfig,
    productFormConfig,
    handleSupplierFieldChange,
    handleProductFieldChange,
    handleAddToOrder,
    handleBarcodeScan,
    handleEditItem,
    handleSaveEdit,
    handleEditFieldChange,
    handleImportLowStock,
    handleCompleteOrder,
    handleSaveAsDraft,
    getSellerSubtotal,
    getSellerTotal,
    getSellerNetAmount,
    getSellerTax,
    getSellerAddedTax,
    getSellerIncludedTax,
    getSellerDueAmount,
    getGrandTotal,
    getTotalItemCount,
    addSeller,
    removeSeller,
    setActiveSeller,
    setSupplier,
    setPurchaseType,
    setAdditionalDiscount,
    setInvoiceNumber,
    setInvoiceDate,
    setDiscountType,
    setDiscountValue,
    addItem,
    updateItem,
    removeItem,
    clearSellerItems,
    clearAll,
    isImportDialogOpen,
    setIsImportDialogOpen,
    preSelectedLowStockIds,
    setPreSelectedLowStockIds,
    isPending,
    updateDraftMutation,
    finalizeDraftMutation,
    isAccountsEnabled,
    isUOMEnabled,
    isTaxEnabled,
    isExpiryEnabled,
    isDraftMode,
  };
}

export default usePurchasePage;
