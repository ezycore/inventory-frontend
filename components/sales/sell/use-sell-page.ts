"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  getSalesColumns,
  getPaymentFormConfig,
  groupSaleItemsByCombo,
  type CreateSalesOrderData,
  type ExtractedCustomer,
  type ExtractedProduct,
  type SaleItemPayload,
} from "@/components/sales";
import {
  useCreateSalesOrder,
  useCustomerPendingDues,
  useDefaultAccount,
  useSale,
  useUpdateDraftSale,
  useFinalizeDraftSale,
} from "@/services/api";
import { useBarcodeLookupAction } from "@/services/api/modules/barcode";
import { useAuthStore, useSellPageStore } from "@/services/stores";
import { applyDiscountWithPriority, type DiscountType } from "@/utils/discount";
import { computeOrderTax, type TaxLineInput } from "@/utils/tax";
import { useCurrency } from "@/lib/currency";
import { isTaxActive } from "@/lib/feature-utils";
import {
  orgToPrintHeader,
  printSaleInvoice,
  resolveDefaultPaper,
  type PaperSize,
} from "@/utils/print-documents";
import type { Sale, TaxType } from "@/types";

/**
 * Map cart lines to the tax util's input shape (preview only; backend is authoritative).
 * When the `tax` feature is disabled, tax is neutralized here so every downstream
 * preview (totals, breakdown) is tax-free — mirrors the backend coercion.
 */
const toTaxInputs = (
  items: { price: number; quantity: number; discount: number; taxRate?: number; taxType?: TaxType }[],
  includeTax: boolean,
): TaxLineInput[] =>
  items.map((i) => ({
    price: i.price,
    quantity: i.quantity,
    discount: i.discount,
    taxRate: includeTax ? i.taxRate : 0,
    taxType: includeTax ? i.taxType : undefined,
  }));

/**
 * Map a cart line to its API payload. Combo lines send a `{ comboProductId,
 * quantity, discount }` reference (the server resolves + explodes them); normal
 * lines send the full stock-line shape. `variantId` is normalized to `undefined`
 * so the same payload satisfies both the create and finalize DTOs.
 */
const toSaleItemPayload = (item: {
  isCombo?: boolean;
  comboProductId?: string;
  productId: string;
  inventoryId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  productName: string;
  taxRate?: number;
  taxType?: TaxType;
  batchId?: string | null;
}): SaleItemPayload =>
  item.isCombo && item.comboProductId
    ? { comboProductId: item.comboProductId, quantity: item.quantity, discount: item.discount }
    : {
        productId: item.productId,
        inventoryId: item.inventoryId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice,
        discount: item.discount,
        productName: item.productName,
        taxRate: item.taxRate,
        taxType: item.taxType,
        ...(item.batchId ? { batchId: item.batchId } : {}),
      };

