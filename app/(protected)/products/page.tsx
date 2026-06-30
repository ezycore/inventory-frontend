"use client";

import PageHeader from '@/ui/components/header'
import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { isTaxActive } from '@/lib/feature-utils'
import { queryKeys } from '@/lib/query-keys'
import { DataTable } from '@/ui/components/dataTable'
import { DataCard } from '@/ui/components/dataCard'
import { productsApi, useProductStats } from '@/services/api'
import { productFormConfig } from '@/components/products/form-config'
import { productColumns } from '@/components/products/columns'
import { productFilterConfig } from '@/components/products/filters'
import { getProductStats, prepareSubmitData } from '@/components/products/helpers'
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/services/api'
import { Sheet, SheetContent } from '@ui/components/sheet'
import { ProductDetail } from '@/components/products/product-detail'
import { FieldSettingsLink } from '@/components/shared/field-settings-link'
import { useFilteredFormConfig, useFilteredColumns } from '@/hooks/use-filters'
import StatsCard from '@/ui/components/StatsCard'
import ViewToggle from '@/ui/components/ViewToggle'
import { useViewMode } from '@/hooks/use-view-mode'
import { ProductCard } from '@/components/products/product-card'
import MountingHandler from '@/components/MountingHandler';
import { useAuthStore } from '@/services/stores';
import { BarcodeLabelSheet, type LabelItem } from '@/components/shared/barcode';
import { toast } from 'sonner';


 const sortingConfig = {
    sortOptions: [
      { field: "name", label: "Name" },
      { field: "price", label: "Price" },
      {field: "status", label: "Status"},
    ],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc" as const,
  }

