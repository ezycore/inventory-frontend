"use client";
// coding-standard: maintained
import { ProductSearch, getCustomerFormConfig } from "@/components/sales";
import { useSellPage } from "@/components/sales/sell/use-sell-page";
import { OrderSummarySidebar } from "@/components/sales/sell/order-summary-sidebar";
import { BarcodeInput } from "@/components/shared/barcode";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import { CardTable } from "@/ui/components/custom/card-table";
import DynamicForm from "@/ui/components/form";
import PageHeader from "@/ui/components/header";
import { Separator } from "@/ui/components/separator";
import { useAuthStore } from "@/services/stores";
import { useConfirm } from "@/hooks/use-confirm";
import { POS_PATH } from "@/constants/pos";
import { MonitorSmartphone, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Suspense, useMemo } from "react";

function SalesPageContent() {
  const t = useTranslations("sales.sell");
  const tForm = useTranslations("sales.sell.form");
  const customerFormConfig = useMemo(() => getCustomerFormConfig(tForm), [tForm]);
  const ctx = useSellPage();
  const { items, salesColumns, clearAll, customerForm, handleFieldChange, handleProductSelect, handleBarcodeScan, draftId } = ctx;
  // Carry an open draft across: the cart store is shared, so without the id the
  // counter would post the draft's lines as a NEW sale and leave the draft behind.
  const posHref = draftId ? `${POS_PATH}?draftId=${draftId}` : POS_PATH;
  const barcodeEnabled = useAuthStore((s) => s.user?.organization?.features?.barcodeSystem);
  const { confirm, ConfirmDialog } = useConfirm({
    title: t("clearAllTitle"),
    description: t("clearAllDescription"),
    confirmLabel: t("clear"),
    confirmClassName: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  });

  const handleClearAll = async () => {
    const ok = await confirm();
    if (ok) clearAll();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
        actions={
          <Button asChild variant="outline">
            <Link href={posHref}>
              <MonitorSmartphone className="size-4" />
              {t("openPos")}
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    1
                  </span>
                  <h3 className="font-semibold text-sm">{t("selectCustomer")}</h3>
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
                  <h3 className="font-semibold text-sm">{t("addProducts")}</h3>
                </div>
                {barcodeEnabled && (
                  <div className="mb-3">
                    <BarcodeInput
                      onScan={handleBarcodeScan}
                      placeholder={t("scanBarcode")}
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
                    <h3 className="font-semibold text-sm">{t("orderItems")}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {t("itemCount", { count: items.length })}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearAll}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title={t("clearAllTooltip")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTable
                  columns={salesColumns}
                  data={items}
                  emptyMessage={t("noItems")}
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
      <ConfirmDialog />
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense>
      <SalesPageContent />
    </Suspense>
  );
}
