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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and variants
          </p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.category_id || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, category_id: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {((categories as any)?.data?.items || []).map((category: any) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.brand_id || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, brand_id: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {((brands as any)?.data?.items || []).map((brand: any) => (
                  <SelectItem key={brand._id} value={brand._id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>

          <DataTable columns={columns} data={products} />

          {/* {isLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[300px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-destructive">Error loading products</div>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message}
              </p>
            </div>
          )}



          {products.length > 0 && (
            <div className="space-y-4">
              {products.map((product: ProductWithVariants) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        <Badge className={getStatusBadge(product.status)}>
                          {product.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      
                      {getVariantSummary(product)}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {product.category && (
                          <span>Category: {product.category.name}</span>
                        )}
                        {product.brand && (
                          <span>Brand: {product.brand.name}</span>
                        )}
                        {product.base_sku && (
                          <span>SKU: {product.base_sku}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product._id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/products/${product._id}/variants`)}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )} */}
        </CardContent>
      </Card>



      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={filters.page === 1}
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 py-2">
            Page {filters.page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={filters.page === totalPages}
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

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