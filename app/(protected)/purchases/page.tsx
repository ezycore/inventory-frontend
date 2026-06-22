"use client";

import { Button } from "@/ui/components/button";
import { Download } from "lucide-react";

import { getPurchaseColumns } from "@/components/purchases";
import ImportLowStockWrapper from "@/components/purchases/import-low-stock-wrapper";
import EditProductDialog from "@/components/purchases/edit-product-dialog";
import ItemsTable from "@/components/purchases/items-table";
import SupplierForm from "@/components/purchases/supplier-form";
import ProductForm from "@/components/purchases/product-form";
import OrderSummary from "@/components/purchases/order-summary";
import usePurchasePage from "@/components/purchases/use-purchase-page";
import { BarcodeInput } from "@/components/shared/barcode";
import { useAuthStore } from "@/services/stores";
import { Suspense } from "react";

function PurchasesPageContent() {
  const ctx = usePurchasePage();
  const barcodeEnabled = useAuthStore((s) => s.user?.organization?.features?.barcodeSystem);
  const {
    formatCurrency,
    symbol,
    supplierForm,
    productForm,
    editForm,
    editingItem,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editQuantity,
    editPrice,
    editDiscount,
    editCostPrice,
    editRememberCostPrice,
    supplierFormConfig,
    productFormConfig,
    handleSupplierFieldChange,
    handleProductFieldChange,
    handleAddToOrder,
    handleBarcodeScan,
    handleEditItem,
    handleSaveEdit,
    handleEditFieldChange,
    handleImportLowStock,
    handleCompleteOrder,
    handleSaveAsDraft,
    sellersWithItems,
    totalItemCount,
    grandTotal,
    grandTax,
    grandAddedTax,
    grandIncludedTax,
    grandPaid,
    grandCreditApplied,
    grandDue,
    getSellerSubtotal,
    getSellerTotal,
    getSellerNetAmount,
    getSellerTax,
    getSellerAddedTax,
    getSellerIncludedTax,
    removeSeller,
    removeItem,
    setAdditionalDiscount,
    isImportDialogOpen,
    setIsImportDialogOpen,
    preSelectedLowStockIds,
    setPreSelectedLowStockIds,
    isPending,
    updateDraftMutation,
    finalizeDraftMutation,
    isDraftMode,
    isAccountsEnabled,
    activeSeller,
    isUOMEnabled,
    isTaxEnabled,
  } = ctx;

  return (
    <div className="">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Supplier & Purchase Settings */}
          <SupplierForm form={supplierForm} config={supplierFormConfig} onFieldChange={handleSupplierFieldChange} />

          {barcodeEnabled && (
            <div className="rounded-md border bg-card p-3">
              <BarcodeInput
                onScan={handleBarcodeScan}
                placeholder="Scan barcode to add a line…"
              />
            </div>
          )}

          {/* Step 2: Add Products */}
          <ProductForm
            form={productForm}
            config={productFormConfig}
            onSubmit={handleAddToOrder}
            onFieldChange={handleProductFieldChange}
            submitLabel="Add to Order"
            actions={(
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsImportDialogOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Import Low Stock
              </Button>
            )}
          />

          {/* Step 3: Order Items per Supplier */}
          {sellersWithItems.map((seller) => (
            <ItemsTable
              key={seller.id}
              seller={seller}
              formatCurrency={formatCurrency}
              getSellerNetAmount={getSellerNetAmount}
              getSellerSubtotal={getSellerSubtotal}
              getSellerTotal={getSellerTotal}
              getSellerTax={getSellerTax}
              getSellerAddedTax={getSellerAddedTax}
              getSellerIncludedTax={getSellerIncludedTax}
              getPurchaseColumns={getPurchaseColumns}
              handleEditItem={handleEditItem}
              removeItem={removeItem}
              setAdditionalDiscount={setAdditionalDiscount}
              removeSeller={removeSeller}
              isUOMEnabled={isUOMEnabled}
              isTaxEnabled={isTaxEnabled}
              symbol={symbol}
            />
          ))}
        </div>

        {/* ==================== RIGHT COLUMN (Sticky Sidebar) ==================== */}
        <OrderSummary
          formatCurrency={formatCurrency}
          sellersCount={sellersWithItems.length}
          totalItemCount={totalItemCount}
          grandTotal={grandTotal}
          grandTax={grandTax}
          grandAddedTax={grandAddedTax}
          grandIncludedTax={grandIncludedTax}
          grandPaid={grandPaid}
          grandCreditApplied={grandCreditApplied}
          grandDue={grandDue}
          isAccountsEnabled={isAccountsEnabled}
          isPending={isPending}
          isDraftMode={isDraftMode}
          isFinalizing={finalizeDraftMutation.isPending}
          isSaving={updateDraftMutation.isPending}
          onComplete={handleCompleteOrder}
          onSaveDraft={handleSaveAsDraft}
        />
      </div>

      {/* ==================== Import Low Stock Dialog ==================== */}
      <ImportLowStockWrapper
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) setPreSelectedLowStockIds([]);
        }}
        onImport={handleImportLowStock}
        preSelectedIds={preSelectedLowStockIds}
        initialSupplierId={activeSeller?.supplierId || ""}
        initialSupplierName={activeSeller?.supplierName || ""}
        initialPurchaseType={activeSeller?.purchaseType || "instant"}
        initialDiscountType={activeSeller?.discountType || "percentage"}
        initialDiscountValue={activeSeller?.discountValue || 0}
      />

      {/* ==================== Edit Product Dialog ==================== */}
      <EditProductDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingItem={editingItem}
        editQuantity={editQuantity}
        editPrice={editPrice}
        editDiscount={editDiscount}
        editCostPrice={editCostPrice}
        editRememberCostPrice={editRememberCostPrice}
        formatCurrency={formatCurrency}
        editForm={editForm}
        handleEditFieldChange={handleEditFieldChange}
        handleSaveEdit={handleSaveEdit}
      />
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense>
      <PurchasesPageContent />
    </Suspense>
  );
}
