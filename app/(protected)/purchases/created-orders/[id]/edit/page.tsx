"use client";

import {
  extractSupplierValue,
  getProductFormConfig,
  getPurchaseColumns,
  getSupplierFormConfig,
  type SupplierFormData,
} from "@/components/purchases";
import { extractProductValue } from "@/components/sales";
import { useCurrency } from "@/lib/currency";
import {
  usePurchaseOrder,
  useUpdatePurchaseOrder,
} from "@/services/api";
import { useAuthStore, type PurchaseOrderItem } from "@/services/stores";
import type { CreatePurchaseOrderItemDto, UpdatePurchaseOrderDto } from "@/types";
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
import { Skeleton } from "@/ui/components/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ClipboardList, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
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
      purchaseUnitName: z.string().nullable().optional(),
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

type ProductFormData = z.infer<typeof productFormSchema>;

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const { format: formatCurrency, symbol } = useCurrency();
  const { user } = useAuthStore();
  const isUOMEnabled = user?.organization?.features?.uomConversion ?? false;

  const { data: orderResponse, isLoading } = usePurchaseOrder(orderId);
  const order = orderResponse?.data;

  const updateMutation = useUpdatePurchaseOrder();

  // Local editable state
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [invoiceAmount, setInvoiceAmountState] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  // Edit dialog state
  const [editingItem, setEditingItem] = useState<PurchaseOrderItem | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const supplierFormConfig = useMemo(() => {
    const cfg = getSupplierFormConfig();
    // In edit mode, supplier and purchase type are not changeable here.
    return {
      ...cfg,
      fields: cfg.fields.map((f) =>
        ["supplierId", "purchaseType"].includes(f.name)
          ? { ...f, disabled: true }
          : f,
      ),
    };
  }, []);
  const productFormConfig = useMemo(
    () => getProductFormConfig(isUOMEnabled),
    [isUOMEnabled],
  );

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
      stock: "",
    },
  });

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

  const editQuantity = useWatch({ control: editForm.control, name: "quantity", defaultValue: 1 });
  const editPrice = useWatch({ control: editForm.control, name: "price", defaultValue: 0 });
  const editDiscount = useWatch({ control: editForm.control, name: "discount", defaultValue: 0 });
  const editCostPrice = useWatch({ control: editForm.control, name: "costPrice", defaultValue: 0 });

  // Hydrate from server data once available
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
          discount: it.discount ?? 0,
          total: costPrice * qty * conversionFactor,
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
    setInvoiceDate(
      order.invoiceDate ? order.invoiceDate.slice(0, 10) : "",
    );

    supplierForm.reset({
      supplierId: order.supplierId
        ? {
            value: order.supplierId._id ?? (order.supplierId as unknown as string),
            label: order.supplierId.name ?? "",
          }
        : null,
      purchaseType: order.status === "draft" ? "order" : "order",
      discountType: "fixed",
      discountValue: 0,
      invoiceNumber: order.invoiceNumber ?? "",
      invoiceDate: order.invoiceDate ? order.invoiceDate.slice(0, 10) : "",
    });
  }, [order, supplierForm]);

  // Recompute totals whenever items / additionalDiscount change
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.costPrice * (item.convertedQuantity || item.quantity),
        0,
      ),
    [items],
  );
  console.log("Recomputed subtotal:", subtotal);
  const computedNet = Math.max(0, subtotal - (additionalDiscount || 0));
  console.log("Recomputed net:", computedNet);
  const finalNet = computedNet || Number(invoiceAmount) || 0;
  const paidSoFar = order?.paidAmount ?? 0;
  const newDue = Math.max(0, finalNet - paidSoFar);

  // ---- Add product (line) ----
  const handleProductFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "productId") {
        const product = extractProductValue(value);
        if (product) {
          const quantity = productForm.getValues("quantity") || 1;
          const conversionFactor = product.conversionFactor || 1;
          const boxPrice = product.price * conversionFactor;
          productForm.setValue("convertedQuantity", quantity * conversionFactor);
          productForm.setValue("price", boxPrice);
          productForm.setValue("discount", 0);
          productForm.setValue("costPrice", boxPrice);
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
    [productForm],
  );

  const handleAddItem = useCallback(
    (data: ProductFormData) => {
      const product = extractProductValue(data.productId);
      if (!product) {
        toast.error("Please select a product");
        return;
      }
      const conversionFactor = product.conversionFactor || 1;
      // Convert pack-level form inputs to per-unit (DB shape).
      const perUnitPrice = (data.price || 0) / conversionFactor;
      const perUnitCostPrice = (data.costPrice || 0) / conversionFactor;
      const perUnitDiscount = (data.discount || 0) / conversionFactor;
      const newItem: PurchaseOrderItem = {
        id: uuidv4(),
        productId: product.productId,
        variantId: product.variantId,
        inventoryId: product.value,
        productName: product.label,
        quantity: data.quantity,
        price: perUnitPrice,
        costPrice: perUnitCostPrice,
        discount: perUnitDiscount,
        total: perUnitCostPrice * data.convertedQuantity,
        conversionFactor,
        convertedQuantity: data.convertedQuantity,
        unitName: product.unitName ?? undefined,
        purchaseUnitName: product.purchaseUnitName ?? undefined,
      };
      setItems((prev) => [...prev, newItem]);
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

  // ---- Edit line item ----
  const handleEditItem = useCallback(
    (_sellerId: string, item: PurchaseOrderItem) => {
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
    },
    [editForm],
  );

  const handleEditFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      if (fieldName === "quantity") {
        const conversionFactor = editingItem?.conversionFactor || 1;
        editForm.setValue(
          "convertedQuantity",
          ((value as number) || 1) * conversionFactor,
        );
      } else if (fieldName === "discount") {
        const boxPrice = editForm.getValues("price") || 0;
        editForm.setValue(
          "costPrice",
          Math.max(0, boxPrice - ((value as number) || 0)),
        );
      } else if (fieldName === "costPrice") {
        const boxPrice = editForm.getValues("price") || 0;
        editForm.setValue(
          "discount",
          Math.max(0, boxPrice - ((value as number) || 0)),
        );
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
              total: data.costPrice * data.convertedQuantity,
            }
          : it,
      ),
    );
    toast.success("Item updated");
    setIsEditDialogOpen(false);
    setEditingItem(null);
  }, [editForm, editingItem]);

  // ---- Save the whole order ----
  const handleSave = useCallback(async () => {
    if (!order) return;
    if (items.length === 0) {
      toast.error("Order must contain at least one item");
      return;
    }

    const itemsDto: CreatePurchaseOrderItemDto[] = items.map((item) => {
      // Values in local state are already per-unit (matches DB shape).
      // Do NOT divide by conversionFactor here.
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
      router.push("/purchases/created-orders");
    } catch {
      // toast handled by mutation
    }
  }, [
    order,
    items,
    additionalDiscount,
    invoiceNumber,
    invoiceDate,
    notes,
    updateMutation,
    router,
  ]);

  if (isLoading || !order) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const isEditable = order.status === "ordered" || order.status === "draft";

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/purchases/created-orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Purchase Order</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {order.orderNumber}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {order.status}
        </Badge>
      </div>

      {!isEditable && (
        <Card className="mb-4 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="pt-4 pb-3 text-sm text-orange-700 dark:text-orange-300">
            This order is in <b>{order.status}</b> status and cannot be edited.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          {/* Supplier */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  1
                </span>
                <h3 className="font-semibold text-sm">Supplier & Invoice</h3>
              </div>
              <DynamicForm
                form={supplierForm}
                config={supplierFormConfig}
                hideCancel
                onFieldChange={(field, value) => {
                  if (field === "invoiceNumber") setInvoiceNumber(value as string);
                  if (field === "invoiceDate") setInvoiceDate(value as string);
                }}
              />
            </CardContent>
          </Card>

          {/* Add product */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  2
                </span>
                <h3 className="font-semibold text-sm">Add / Swap Products</h3>
              </div>
              <DynamicForm
                form={productForm}
                config={productFormConfig}
                onSubmit={handleAddItem}
                onFieldChange={handleProductFieldChange}
                submitLabel="Add to Order"
                hideCancel
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    3
                  </span>
                  <h3 className="font-semibold text-sm">
                    Items
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {items.length}
                    </Badge>
                  </h3>
                </div>
              </div>

              <CardTable
                columns={getPurchaseColumns(
                  handleEditItem,
                  handleRemoveItem,
                  formatCurrency,
                  "edit",
                  isUOMEnabled,
                )}
                data={items}
                emptyMessage="No items in this order"
                showCard={false}
              />

              <div className="mt-3 space-y-2">
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (Cost)</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Additional Discount
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base text-muted-foreground">
                      {symbol}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={additionalDiscount || ""}
                      onChange={(e) =>
                        setAdditionalDiscount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-24 h-7 text-right text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Net Amount (Invoice)
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base text-muted-foreground">
                      {symbol}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={computedNet || invoiceAmount}
                      onChange={(e) =>
                        setInvoiceAmountState(
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-28 h-7 text-right text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-4 pb-3 space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Notes</h3>
              </div>
              <Input
                placeholder="Add notes for this purchase order (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT (sticky summary) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-base">Order Summary</h3>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="tabular-nums">{items.length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">
                    -{formatCurrency(additionalDiscount || 0)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Net Amount</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatCurrency(finalNet)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="tabular-nums text-green-600">
                    {formatCurrency(paidSoFar)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due</span>
                  <span
                    className={`tabular-nums font-semibold ${
                      newDue > 0 ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(newDue)}
                  </span>
                </div>

                <Separator />

                <Button
                  onClick={handleSave}
                  disabled={
                    updateMutation.isPending ||
                    items.length === 0 ||
                    !isEditable
                  }
                  size="lg"
                  className="w-full font-semibold"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/purchases/created-orders")}
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit item dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Input
                  value={editingItem.productName}
                  disabled
                  className="bg-muted"
                />
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

              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={editPrice}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    editForm.setValue("price", value);
                    editForm.setValue(
                      "costPrice",
                      Math.max(0, value - (editForm.getValues("discount") || 0)),
                    );
                  }}
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
                <Label htmlFor="edit-cost">Cost Price</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  min={0}
                  step={0.01}
                  value={editCostPrice}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    editForm.setValue("costPrice", value);
                    handleEditFieldChange("costPrice", value);
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="edit-keep" disabled />
                <Label htmlFor="edit-keep" className="text-sm font-normal text-muted-foreground">
                  Per-line cost will update product cost on save
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
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
