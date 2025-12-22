'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Package } from 'lucide-react'
import { queryKeys } from '@/lib/query-keys-products'
import { DataTable } from '@/ui/components/dataTable'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { StatusBadge } from '@/ui/components/status-badge'
import PageHeader from '@/ui/components/header'
import { productsApi } from '@/lib/api-client'
import ProductForm from '@/components/products/product-form'


// create columns for DataTable 
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <AvatarCell
          imageUrl={row.original.images}
          name={row.getValue("name")}
          fallbackIcon={Package}
        />
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />

    },
  ]

export default function ProductsPage() {
  const queryClient = useQueryClient()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  const handleAddProduct = () => {
    setEditingProductId(null)
    setIsDrawerOpen(true)
  }

  const handleEditProduct = (productId: string) => {
    setEditingProductId(productId)
    setIsDrawerOpen(true)
  }

  const handleDrawerSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    setIsDrawerOpen(false)
    setEditingProductId(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Products Management" subTitle="Manage your products and their details." />

      {/* Products List */}
      <DataTable
        cardTitle={(dataLength: number) => `All Products (${dataLength})`}
        columns={columns}
        selectable={true}
        searchConfig={{
          globalSearch: true,
          placeholder: "Search products by name...",
        }}
        operations={{
          getAllData: productsApi.getAll,
          entityName: "Products",
          queryKey: [...queryKeys.variantAttributes.all()],
        }}
        customActions={[
          {
            type: 'create',
            placement: 'header',
            onClick: handleAddProduct,
            icon: <Plus className="h-4 w-4" />,
            label: 'Add Product',
            variant: 'default',
          },
          {
            type: 'edit',
            placement: 'cell',
            onClick: (row) => handleEditProduct(row._id),
            icon: <Pencil className="h-4 w-4" />,
            tooltip: 'Edit Product',
          },
        ]}
        enableSorting={true}
        enableRowHover={true}
      />

      {/* Product Form Drawer */}
      <ProductForm
        productId={editingProductId || undefined}
        openInside="drawer"
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  )
}