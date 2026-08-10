"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { Separator } from "@/ui/components/separator";
import { CardTable } from "@/ui/components/custom/card-table";
import { SellerPaymentSection } from "@/components/purchases/seller-payment-section";
import { Trash2 } from "lucide-react";
import type { FC } from "react";
import { useConfirm } from "@/hooks/use-confirm";
import { TaxSummaryLines } from "@/components/shared/tax-summary-lines";

type Props = {
  seller: any;
  formatCurrency: (n: number) => string;
  getSellerNetAmount: (id: string) => number;
  getSellerSubtotal: (id: string) => number;
  getSellerTotal: (id: string) => number;
  getSellerTax: (id: string) => number;
  getSellerAddedTax: (id: string) => number;
  getSellerIncludedTax: (id: string) => number;
  getPurchaseColumns: any;
  handleEditItem: any;
  removeItem: any;
  updateItem: (id: string, itemId: string, data: any) => void;
  setAdditionalDiscount: (id: string, v: number) => void;
  removeSeller: (id: string) => void;
  isUOMEnabled: boolean;
  isTaxEnabled: boolean;
  isExpiryEnabled: boolean;
  symbol: string;
};

export const ItemsTable: FC<Props> = ({
  seller,
  formatCurrency,
  getSellerNetAmount,
  getSellerSubtotal,
  getSellerTotal,
  getSellerTax,
  getSellerAddedTax,
  getSellerIncludedTax,
  getPurchaseColumns,
  handleEditItem,
  removeItem,
  updateItem,
  setAdditionalDiscount,
  removeSeller,
  isUOMEnabled,
  isTaxEnabled,
  isExpiryEnabled,
  symbol,
}) => {
  const t = useTranslations("purchases");
  const { confirm, ConfirmDialog } = useConfirm();

  return (
    <Card>
      <ConfirmDialog />
      <CardContent className="pt-4 pb-3">
        {/* Header must never push the amount/remove controls past the viewport on
            mobile — the name truncates, the badges wrap, the right group never shrinks. */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="flex shrink-0 items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            <h3 className="font-semibold text-sm min-w-0 max-w-full truncate">{seller.supplierName || "—"}</h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {t("items.itemCount", { count: seller.items.length })}
            </Badge>
            <Badge className="shrink-0 text-xs bg-primary/15 text-primary hover:bg-primary/20 border-0">
              {seller.purchaseType === "instant" ? t("items.instant") : t("items.order")}
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-sm font-semibold text-primary tabular-nums whitespace-nowrap">{formatCurrency(getSellerNetAmount(seller.id))}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (await confirm({
                  title: t("items.removeAllFor", { name: seller.supplierName || t("items.thisSupplier") })
                })) removeSeller(seller.id);
              }}
              className="text-muted-foreground hover:text-destructive text-xs h-7 w-7 shrink-0 px-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CardTable
          columns={getPurchaseColumns(handleEditItem, removeItem, formatCurrency, seller.id, t, isUOMEnabled, isTaxEnabled, isExpiryEnabled && seller.purchaseType === "instant", updateItem)}
          data={seller.items}
          emptyMessage={t("items.empty")}
          showCard={false}
        />

        <div className="mt-3 space-y-2">
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("items.subtotalCost")}</span>
            <span className="tabular-nums">{formatCurrency(getSellerSubtotal(seller.id))}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">{t("items.additionalDiscount")}</span>
            <div className="flex items-center gap-1">
              <span className="text-base text-muted-foreground">{symbol}</span>
              <NumberField
                precision={2}
                min={0}
                value={seller.additionalDiscount || null}
                onChange={(v) => setAdditionalDiscount(seller.id, v ?? 0)}
                placeholder="0"
                className="w-20 h-7 text-right text-sm"
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">{t("items.netAmount")}</span>
            <span className="tabular-nums">
              {formatCurrency(getSellerTotal(seller.id))}
            </span>
          </div>
          <TaxSummaryLines
            show={isTaxEnabled}
            addedTax={getSellerAddedTax(seller.id)}
            includedTax={getSellerIncludedTax(seller.id)}
            taxTotal={getSellerTax(seller.id)}
            total={getSellerNetAmount(seller.id)}
            totalLabel={t("items.total")}
            formatCurrency={formatCurrency}
          />
        </div>

        <SellerPaymentSection
          seller={seller}
          netAmount={getSellerNetAmount(seller.id)}
          isAccountsEnabled={true}
          formatCurrency={formatCurrency}
        />
      </CardContent>
    </Card>
  );
};

export default ItemsTable;
