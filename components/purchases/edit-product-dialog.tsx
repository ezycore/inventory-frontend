"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import type { FC } from "react";
import { isMrpEdited, mrpPerBaseUnit } from "./helpers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any | null;
  editQuantity: number;
  editPrice: number;
  editDiscount: number;
  editCostPrice: number;
  editForm: any;
  handleEditFieldChange: (name: string, value: unknown) => void;
  handleSaveEdit: () => void;
  /** False when the line's supplier gives no discount (`hasDiscountTerms`): no Discount field. */
  showDiscount?: boolean;
};

/**
 * Edit one purchase line — shared by New Purchase and Edit Purchase Order.
 * Price (MRP) is editable; a changed value is written back as the product's
 * MRP when the purchase is saved, which the hint under the field says.
 * Discount shows only when the supplier gives one — the same rule as the
 * add-product row.
 */
export const EditProductDialog: FC<Props> = ({
  open,
  onOpenChange,
  editingItem,
  editQuantity,
  editPrice,
  editDiscount,
  editCostPrice,
  editForm,
  handleEditFieldChange,
  handleSaveEdit,
  showDiscount = true,
}) => {
  const t = useTranslations("purchases.editDialog");
  const tForm = useTranslations("purchases.form");
  const tActions = useTranslations("common.actions");

  const factor = editingItem?.conversionFactor || 1;
  const mrpChanged =
    !!editingItem && (editingItem.updateMrp || isMrpEdited(editPrice || 0, editingItem.price));
  const mrpHint = !mrpChanged
    ? null
    : factor > 1
      ? tForm("mrpWillUpdatePerUnit", {
          amount: mrpPerBaseUnit(editPrice || 0, factor).toFixed(2),
          unit: editingItem.unitName || "",
        })
      : tForm("mrpWillUpdate");

  const numberRow = (id: string, field: string, label: string, value: number, precision: number, min: number) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <NumberField
        id={id}
        precision={precision}
        min={min}
        value={value}
        onChange={(v) => {
          const next = v ?? min;
          editForm.setValue(field, next);
          handleEditFieldChange(field, next);
        }}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {editingItem && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("product")}</Label>
              <Input value={editingItem.productName} disabled className="bg-muted" />
            </div>

            {numberRow("edit-quantity", "quantity", t("quantity"), editQuantity, 0, 1)}

            <div className="space-y-2">
              {numberRow("edit-price", "price", t("price"), editPrice, 2, 0)}
              {mrpHint && <p className="text-xs text-muted-foreground">{mrpHint}</p>}
            </div>

            {showDiscount && numberRow("edit-discount", "discount", t("discount"), editDiscount, 2, 0)}
            {numberRow("edit-cost", "costPrice", t("costPrice"), editCostPrice, 2, 0)}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tActions("cancel")}</Button>
          <Button onClick={handleSaveEdit}>{t("saveChanges")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
