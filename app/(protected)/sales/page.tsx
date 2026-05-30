"use client";

import { ProductSearch, customerFormConfig } from "@/components/sales";
import { useSellPage } from "@/components/sales/sell/use-sell-page";
import { OrderSummarySidebar } from "@/components/sales/sell/order-summary-sidebar";
import { BarcodeInput } from "@/components/shared/barcode";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { CardTable } from "@/ui/components/custom/card-table";
import DynamicForm from "@/ui/components/form";
import { Separator } from "@/ui/components/separator";
import { useAuthStore } from "@/services/stores";

export default function SalesPage() {
  const ctx = useSellPage();
  const { items, salesColumns, clearAll, customerForm, handleFieldChange, handleProductSelect, handleBarcodeScan } = ctx;
  const barcodeEnabled = useAuthStore((s) => s.user?.organization?.features?.barcodeSystem);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    1
                  </span>
                  <h3 className="font-semibold text-sm">Select Customer</h3>
                </div>
                <DynamicForm
                  form={customerForm}
                  config={customerFormConfig}
                  onFieldChange={handleFieldChange}
                  hideCancel
                />
              </div>
              <Separator className="my-6" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </span>
                  <h3 className="font-semibold text-sm">Add Products</h3>
                </div>
                {barcodeEnabled && (
                  <div className="mb-3">
                    <BarcodeInput
                      onScan={handleBarcodeScan}
                      placeholder="Scan barcode to add to cart…"
                    />
                  </div>
                )}
                <ProductSearch onSelect={handleProductSelect} />
              </div>
            </CardContent>
          </Card>

          {items.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      3
                    </span>
                    <h3 className="font-semibold text-sm">Order Items</h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-muted-foreground hover:text-destructive text-xs h-7"
                  >
                    Clear All
                  </Button>
                </div>
                <CardTable
                  columns={salesColumns}
                  data={items}
                  emptyMessage="No items added yet"
                  showCard={false}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <OrderSummarySidebar ctx={ctx} />
        </div>
      </div>
    </div>
  );
}
