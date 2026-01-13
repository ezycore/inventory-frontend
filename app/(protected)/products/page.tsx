'use client'

import PageHeader from '@/ui/components/header'
import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Package, EyeIcon } from 'lucide-react'
import { queryKeys } from '@/lib/query-keys-products'
import { DataTable } from '@/ui/components/dataTable'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { StatusBadge } from '@/ui/components/status-badge'
import { productsApi } from '@/lib/api'
import { productFormConfig } from '@/components/products/form-config'
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/queries'
import type { FilterConfig } from '@/types/DataTable'
import { ProductStatus } from '@/types'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@ui/components/sheet'
import { ProductDetail } from '@/components/products/product-detail';

// Column definitions
const columns: ColumnDef<any>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => (
      <Link href={`/products/${row.original._id}`} className="block hover:underline">
        <AvatarCell
          imageUrl={row.original.images?.[0]?.url}
          name={row.getValue("name")}
          fallbackIcon={Package}
          isActive={row.original.status === ProductStatus.ACTIVE}
        />
      </Link>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    header: 'Brand',
    accessorKey: 'brand',
    cell: ({ row }) => {
      const brand = row.getValue("brand") as any
      return brand?.name || '-'
    },
  },
  {
    header: 'Category',
    accessorKey: 'category',
    cell: ({ row }) => {
      const category = row.getValue("category") as any
      return category?.name || '-'
    },
  },
  {
    header: 'Price',
    accessorKey: 'price',
    cell: ({ row }) => {
      const price = row.getValue("price")
      return price ? `$${Number(price).toFixed(2)}` : '-'
    }
  },
]

// Filter configuration
const productFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search product",
      type: "text",
      placeholder: "Search by product name...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      options: [
        { label: "Active", value: ProductStatus.ACTIVE },
        { label: "Inactive", value: ProductStatus.INACTIVE },
        { label: "Archived", value: ProductStatus.ARCHIVED },
      ],
    },
  ],
}

export default function ProductsPage() {

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Prepare form data for submission
  const prepareSubmitData = (data: any, isEdit: boolean, item?: any) => {
    const formData = new FormData()

    // Note: ID is automatically injected by DataTable for edit mode

    // Add all fields except images, variants, and _id
    for (const key in data) {
      if (key !== 'images' && key !== 'variants' && key !== '_id' && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    }

    // Handle images
    if (isEdit) {
      if (!data.images || data.images.length === 0) {
        formData.append("remove_logo", "true")
      } else if (Array.isArray(data.images) && data.images[0] instanceof File) {
        formData.append("images", data.images[0])
      }
    } else {
      const images = data.images || []
      if (images.length) {
        formData.append('images', images[0])
      }
    }

    // Handle variants for variable products
    if (data.productType === "variable" && data.variants && data.variants.length > 0) {
      const variantsData = data.variants.map((v: any) => ({
        attributes: {
          [v.attributeName]: v.value
        },
        costPrice: v.costPrice,
        price: v.price,
        status: v.enabled ? 'active' : 'inactive',
      }))
      formData.append('variants', JSON.stringify(variantsData))
    }

    return formData
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Products Management"
        subTitle="Manage your products and their details."
      />
      <DataTable
        cardTitle={(dataLength: number) => `All Products (${dataLength})`}
        columns={columns}
        selectable={true}
        searchConfig={{
          globalSearch: true,
          placeholder: "Search products by name...",
        }}
        filterConfig={productFilterConfig}
        customActions={[
          {
            icon: <EyeIcon />,
            tooltip: 'View Product Details',
            onClick: (row) => setSelectedProductId(row._id),
            placement: 'cell',
            type: 'custom',
          },
        ]}
        operations={{
          formConfig: productFormConfig,
          getAllData: productsApi.getAll,
          createMutation: useCreateProduct(),
          updateMutation: useUpdateProduct(),
          deleteMutation: useDeleteProduct(),
          queryKey: [...queryKeys.products.all()],
          entityName: "Product",
          openInside: "drawer",
          editTooltip: "Edit Product",
          deleteTooltip: "Delete Product",
          viewTooltip: "View Product",
          transformEditData: (item: any) => {
            const transformedVariants = item.variants?.map((variant: any) => {
              const attributeKey = Object.keys(variant.attributes || {})[0]
              const attributeValue = variant.attributes?.[attributeKey]

              return {
                id: variant._id || `${attributeKey}-${attributeValue}`,
                attributeName: attributeKey || '',
                value: attributeValue || '',
                sku: variant.sku || '',
                costPrice: variant.costPrice || 0,
                price: variant.price || 0,
                enabled: variant.status === 'active',
              }
            }) || []

            return {
              ...item,
              images: item.images ? [item.images?.thumbnail?.url] : [],
              variants: transformedVariants,
            }
          },
          prepareSubmitData,
        }}
        enableSorting={true}
        enableRowHover={true}
      />

      <Sheet open={!!selectedProductId} onOpenChange={(open) => !open && setSelectedProductId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto p-6">

          {selectedProductId && (
            <ProductDetail
              productId={selectedProductId}
              onClose={() => setSelectedProductId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}