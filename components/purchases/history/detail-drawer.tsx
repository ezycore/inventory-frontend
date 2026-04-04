import type { PurchaseOrder } from "@/types";
import { Badge } from "@/ui/components/badge";
import { Separator } from "@/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Package } from "lucide-react";
import { statusConfig } from "../status-config";

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: PurchaseOrder | null;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  formatDateTime: (d: string | Date) => string;
}

export function DetailDrawer({
  open,
  onOpenChange,
  selectedOrder,
  isAccountsEnabled,
  formatCurrency,
  formatDateTime,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details - {selectedOrder?.orderNumber}
          </SheetTitle>
          <SheetDescription>Purchase order information</SheetDescription>
        </SheetHeader>

        {selectedOrder && (
          <div className="space-y-6 mt-6">
            {/* Order Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium">
                  {selectedOrder.supplier?.name || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusConfig[selectedOrder.status].variant}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDateTime(selectedOrder.createdAt)}</span>
              </div>
              {selectedOrder.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span>{selectedOrder.invoiceNumber}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium mb-3">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="rounded-lg border p-3 flex justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {item.productName || "Product"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.subtotal || item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {(selectedOrder.additionalDiscount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">
                    -{formatCurrency(selectedOrder.additionalDiscount!)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>
                  {formatCurrency(
                    selectedOrder.grandTotal ||
                      selectedOrder.invoiceAmount ||
                      selectedOrder.subtotal ||
                      0,
                  )}
                </span>
              </div>
              {isAccountsEnabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-green-600">
                      {formatCurrency(selectedOrder.paidAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due</span>
                    <span
                      className={
                        (selectedOrder.dueAmount || 0) > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {formatCurrency(selectedOrder.dueAmount || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