export default function ProductsPage() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [labelSheet, setLabelSheet] = useState<{ open: boolean; items: LabelItem[] }>({ open: false, items: [] })
  const [viewMode, setViewMode, isMounted] = useViewMode('products')
  const filteredFormConfig = useFilteredFormConfig(productFormConfig, 'product')
  const filteredColumns = useFilteredColumns(productColumns, 'product')
  const { data: statsData, isLoading: statsLoading } = useProductStats()
  const { user, activeLocationId } = useAuthStore();

  // Hide the product tax-config fields for any side whose tax is inactive
  // (master `tax` feature off, or that area's sub-toggle off).
  const taxGatedFormConfig = useMemo(() => {
    const hide = new Set<string>()
    if (!isTaxActive(user?.organization, 'sales')) {
      hide.add('salesTax.taxType'); hide.add('salesTax.taxId')
    }
    if (!isTaxActive(user?.organization, 'purchase')) {
      hide.add('purchaseTax.taxType'); hide.add('purchaseTax.taxId')
    }
    if (hide.size === 0) return filteredFormConfig
    const cfg = filteredFormConfig as { sections?: any[]; fields?: any[] }
    if (cfg.sections) {
      return {
        ...filteredFormConfig,
        // Drop sections left empty after gating (the standalone Tax section has
        // only tax fields, so it disappears entirely when both sides are off).
        sections: cfg.sections
          .map((s) => ({
            ...s,
            fields: (s.fields || []).filter((f: any) => !hide.has(f.name)),
          }))
          .filter((s) => (s.fields || []).length > 0),
      }
    }
    return {
      ...filteredFormConfig,
      fields: (cfg.fields || []).filter((f: any) => !hide.has(f.name)),
    }
  }, [filteredFormConfig, user?.organization])
  const barcodeEnabled = user?.organization?.features?.barcodeSystem;

  const openLabelsFor = (rows: any[]) => {
    const items: LabelItem[] = [];
    for (const row of rows) {
      // Variable products: print one label per variant w/ barcode
      if (row.productType === "variable" && Array.isArray(row.variants)) {
        for (const v of row.variants) {
          if (v.barcode) {
            items.push({
              code: v.barcode,
              name: `${row.name} (${Object.values(v.attributes || {}).join("/")})`,
              price: v.price,
              symbology: v.barcodeSymbology || "CODE128",
            });
          }
        }
      } else if (row.barcode) {
        items.push({
          code: row.barcode,
          name: row.name,
          price: row.price,
          symbology: row.barcodeSymbology || "CODE128",
        });
      }
    }
    if (items.length === 0) {
      toast.error("No barcodes set on selected product(s)");
      return;
    }
    setLabelSheet({ open: true, items });
  };

  // Product stats (only product-relevant data, no inventory stats)
  const productStats = getProductStats(statsData)

  // Shared operations config
  const sharedOperations = {
    formConfig: taxGatedFormConfig,
    getAllData: productsApi.getAll,
    createMutation: useCreateProduct(),
    updateMutation: useUpdateProduct(),
    deleteMutation: useDeleteProduct(),
    defaultValues: { locationId: activeLocationId },
    isViewAvailable: false,
    queryKey: [...queryKeys.products.all()],
    entityName: "Product" as const,
    openInside: "drawer" as const,
    editTooltip: "Edit Product",
    deleteTooltip: "Delete Product",
    transformEditData: (item: any) => {
      const transformedVariants =
        item.variants?.map((variant: any) => {
          const attributeKey = Object.keys(variant.attributes || {})[0]
          const attributeValue = variant.attributes?.[attributeKey]
          return {
            id: variant._id || `${attributeKey}-${attributeValue}`,
            _id: variant._id,
            attributeName: attributeKey || "",
            value: attributeValue || "",
            price: variant.price || 0,
            enabled: variant.status === "active",
            images: variant.images || [],
            enableUOMConversion: !!variant.enableUOMConversion,
            purchaseUnit: variant.purchaseUnit
              ? { unitId: variant.purchaseUnit.unitId, conversionFactor: variant.purchaseUnit.conversionFactor }
              : undefined,
            saleUnit: variant.saleUnit
              ? { unitId: variant.saleUnit.unitId, conversionFactor: variant.saleUnit.conversionFactor }
              : undefined,
            barcode: variant.barcode,
            inventoryAlertLevel: variant.inventoryAlertLevel,
          }
        }) || []
      return {
        ...item,
        // Barcode type is product-level and shared by all variants. Legacy variable
        // products stored it per variant only — fall back to the first variant so
        // the shared "Barcode type" field prefills correctly on edit.
        barcodeSymbology: item.barcodeSymbology || item.variants?.[0]?.barcodeSymbology,
        variants: transformedVariants,
      }
    },
    prepareSubmitData,
  }

 if(!isMounted) {
    return <MountingHandler />
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="Products Management"
        subTitle="Manage your products and their details."
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle
              storageKey="products"
              defaultView={viewMode}
              onChange={setViewMode}
            />
            <FieldSettingsLink module="product" />
          </div>
        }
      />

      {/* Stats Cards */}
      <StatsCard
        data={productStats}
        isLoading={statsLoading}
        columns={{ default: 1, lg: productStats.length }}
      />



      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable
          cardTitle="All Products"
          columns={filteredColumns}
          fullColumns={productColumns}
          selectable={true}
          manageColumns={true}
          module="product"
          variant="card"
          stickyHeader={true}
          searchConfig={{
            globalSearch: true,
            placeholder: "Search products by name...",
          }}
          filterConfig={productFilterConfig}
          operations={sharedOperations}
          enableSorting={true}
          sortingConfig={sortingConfig}
          enableRowHover={true}
          {...(barcodeEnabled
            ? {
                customActions: [
                  {
                    type: "print-label",
                    placement: "cell",
                    icon: <Printer className="h-4 w-4" />,
                    tooltip: "Print label",
                    onClick: (row: any) => openLabelsFor([row]),
                    disabled: (row: any) =>
                      !row.barcode &&
                      !(row.productType === "variable" && (row.variants || []).some((v: any) => v.barcode)),
                  },
                ],
              }
            : {})}
        />
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <DataCard
          cardTitle="All Products"
          defaultPageSize={12}
          pageSizes={[12, 24, 48]}
          layoutConfig={{
            layout: 'grid',
            columns: { default: 1, sm: 2, md: 3, lg: 4 },
            gap: 'md',
            
          }}
          sortingConfig={sortingConfig}
          variant="default"
          enableCardHover={true}
          searchConfig={{
            globalSearch: true,
            placeholder: "Search products by name...",
          }}
          filterConfig={productFilterConfig}
          renderCard={(row: any, actions) => (
            <ProductCard
              product={row}
              onEdit={actions.onEdit}
              onView={() => setSelectedProductId(row._id)}
              onDelete={actions.onDelete}
            />
          )}
          operations={sharedOperations}
        />
      )}

      <Sheet
        open={!!selectedProductId}
        onOpenChange={(open) => !open && setSelectedProductId(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto p-6"
        >
          {selectedProductId && (
            <ProductDetail
              productId={selectedProductId}
              onClose={() => setSelectedProductId(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <BarcodeLabelSheet
        open={labelSheet.open}
        onOpenChange={(v) => setLabelSheet((s) => ({ ...s, open: v }))}
        items={labelSheet.items}
        storeName={user?.organization?.name}
      />
    </div>
  )
}
