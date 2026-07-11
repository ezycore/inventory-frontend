"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";
import { Checkbox } from "@/ui/components/checkbox";
import { Separator } from "@/ui/components/separator";
import type { FC } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any | null;
  editQuantity: number;
  editPrice: number;
  editDiscount: number;
  editCostPrice: number;
  editRememberCostPrice: boolean;
  formatCurrency: (n: number) => string;
  editForm: any;
  handleEditFieldChange: (name: string, value: unknown) => void;
  handleSaveEdit: () => void;
};

export const EditProductDialog: FC<Props> = ({
  open,
  onOpenChange,
  editingItem,
  editQuantity,
  editPrice,
  editDiscount,
  editCostPrice,
  editRememberCostPrice,
  formatCurrency,
  editForm,
  handleEditFieldChange,
  handleSaveEdit,
}) => {
  const t = useTranslations("purchases.editDialog");
  const tActions = useTranslations("common.actions");
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

            <div className="space-y-2">
              <Label htmlFor="edit-quantity">{t("quantity")}</Label>
              <NumberField
                id="edit-quantity"
                precision={0}
                min={1}
                value={editQuantity}
                onChange={(v) => {
                  const value = v ?? 1;
                  editForm.setValue("quantity", value);
                  handleEditFieldChange("quantity", value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("price")}</Label>
              <Input value={formatCurrency(editPrice || 0)} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-discount">{t("discount")}</Label>
              <NumberField
                id="edit-discount"
                precision={2}
                min={0}
                value={editDiscount}
                onChange={(v) => {
                  const value = v ?? 0;
                  editForm.setValue("discount", value);
                  handleEditFieldChange("discount", value);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("costPrice")}</Label>
              <Input value={formatCurrency(editCostPrice || 0)} disabled className="bg-muted" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="edit-remember" checked={editRememberCostPrice} onCheckedChange={(checked) => editForm.setValue("rememberCostPrice", checked as boolean)} />
              <Label htmlFor="edit-remember" className="text-sm font-normal">{t("rememberCostPrice")}</Label>
            </div>
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
