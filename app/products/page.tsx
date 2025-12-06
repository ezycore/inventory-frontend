'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { Badge } from '@ui/components/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'
import {
  useProducts,
  useCategories,
  useBrands,
  useDeleteProduct
} from '@/hooks/queries'
import { useDebounce } from '@/hooks/use-debounce'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search, Trash2, Package, AlertTriangle } from 'lucide-react'
import type { ProductWithVariants } from '@/types'
import type { ProductFilters } from '@/types/products'
import ProductForm from '@/components/products/product-form'
import { queryKeys } from '@/lib/query-keys-products'
import { DataTable } from '@/ui/components/dataTable'
import { AvatarCell } from '@/ui/components/dataTable/cells'
import { StatusBadge } from '@/ui/components/status-badge'
import PageHeader from '@/ui/components/header'

export default function ProductsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProductFilters>({
    limit: 20,
    page: 1,
  })

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchFilters = debouncedSearch ? { ...filters, search: debouncedSearch } : filters

  // Queries
  const { data: productsData, isLoading, error } = useProducts(searchFilters)
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const deleteProduct = useDeleteProduct()

  const handleDrawerSuccess = () => {
    // Invalidate products query to refetch data
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    setIsDrawerOpen(false)
    setEditingProductId(null)
  }

  const handleEditProduct = (productId: string) => {
    setEditingProductId(productId)
    setIsDrawerOpen(true)
  }

  const handleAddProduct = () => {
    setEditingProductId(null)
    setIsDrawerOpen(true)
  }

  const products = (productsData as any)?.data?.items || []
  const totalPages = (productsData as any)?.data?.totalPages || 1
  const totalCount = (productsData as any)?.data?.total || 0

  const handleDeleteProduct = async (product: ProductWithVariants) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await deleteProduct.mutateAsync(product._id)
        toast.success('Product deleted successfully')
      } catch (error) {
        toast.error('Failed to delete product')
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-red-100 text-red-800',
    }
    return variants[status as keyof typeof variants] || variants.inactive
  }

  const getVariantSummary = (product: ProductWithVariants) => {
    if (!product.variants?.length) return 'No variants'

    const totalStock = product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
    const lowStockCount = product.variants.filter(v =>
      v.stock_quantity <= v.low_stock_threshold
    ).length

    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{product.variants.length} variants</span>
        <span>•</span>
        <span>{totalStock} total stock</span>
        {lowStockCount > 0 && (
          <>
            <span>•</span>
            <span className="text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} low stock
            </span>
          </>
        )}
      </div>
    )
  }

  // create columns for DataTable 
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <AvatarCell
          imageUrl={row.original.logo_url}
          name={row.getValue("name")}
          fallbackIcon={Package}
        />
      ),
    },
    {
      header: 'SKU',
      accessorKey: 'base_sku',
    },
    {
      header: 'Price',
      accessorKey: 'price',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />

    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader title="Products Management" subTitle="Manage your products and their details." />

      <Button onClick={handleAddProduct}>
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
      {/* Products List */}
      <DataTable columns={columns} data={products} isLoading={isLoading}
        cardTitle={(dataLength: number) => `All Products (${dataLength})`}
        searchConfig={{
          globalSearch: true,
          placeholder: "Search products by name, description, or status...",
        }}
      />


      {/* Product Form Drawer */}
      <ProductForm
        productId={editingProductId || undefined}
        openInside="drawer"
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) setEditingProductId(null)
        }}
        onSuccess={handleDrawerSuccess}

      />
    </div>
  )
}