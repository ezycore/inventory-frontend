"use client";

import { useCreatePurchaseOrder, useLocations } from "@/hooks/queries";
import { useSuppliers } from "@/hooks/queries/use-suppliers";
import {
  PurchaseOrderLineItem,
  usePurchaseOrderStore,
} from "@/stores/purchase-order-store";
import type { LabelValueOption } from "@/ui/components/advanced-select";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import DynamicForm from "@/ui/components/form";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Separator } from "@/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/table";
import { Textarea } from "@/ui/components/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  FileText,
  Package,
  Pencil,
  ShoppingCart,
  Trash,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.union([
    z.string(),
    z.object({ label: z.string(), value: z.string() }),
  ]),
  variantId: z
    .union([z.string(), z.object({ label: z.string(), value: z.string() })])
    .optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
  discount: z.number().min(0).max(100).optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const createPurchaseOrderMutation = useCreatePurchaseOrder();
  const { data: suppliersData } = useSuppliers();
  const { data: locationsData } = useLocations(); // use be removed later

  const {
    supplierId,
    supplierName,
    supplierDiscount,
    locationId,
    locationName,
    invoiceNumber,
    invoiceDate,
    discountType,
    discountValue,
    taxTotal,
    notes,
    items,
    subtotal,
    grandTotal,
    setSupplier,
    setLocation,
    setInvoiceNumber,
    setInvoiceDate,
    setDiscountType,
    setDiscountValue,
    setTaxTotal,
    setNotes,
    addItem,
    updateItem,
    removeItem,
    clearAll,
    clearItems,
  } = usePurchaseOrderStore();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      productId: "",
      variantId: "",
      quantity: 1,
      unitPrice: 0,
      discount: supplierDiscount,
    },
  });

  // Update default discount when supplier changes
  useEffect(() => {
    form.setValue("discount", supplierDiscount);
  }, [supplierDiscount, form]);

  // Extract value/label helpers
  const extractValue = (val: string | LabelValueOption | undefined): string => {
    if (!val) return "";
    return typeof val === "object" ? val.value : val;
  };

  const extractLabel = (val: string | LabelValueOption | undefined): string => {
    if (!val) return "";
    return typeof val === "object" ? val.label : val;
  };

  // Handle supplier selection
  const handleSupplierChange = (value: string) => {
    const suppliers = suppliersData?.data?.items || [];
    const supplier = suppliers.find((s: any) => s._id === value);
    if (supplier) {
      setSupplier(
        supplier._id,
        supplier.name,
        supplier.defaultDiscount?.value || 0,
      );
    } else {
      setSupplier(null, null, 0);
    }
  };

  const itemFormConfig: DynamicFormConfig = {
    sections: [
      {
        title: "Add Item",
        icon: <Package className="h-5 w-5 text-primary" />,
        fields: [
          {
            name: "productId",
            label: "Product",
            type: "select",
            required: true,
            optionsApi: "/products",
            placeholder: "Select product",
            labelInValue: true,
            columnSpan: 3,
          },
          {
            name: "variantId",
            label: "Variant",
            type: "select",
            required: false,
            dependsOn: "productId",
            dependsOnTemplate: "/products/:id/variants",
            placeholder: "Select variant (optional)",
            labelInValue: true,
            columnSpan: 3,
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
            placeholder: "Enter quantity",
            columnSpan: 2,
            validation: { min: 1 },
          },
          {
            name: "unitPrice",
            label: "Unit Price",
            type: "number",
            required: true,
            placeholder: "Enter unit price",
            columnSpan: 2,
            validation: { min: 0 },
          },
          {
            name: "discount",
            label: "Discount %",
            type: "number",
            required: false,
            placeholder: "Item discount",
            columnSpan: 2,
            validation: { min: 0, max: 100 },
          },
        ],
      },
    ],
  };

  const handleAddOrUpdateItem = (data: ItemFormData) => {
    if (!locationId) {
      toast.error("Please select a location first");
      return;
    }

    const itemData = {
      productId: extractValue(data.productId),
      variantId: extractValue(data.variantId) || null,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      discount: data.discount ?? supplierDiscount,
      productName: extractLabel(data.productId),
      variantName: data.variantId ? extractLabel(data.variantId) : null,
      locationId: locationId,
      locationName: locationName || "",
    };

    if (editingId) {
      updateItem(editingId, itemData);
      setEditingId(null);
      toast.success("Item updated");
    } else {
      addItem(itemData);
      toast.success("Item added");
    }

    form.reset({
      productId: "",
      variantId: "",
      quantity: 1,
      unitPrice: 0,
      discount: supplierDiscount,
    });
  };

  const handleEditItem = (item: PurchaseOrderLineItem) => {
    setEditingId(item.id);
    form.setValue("productId", {
      label: item.productName,
      value: item.productId,
    });
    form.setValue(
      "variantId",
      item.variantId
        ? {
            label: item.variantName || item.variantId,
            value: item.variantId,
          }
        : "",
    );
    form.setValue("quantity", item.quantity);
    form.setValue("unitPrice", item.unitPrice);
    form.setValue("discount", item.discount);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({
      productId: "",
      variantId: "",
      quantity: 1,
      unitPrice: 0,
      discount: supplierDiscount,
    });
  };

  const handleSubmitOrder = async (status: "draft" | "ordered" = "draft") => {
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (!locationId) {
      toast.error("Please select a location");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const orderData = {
      supplierId,
      locationId,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        productName: item.productName,
        variantName: item.variantName,
      })),
      status,
      invoiceNumber: invoiceNumber || undefined,
      invoiceDate: invoiceDate || undefined,
      discountType,
      discountValue,
      taxTotal,
      notes: notes || undefined,
    };

    try {
      const result = await createPurchaseOrderMutation.mutateAsync(orderData);
      clearAll();
      form.reset();
      toast.success(
        `Purchase order ${result.data?.orderNumber || ""} created successfully`,
      );
      router.push("/purchases/history");
    } catch (error) {
      console.error("Failed to create purchase order:", error);
    }
  };

  const suppliers = suppliersData?.data?.items || [];
  const locations = locationsData?.data?.items || [];

  // Handle location selection
  const handleLocationChange = (value: string) => {
    const location = locations.find((l: any) => l._id === value);
    if (location) {
      setLocation(location._id, location.name);
    } else {
      setLocation(null, null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Purchase Order</h1>
        <p className="text-muted-foreground">
          Create a purchase order with supplier discount auto-fill
        </p>
      </div>

      {/* Order Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Order Details
          </CardTitle>
          <CardDescription>
            Select supplier and location for this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select
                value={supplierId || ""}
                onValueChange={handleSupplierChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                      {supplier.defaultDiscount && (
                        <Badge variant="secondary" className="ml-2">
                          {supplier.defaultDiscount.value}% off
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {supplierDiscount > 0 && (
                <p className="text-sm text-green-600">
                  Default discount: {supplierDiscount}%
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Select
                value={locationId || ""}
                onValueChange={handleLocationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location: any) => (
                    <SelectItem key={location._id} value={location._id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
              />
            </div>

            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Item" : "Add Item"}</CardTitle>
          <CardDescription>
            Add products to this purchase order. Discount auto-fills from
            supplier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            config={itemFormConfig}
            onSubmit={handleAddOrUpdateItem}
            form={form}
            submitLabel={editingId ? "Update Item" : "Add to Order"}
          />
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              className="mt-4"
            >
              Cancel Edit
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Order Items ({items.length})</CardTitle>
                <CardDescription>
                  Review items before submitting
                </CardDescription>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  if (confirm("Clear all items?")) {
                    clearItems();
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Disc %</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-sm text-muted-foreground">
                            {item.variantName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ৳{item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.discount}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ৳{item.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          disabled={editingId === item.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            {/* Order Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Order Discount</Label>
                  <div className="flex gap-2">
                    <Select
                      value={discountType}
                      onValueChange={(v) =>
                        setDiscountType(v as "percentage" | "fixed")
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      placeholder={
                        discountType === "percentage" ? "% discount" : "Amount"
                      }
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tax Total</Label>
                  <Input
                    type="number"
                    value={taxTotal}
                    onChange={(e) => setTaxTotal(Number(e.target.value))}
                    placeholder="Enter tax amount"
                    className="w-48"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2 text-right">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">৳{subtotal.toFixed(2)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>
                      Discount (
                      {discountType === "percentage"
                        ? `${discountValue}%`
                        : "Fixed"}
                      ):
                    </span>
                    <span>
                      -৳
                      {(discountType === "percentage"
                        ? (subtotal * discountValue) / 100
                        : discountValue
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
                {taxTotal > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>৳{taxTotal.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => handleSubmitOrder("draft")}
                disabled={createPurchaseOrderMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSubmitOrder("ordered")}
                disabled={createPurchaseOrderMutation.isPending}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create & Mark Ordered
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
