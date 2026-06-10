"use client";

import { getPurchaseColumns } from "@/components/purchases";
import { useEditPurchaseOrder } from "@/components/purchases/orders/use-edit-purchase-order";
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
import { ArrowLeft, ClipboardList, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const ctx = useEditPurchaseOrder(orderId);

  if (ctx.isLoading || !ctx.order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/purchases/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Purchase Order</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {ctx.order?.orderNumber}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {ctx.order?.status}
        </Badge>
      </div>

      {!ctx.isEditable && (
        <Card className="mb-4 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="pt-4 pb-3 text-sm text-orange-700 dark:text-orange-300">
            This order is in <b>{ctx.order?.status}</b> status and cannot be edited.
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
                form={ctx.supplierForm}
                config={ctx.supplierFormConfig}
                hideCancel
                onFieldChange={(field, value) => {
                  if (field === "invoiceNumber") ctx.setInvoiceNumber(value as string);
                  if (field === "invoiceDate") ctx.setInvoiceDate(value as string);
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
                form={ctx.productForm}
                config={ctx.productFormConfig}
                onSubmit={ctx.handleAddItem}
                onFieldChange={ctx.handleProductFieldChange}
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
                      {ctx.items.length}
                    </Badge>
                  </h3>
                </div>
              </div>

              <CardTable
                columns={getPurchaseColumns(
                  ctx.handleEditItem,
                  ctx.handleRemoveItem,
                  ctx.formatCurrency,
                  "edit",
                  ctx.isUOMEnabled,
                )}
                data={ctx.items}
                emptyMessage="No items in this order"
                showCard={false}
              />

              <div className="mt-3 space-y-2">
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (Cost)</span>
                  <span className="tabular-nums">{ctx.formatCurrency(ctx.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Additional Discount
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base text-muted-foreground">{ctx.symbol}</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={ctx.additionalDiscount || ""}
                      onChange={(e) => ctx.setAdditionalDiscount(parseFloat(e.target.value) || 0)}
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
                    <span className="text-base text-muted-foreground">{ctx.symbol}</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={ctx.computedNet || ctx.invoiceAmount}
                      onChange={(e) =>
                        ctx.setInvoiceAmountState(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)
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
                value={ctx.notes}
                onChange={(e) => ctx.setNotes(e.target.value)}
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
                  <span className="tabular-nums">{ctx.items.length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{ctx.formatCurrency(ctx.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">-{ctx.formatCurrency(ctx.additionalDiscount || 0)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Net Amount</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {ctx.formatCurrency(ctx.finalNet)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="tabular-nums text-green-600">
                    {ctx.formatCurrency(ctx.paidSoFar)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due</span>
                  <span
                    className={`tabular-nums font-semibold ${ctx.newDue > 0 ? "text-orange-600" : "text-green-600"}`}
                  >
                    {ctx.formatCurrency(ctx.newDue)}
                  </span>
                </div>

                <Separator />

                <Button
                  onClick={ctx.handleSave}
                  disabled={ctx.isSaving || ctx.items.length === 0 || !ctx.isEditable}
                  size="lg"
                  className="w-full font-semibold"
                >
                  <Save className="h-4 w-4" />
                  {ctx.isSaving ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/purchases/orders")}
                  className="w-full"
                  disabled={ctx.isSaving}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit item dialog */}
      <Dialog open={ctx.isEditDialogOpen} onOpenChange={ctx.setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {ctx.editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Input value={ctx.editingItem?.productName} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min={1}
                  value={ctx.editQuantity}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 1;
                    ctx.editForm.setValue("quantity", value);
                    ctx.handleEditFieldChange("quantity", value);
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
                  value={ctx.editPrice}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    ctx.editForm.setValue("price", value);
                    ctx.editForm.setValue(
                      "costPrice",
                      Math.max(0, value - (ctx.editForm.getValues("discount") || 0)),
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
                  value={ctx.editDiscount}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    ctx.editForm.setValue("discount", value);
                    ctx.handleEditFieldChange("discount", value);
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
                  value={ctx.editCostPrice}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    ctx.editForm.setValue("costPrice", value);
                    ctx.handleEditFieldChange("costPrice", value);
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
            <Button variant="outline" onClick={() => ctx.setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={ctx.handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
