"use client";

import PageHeader from '@/ui/components/header'
import { useState } from 'react'
import { EyeIcon } from 'lucide-react'
import { queryKeys } from '@/lib/query-keys'
import { DataTable } from '@/ui/components/dataTable'
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
import StatsCard from '@/ui/components/StatsCard';

export default function ProductsPage() {

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const filteredFormConfig = useFilteredFormConfig(productFormConfig, 'product')
  const filteredColumns = useFilteredColumns(productColumns, 'product')
  const { data, isLoading } = useProductStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Products Management"
        subTitle="Manage your products and their details."
        actions={<FieldSettingsLink module="product" />}
      />

      {/* Stats Cards */}
      <StatsCard data={getProductStats(data)} isLoading={isLoading} />

      <DataTable
        cardTitle={`All Products`}
        columns={filteredColumns}
        selectable={true}
        manageColumns={true}
        module="product"
        variant='card'
        stickyHeader={true}
        searchConfig={{
          globalSearch: true,
          placeholder: "Search products by name...",
        }}
        filterConfig={productFilterConfig}
        customActions={[
          {
            icon: <EyeIcon />,
            tooltip: "View Product Details",
            onClick: (row) => setSelectedProductId(row._id),
            placement: "cell",
            type: "custom",
          },
        ]}
        operations={{
          formConfig: filteredFormConfig,
          getAllData: productsApi.getAll,
          createMutation: useCreateProduct(),
          updateMutation: useUpdateProduct(),
          deleteMutation: useDeleteProduct(),
          isViewAvailable: false,
          queryKey: [...queryKeys.products.all()],
          entityName: "Product",
          openInside: "drawer",
          editTooltip: "Edit Product",
          deleteTooltip: "Delete Product",
          viewTooltip: "View Product",
          transformEditData: (item: any) => {
            // Transform variants and images (images auto-handled in form helper)
            const transformedVariants =
              item.variants?.map((variant: any) => {
                const attributeKey = Object.keys(variant.attributes || {})[0];
                const attributeValue = variant.attributes?.[attributeKey];

                return {
                  id: variant._id || `${attributeKey}-${attributeValue}`,
                  _id: variant._id, // preserve MongoDB _id for smart merge
                  attributeName: attributeKey || "",
                  value: attributeValue || "",
                  sku: variant.sku || "",
                  costPrice: variant.costPrice || 0,
                  price: variant.price || 0,
                  enabled: variant.status === "active",
                  images: variant.images || [], // preserve existing variant images
                };
              }) || [];

            return {
              ...item,
              variants: transformedVariants,
            };
          },
          prepareSubmitData,
        }}
        enableSorting={true}
        enableRowHover={true}
      />

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
    </div>
  );
}