export function useSellPage() {
  const [paidAmount, setPaidAmount] = useState(0);
  const [localAdditionalDiscount, setLocalAdditionalDiscount] = useState(0);
  const [useCreditBalance, setUseCreditBalance] = useState(false);
  const [creditBalanceAmount, setCreditBalanceAmount] = useState(0);
  // The just-completed sale, kept so the cashier can reprint its receipt.
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const { symbol, format: formatCurrency } = useCurrency();

  const { user } = useAuthStore();
  const isAccountsEnabled = user?.organization?.features?.accounts ?? false;
  const isExpiryEnabled = user?.organization?.features?.expiryTracking ?? false;
  const isTaxEnabled = isTaxActive(user?.organization, "sales");
  const defaultCustomer = user?.defaultData?.customerId;
  const defaultAccountType = user?.defaultData?.accountId;

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

  const { mutateAsync, isPending } = useCreateSalesOrder();
  const updateDraftMutation = useUpdateDraftSale();
  const finalizeDraftMutation = useFinalizeDraftSale();

  // ── Draft loading ─────────────────────────────────────────────
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const isDraftMode = !!draftId;
  const { data: draftResp } = useSale(draftId || "");
  const draftSale = draftResp?.data as Sale | undefined;
  const hydratedDraftIdRef = useRef<string | null>(null);

  const { data: pendingDuesResp } = useCustomerPendingDues(customerId || "");
  const customerInfo = pendingDuesResp?.data;
  const customerOutstandingDue: number = customerInfo?.totalDue ?? 0;
  const customerCreditBalance: number = customerInfo?.creditBalance ?? 0;

  const paymentFormConfig = useMemo(
    () => getPaymentFormConfig(isAccountsEnabled),
    [isAccountsEnabled],
  );

  const { data: defaultAccount } = useDefaultAccount();

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

  useEffect(() => {
    setLocalAdditionalDiscount(additionalDiscount);
  }, [additionalDiscount]);

  // Auto-select the default account when accounts are enabled
  useEffect(() => {
    if (!isAccountsEnabled || !defaultAccount?._id) return;
    const current = customerForm.getValues("accountId");
    if (!current) {
      customerForm.setValue("accountId", defaultAccount._id);
    }
  }, [isAccountsEnabled, defaultAccount, customerForm]);

  // Hydrate sell-page store from a draft sale when ?draftId is present
  useEffect(() => {
    if (!draftId) return;
    if (!draftSale || draftSale._id !== draftId) return;
    if (draftSale.status !== "draft") return;
    if (hydratedDraftIdRef.current === draftId) return;
    hydratedDraftIdRef.current = draftId;
    clearAll();

    // Reuse the same logic as the customer-select handler: read the customer's
    // defaultDiscount and apply it. BE nest-populates `defaultDiscountId` as
    // `{ value, type }` on the sale's customer reference.
    const cust = draftSale.customerId;
    const cd = cust?.defaultDiscountId;
    const discountType: "percentage" | "fixed" = cd?.type ?? "percentage";
    const discountValue = cd?.value ?? 0;

    if (cust) {
      setCustomer({
        value: cust._id,
        label: cust.name,
        discountType,
        discountValue,
      });
    }
    setOrderDiscount(discountType, discountValue);
    setAdditionalDiscount(draftSale.additionalDiscount || 0);
    setLocalAdditionalDiscount(draftSale.additionalDiscount || 0);
    setNotes(draftSale.notes || "");

    // Use reset so all fields (customerId, discountValue, notes) initialise
    // together — setValue on its own can race with the dynamic field components.
    customerForm.reset({
      customerId: cust
        ? ({ value: cust._id, label: cust.name } as never)
        : (defaultCustomer as never),
      accountId: defaultAccountType || defaultAccount?._id,
      discountType,
      discountValue,
      paidAmount: 0,
      notes: draftSale.notes || "",
    });

    // A drafted combo is stored as its exploded component lines (tagged with a
    // shared comboLineId + comboUnitQuantity). Regroup them back into ONE combo
    // cart line so the draft restores as a combo, not loose components.
    const comboGroups = groupSaleItemsByCombo(draftSale.items);
    for (const group of comboGroups) {
      if (group.comboLineId) {
        const first = group.items[0];
        const qtyPer = first.comboUnitQuantity || 1;
        const comboQty = Math.max(1, Math.round(first.quantity / qtyPer));
        // comboSubtotal = comboQty × comboPrice → comboPrice = comboSubtotal / comboQty.
        const comboPrice = group.comboSubtotal / comboQty;
        // Per-combo COGS = Σ(componentCost × qty) / comboQty.
        const comboCost =
          group.items.reduce((sum, it) => sum + it.costPrice * it.quantity, 0) /
          comboQty;
        addItem({
          isCombo: true,
          comboProductId: first.comboId ?? first.productId,
          inventoryId: `combo:${first.comboId ?? first.productId}`,
          productId: first.comboId ?? first.productId,
          variantId: null,
          productName: first.comboName ?? "Combo",
          quantity: comboQty,
          price: comboPrice,
          costPrice: comboCost,
          discount: 0,
          discountType: "fixed",
          discountValue: 0,
          salePrice: comboPrice,
          availableQuantity: null,
          taxRate: first.taxRate ?? 0,
          taxType: first.taxType ?? "inclusive",
        });
        continue;
      }

      const item = group.items[0];
      const salePrice = Math.max(0, item.price - (item.discount || 0));
      addItem({
        productId: item.productId,
        inventoryId: item.inventoryId,
        variantId: item.variantId ?? null,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice,
        discount: item.discount || 0,
        discountType: "fixed",
        discountValue: item.discount || 0,
        salePrice,
        availableQuantity: null,
        // Restore per-line tax snapshot from the draft (else finalize loses tax).
        taxRate: item.taxRate ?? 0,
        taxType: item.taxType ?? "inclusive",
      });
    }
  }, [draftId, draftSale, clearAll, setCustomer, setOrderDiscount, setAdditionalDiscount, setNotes, addItem, customerForm, defaultCustomer, defaultAccountType, defaultAccount]);

  useEffect(() => {
    const total = Number(getTotalSalePrice().toFixed(2) || 0);
    const remaining = Math.max(0, total - creditBalanceAmount);
    setPaidAmount(remaining);
    customerForm.setValue("paidAmount", remaining);
  }, [items, additionalDiscount, creditBalanceAmount, getTotalSalePrice, customerForm]);

  useEffect(() => {
    setUseCreditBalance(false);
    setCreditBalanceAmount(0);
  }, [customerId]);

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

  useEffect(() => {
    if (items.length === 0) return;
    items.forEach((item) => {
      const { discount, salePrice } = applyDiscountWithPriority({
        price: item.price,
        orderDiscountType,
        orderDiscountValue,
      });
      if (item.discount !== discount || item.salePrice !== salePrice) {
        updateItem(item.id, { discount, salePrice });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderDiscountType, orderDiscountValue, updateItem]);

  const handleUpdateDiscount = useCallback(
    (id: string, discount: number, price: number) => {
      const salePrice = Math.max(0, price - discount);
      updateItem(id, { discount, salePrice });
    },
    [updateItem],
  );

  const salesColumns = useMemo(
    () =>
      getSalesColumns(
        (id, quantity) => updateItem(id, { quantity }),
        handleUpdateDiscount,
        removeItem,
        symbol,
        (id, batchId) => updateItem(id, { batchId }),
        isExpiryEnabled,
        isTaxEnabled,
      ),
    [updateItem, handleUpdateDiscount, removeItem, symbol, isExpiryEnabled, isTaxEnabled],
  );

  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "customerId") {
        setCustomer(value as ExtractedCustomer);
      } else if (fieldName === "discountType") {
        const currentDiscountValue = customerForm.getValues("discountValue");
        setOrderDiscount(value as DiscountType, currentDiscountValue);
      } else if (fieldName === "discountValue") {
        const currentDiscountType = customerForm.getValues("discountType");
        setOrderDiscount(currentDiscountType, value as number);
      } else if (fieldName === "paidAmount") {
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
        inventoryId, productId, variantId, productName, quantity: 1, costPrice, price,
        discountType, discountValue, discount, salePrice, availableQuantity,
        unitName: product.unitName, saleUnitName: product.saleUnitName,
        hasExpiry: product.hasExpiry,
        taxRate: product.taxRate ?? 0,
        taxType: product.taxType ?? "inclusive",
        // Combo lines carry the combo ref; inventoryId holds the synthetic combo key.
        isCombo: product.isCombo,
        comboProductId: product.comboProductId,
      });
    },
    [addItem, customerForm],
  );

  // Barcode scan-to-add: look up by code → shape into ExtractedProduct → re-use selector
  const lookupBarcode = useBarcodeLookupAction();
  const handleBarcodeScan = useCallback(
    async (code: string) => {
      try {
        const r = await lookupBarcode(code);
        // Combo match: no inventory row — resolve as a combo cart line.
        if ((r as any).isCombo) {
          handleProductSelect({
            value: r._id as string,
            label: r.name,
            price: r.price,
            costPrice: r.costPrice,
            availableQuantity: r.quantity,
            productId: (r as any).comboProductId,
            variantId: null,
            conversionFactor: 1,
            unitName: r.unitName,
            saleUnitName: r.saleUnitName,
            purchaseUnitName: null,
            quantityAlert: 0,
            barcode: r.barcode,
            taxRate: r.taxRate ?? 0,
            taxType: r.taxType ?? "inclusive",
            isCombo: true,
            comboProductId: (r as any).comboProductId,
          });
          return;
        }
        if (!r.hasInventoryAtLocation || !r._id) {
          toast.error(`Product "${r.name}" has no stock at this location`);
          return;
        }
        handleProductSelect({
          value: r._id,
          label: r.name,
          price: r.price,
          costPrice: r.costPrice,
          availableQuantity: r.quantity,
          productId: r.productId,
          variantId: r.variantId,
          conversionFactor: 1,
          unitName: r.unitName,
          saleUnitName: r.saleUnitName,
          purchaseUnitName: null,
          quantityAlert: 0,
          barcode: r.barcode,
          taxRate: r.taxRate ?? 0,
          taxType: r.taxType ?? "inclusive",
        });
      } catch (err: any) {
        toast.error(err?.message || `No product found for "${code}"`);
      }
    },
    [lookupBarcode, handleProductSelect],
  );

  const handleAdditionalDiscountChange = useCallback(
    (value: number) => {
      const v = Math.max(0, value || 0);
      setLocalAdditionalDiscount(v);
      setAdditionalDiscount(v);
      // Grand total = tax-inclusive total after the new discount (tax computed on discounted net).
      const newTotal = computeOrderTax(toTaxInputs(items, isTaxEnabled), v).grandTotal;
      const remaining = Math.max(0, newTotal - creditBalanceAmount);
      setPaidAmount(remaining);
      customerForm.setValue("paidAmount", remaining);
    },
    [creditBalanceAmount, customerForm, items, setAdditionalDiscount, isTaxEnabled],
  );

  const handleMarkAsSold = useCallback(async () => {
    if (items.length === 0) {
      toast.error("Please add items to the order");
      return;
    }
    const accountId = customerForm.getValues("accountId");
    let updatedCustomerId = customerForm.getValues("customerId") as unknown as { value?: string } | string | undefined;
    updatedCustomerId =
      (typeof updatedCustomerId === "object" ? updatedCustomerId?.value : updatedCustomerId) ||
      customerId;
    const formPaidAmount = customerForm.getValues("paidAmount") || 0;
    const formAdditionalDiscount = localAdditionalDiscount;
    if (isAccountsEnabled && formPaidAmount > 0 && !accountId) {
      toast.error("Please select a payment account");
      return;
    }
    if (!updatedCustomerId) {
      toast.error("Please select a customer for the order");
      return;
    }
    try {
      // Tax-inclusive grand total (preview); backend recomputes and is authoritative.
      const totalSalePrice = computeOrderTax(toTaxInputs(items, isTaxEnabled), formAdditionalDiscount).grandTotal;
      const totalCostPrice = getTotalCostPrice();
      const creditApplied = useCreditBalance
        ? Math.min(creditBalanceAmount, customerCreditBalance, totalSalePrice)
        : 0;
      const dueAmount = Math.max(totalSalePrice - formPaidAmount - creditApplied, 0);
      const orderData: CreateSalesOrderData = {
        customerId: updatedCustomerId as string,
        items: items.map(toSaleItemPayload),
        additionalDiscount: formAdditionalDiscount,
        totalPrice: totalSalePrice,
        costPrice: totalCostPrice,
        notes,
      };
      if (isAccountsEnabled && accountId && formPaidAmount > 0) {
        orderData.payment = { paidAmount: formPaidAmount, accountId };
        orderData.dueAmount = dueAmount;
      }
      if (isAccountsEnabled && creditApplied > 0) {
        orderData.creditBalanceAmount = creditApplied;
        orderData.dueAmount = dueAmount;
      }

      let createdSale: Sale | undefined;
      if (isDraftMode && draftId) {
        const finalizeResult = await finalizeDraftMutation.mutateAsync({
          id: draftId,
          customerId: updatedCustomerId as string,
          items: orderData.items,
          additionalDiscount: formAdditionalDiscount,
          payment: orderData.payment,
          creditBalanceAmount: orderData.creditBalanceAmount,
          notes,
        });
        createdSale = finalizeResult.data?.sale as Sale | undefined;
      } else {
        const createResult = await mutateAsync(orderData);
        createdSale = createResult.data?.sale as Sale | undefined;
      }

      if (createdSale) {
        // The create/finalize response isn't populated, so graft the client-known
        // customer name + the logged-in cashier on — otherwise the receipt reads
        // "Walk-in Customer" / "undefined undefined". Item names/totals are
        // denormalized on the doc, so they're already right.
        setLastCompletedSale({
          ...createdSale,
          ...(customerName
            ? { customerId: { name: customerName } as unknown as Sale["customerId"] }
            : {}),
          createdBy: {
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
          } as unknown as Sale["createdBy"],
        });
        clearAll();
        customerForm.reset({ paidAmount: 0, notes: "" });
        setPaidAmount(0);
        setLocalAdditionalDiscount(0);
        setUseCreditBalance(false);
        setCreditBalanceAmount(0);
        if (isDraftMode) {
          hydratedDraftIdRef.current = null;
          router.replace("/sales");
        }
      }
    } catch (error) {
      console.error("Failed to complete sale:", error);
      toast.error("Failed to complete sale");
    }
  }, [items, customerId, customerName, notes, isAccountsEnabled, isTaxEnabled, getTotalCostPrice, clearAll, customerForm, localAdditionalDiscount, useCreditBalance, creditBalanceAmount, customerCreditBalance, mutateAsync, isDraftMode, draftId, finalizeDraftMutation, router, user]);

  // Reprint the just-completed sale's receipt (paper chosen in the PrintMenu).
  const printLastReceipt = useCallback(
    (paper: PaperSize) => {
      if (!lastCompletedSale) return false;
      return printSaleInvoice(lastCompletedSale, {
        paper,
        currency: formatCurrency,
        header: orgToPrintHeader(user?.organization),
      });
    },
    [lastCompletedSale, formatCurrency, user],
  );

  const handleSaveAsDraft = useCallback(async () => {
    if (items.length === 0) {
      toast.error("Please add items to save as draft");
      return;
    }
    let updatedCustomerId = customerForm.getValues("customerId") as unknown as { value?: string } | string | undefined;
    updatedCustomerId =
      (typeof updatedCustomerId === "object" ? updatedCustomerId?.value : updatedCustomerId) ||
      customerId;
    if (!updatedCustomerId) {
      toast.error("Please select a customer for the draft");
      return;
    }
    try {
      const formAdditionalDiscount = localAdditionalDiscount;
      const totalSalePrice = computeOrderTax(toTaxInputs(items, isTaxEnabled), formAdditionalDiscount).grandTotal;
      const totalCostPrice = getTotalCostPrice();
      const itemsPayload = items.map(toSaleItemPayload);

      if (isDraftMode && draftId) {
        await updateDraftMutation.mutateAsync({
          id: draftId,
          customerId: updatedCustomerId as string,
          items: itemsPayload,
          additionalDiscount: formAdditionalDiscount,
          notes,
        });
        hydratedDraftIdRef.current = null;
        clearAll();
        customerForm.reset({ paidAmount: 0, notes: "" });
        setPaidAmount(0);
        setLocalAdditionalDiscount(0);
        setUseCreditBalance(false);
        setCreditBalanceAmount(0);
        router.push("/sales/history?status=draft");
      } else {
        const draftPayload: CreateSalesOrderData = {
          customerId: updatedCustomerId as string,
          items: itemsPayload,
          additionalDiscount: formAdditionalDiscount,
          totalPrice: totalSalePrice,
          costPrice: totalCostPrice,
          notes,
          status: "draft",
        };
        const createResult = await mutateAsync(draftPayload);
        if (createResult.data?.sale?._id) {
          clearAll();
          customerForm.reset({ paidAmount: 0, notes: "" });
          setPaidAmount(0);
          setLocalAdditionalDiscount(0);
          setUseCreditBalance(false);
          setCreditBalanceAmount(0);
          router.push("/sales/history?status=draft");
        }
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [items, customerId, notes, getTotalCostPrice, localAdditionalDiscount, customerForm, isDraftMode, draftId, updateDraftMutation, mutateAsync, clearAll, router, isTaxEnabled]);

  // Preview tax rollup (backend recomputes on save). Grand total drives payment math.
  const taxResult = computeOrderTax(toTaxInputs(items, isTaxEnabled), localAdditionalDiscount);
  const itemsSubtotal = taxResult.itemsSubtotal;
  const taxTotal = taxResult.taxTotal;
  const addedTax = taxResult.addedTax;
  const includedTax = taxResult.includedTax;
  const totalSalePrice = taxResult.grandTotal;
  const appliedCredit = useCreditBalance
    ? Math.min(creditBalanceAmount, customerCreditBalance, totalSalePrice)
    : 0;
  const dueAmount = Math.max(totalSalePrice - paidAmount - appliedCredit, 0);
  const showCustomerBalances = !!customerId && (customerOutstandingDue > 0 || customerCreditBalance > 0);
  const maxCreditApplicable = Math.min(customerCreditBalance, totalSalePrice);

  return {
    // state
    paidAmount,
    localAdditionalDiscount,
    useCreditBalance,
    creditBalanceAmount,
    setUseCreditBalance,
    setCreditBalanceAmount,
    // derived
    customerOutstandingDue,
    customerCreditBalance,
    itemsSubtotal,
    taxTotal,
    addedTax,
    includedTax,
    totalSalePrice,
    appliedCredit,
    dueAmount,
    showCustomerBalances,
    maxCreditApplicable,
    // forms / config
    customerForm,
    paymentFormConfig,
    salesColumns,
    // handlers
    handleFieldChange,
    handleProductSelect,
    handleBarcodeScan,
    handleMarkAsSold,
    handleSaveAsDraft,
    handleAdditionalDiscountChange,
    // receipt (just-completed sale)
    lastCompletedSale,
    printLastReceipt,
    receiptDefaultPaper: resolveDefaultPaper(user?.organization),
    // store passthroughs
    items,
    clearAll,
    isPending,
    isSavingDraft: updateDraftMutation.isPending,
    isFinalizing: finalizeDraftMutation.isPending,
    isDraftMode,
    draftId,
    isAccountsEnabled,
    symbol,
  };
}

export type SellPageContext = ReturnType<typeof useSellPage>;
