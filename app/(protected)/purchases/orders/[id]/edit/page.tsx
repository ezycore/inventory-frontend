"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { getPurchaseColumns } from "@/components/purchases";
import { EditProductDialog } from "@/components/purchases/edit-product-dialog";
import { useEditPurchaseOrder } from "@/components/purchases/orders/use-edit-purchase-order";
import { TaxSummaryLines } from "@/components/shared/tax-summary-lines";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { CardTable } from "@/ui/components/custom/card-table";
import DynamicForm from "@/ui/components/form";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { ArrowLeft, ClipboardList, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const t = useTranslations("purchases");
  const tActions = useTranslations("common.actions");
  const tStatus = useTranslations("purchases.status");
  const tTax = useTranslations("common.tax");

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
            <h1 className="text-2xl font-bold">{t("edit.title")}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {ctx.order?.orderNumber}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {ctx.order?.status ? tStatus(ctx.order.status) : ""}
        </Badge>
      </div>

      {!ctx.isEditable && (
        <Card className="mb-4 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="pt-4 pb-3 text-sm text-orange-700 dark:text-orange-300">
            {t.rich("edit.notEditable", {
              status: ctx.order?.status ? tStatus(ctx.order.status) : "",
              b: (chunks) => <b>{chunks}</b>,
            })}
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
                <h3 className="font-semibold text-sm">{t("edit.supplierInvoice")}</h3>
              </div>
              <DynamicForm
                form={ctx.supplierForm}
                config={ctx.supplierFormConfig}
                hideCancel
                onFieldChange={(field, value) => {
                  if (field === "invoiceNumber") ctx.setInvoiceNumber(value as string);
                  if (field === "invoiceDate") ctx.setInvoiceDate(value as string);
                  if (field === "discountValue") ctx.handleDiscountValueChange(Number(value) || 0);
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
                <h3 className="font-semibold text-sm">{t("edit.addSwapProducts")}</h3>
              </div>
              <DynamicForm
                form={ctx.productForm}
                config={ctx.productFormConfig}
                onSubmit={ctx.handleAddItem}
                onFieldChange={ctx.handleProductFieldChange}
                submitLabel={t("create.addToOrder")}
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
                    {t("edit.items")}
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
                  t,
                  ctx.isUOMEnabled,
                  ctx.isTaxEnabled,
                )}
                data={ctx.items}
                emptyMessage={t("edit.emptyItems")}
                showCard={false}
              />

              <div className="mt-3 space-y-2">
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("edit.subtotalCost")}</span>
                  <span className="tabular-nums">{ctx.formatCurrency(ctx.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    {t("edit.additionalDiscount")}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base text-muted-foreground">{ctx.symbol}</span>
                    <NumberField
                      precision={2}
                      min={0}
                      value={ctx.additionalDiscount || null}
                      onChange={(v) => ctx.setAdditionalDiscount(v ?? 0)}
                      placeholder="0"
                      className="w-24 h-7 text-right text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{t("edit.netAmount")}</span>
                  <span className="tabular-nums">{ctx.formatCurrency(ctx.computedNet)}</span>
                </div>
                <TaxSummaryLines
                  show={ctx.isTaxEnabled}
                  addedTax={ctx.addedTax}
                  includedTax={ctx.includedTax}
                  taxTotal={ctx.taxTotal}
                  total={ctx.finalNet}
                  totalLabel={t("edit.totalInvoice")}
                  formatCurrency={ctx.formatCurrency}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-4 pb-3 space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">{t("edit.notes")}</h3>
              </div>
              <Input
                placeholder={t("edit.notesPlaceholder")}
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
                  <h3 className="font-semibold text-base">{t("edit.summaryTitle")}</h3>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("edit.items")}</span>
                  <span className="tabular-nums">{ctx.items.length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("edit.subtotal")}</span>
                  <span className="tabular-nums">{ctx.formatCurrency(ctx.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("edit.discount")}</span>
                  <span className="tabular-nums">-{ctx.formatCurrency(ctx.additionalDiscount || 0)}</span>
                </div>

                {ctx.isTaxEnabled && ctx.addedTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("edit.taxAdded")}</span>
                    <span className="tabular-nums">+{ctx.formatCurrency(ctx.addedTax)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{t("edit.netAmount")}</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {ctx.formatCurrency(ctx.finalNet)}
                  </span>
                </div>

                {ctx.isTaxEnabled && ctx.includedTax > 0 && (
                  <p className="text-xs text-muted-foreground text-right leading-snug">
                    {tTax("includesInPrice", { amount: ctx.formatCurrency(ctx.includedTax) })}
                    {ctx.addedTax > 0
                      ? tTax("totalTaxSuffix", { amount: ctx.formatCurrency(ctx.taxTotal) })
                      : ""}
                  </p>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("edit.paid")}</span>
                  <span className="tabular-nums text-green-600">
                    {ctx.formatCurrency(ctx.paidSoFar)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("edit.due")}</span>
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
                  {ctx.isSaving ? t("edit.saving") : t("edit.saveChanges")}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/purchases/orders")}
                  className="w-full"
                  disabled={ctx.isSaving}
                >
                  {tActions("cancel")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EditProductDialog
        open={ctx.isEditDialogOpen}
        onOpenChange={ctx.setIsEditDialogOpen}
        editingItem={ctx.editingItem}
        editQuantity={ctx.editQuantity}
        editPrice={ctx.editPrice}
        editDiscount={ctx.editDiscount}
        editCostPrice={ctx.editCostPrice}
        editForm={ctx.editForm}
        handleEditFieldChange={ctx.handleEditFieldChange}
        showDiscount={ctx.editShowDiscount}
        handleSaveEdit={ctx.handleSaveEdit}
      />
    </div>
  );
}
