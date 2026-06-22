"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
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
  setAdditionalDiscount: (id: string, v: number) => void;
  removeSeller: (id: string) => void;
  isUOMEnabled: boolean;
  isTaxEnabled: boolean;
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
  setAdditionalDiscount,
  removeSeller,
  isUOMEnabled,
  isTaxEnabled,
  symbol,
}) => {
  const { confirm, ConfirmDialog } = useConfirm();

  return (
    <Card>
      <ConfirmDialog />
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            <h3 className="font-semibold text-sm">{seller.supplierName || "—"}</h3>
            <Badge variant="secondary" className="text-xs">
              {seller.items.length} {seller.items.length === 1 ? "item" : "items"}
            </Badge>
            <Badge className="text-xs bg-primary/15 text-primary hover:bg-primary/20 border-0">
              {seller.purchaseType === "instant" ? "Instant" : "Order"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary tabular-nums">{formatCurrency(getSellerNetAmount(seller.id))}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (await confirm({
                  title: `Remove all items for ${seller.supplierName || "this supplier"}?`
                })) removeSeller(seller.id);
              }}
              className="text-muted-foreground hover:text-destructive text-xs h-7"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CardTable
          columns={getPurchaseColumns(handleEditItem, removeItem, formatCurrency, seller.id, isUOMEnabled, isTaxEnabled)}
          data={seller.items}
          emptyMessage="No items added yet"
          showCard={false}
        />

        <div className="mt-3 space-y-2">
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal (Cost Price)</span>
            <span className="tabular-nums">{formatCurrency(getSellerSubtotal(seller.id))}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Additional Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-base text-muted-foreground">{symbol}</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={seller.additionalDiscount || ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setAdditionalDiscount(seller.id, value);
                }}
                placeholder="0"
                className="w-20 h-7 text-right text-sm"
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Net Amount</span>
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
            totalLabel="Total"
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
