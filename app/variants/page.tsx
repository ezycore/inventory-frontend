'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'
import { 
  useVariants, 
  useProducts,
  useDeleteVariant 
} from '@/hooks/queries'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Layers, Eye, DollarSign } from 'lucide-react'
import type { VariantFilters, Variant, ProductWithVariants } from '@/types/products'

export default function VariantsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<VariantFilters>({
    limit: 20,
    page: 1,
  })
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchFilters = debouncedSearch ? { ...filters, search: debouncedSearch } : filters

  // Queries
  const { data: variantsData, isLoading, error } = useVariants(searchFilters)
  const { data: products } = useProducts({ limit: 50 }) // Get all products for filter dropdown
  const deleteVariant = useDeleteVariant()

  const variants = (variantsData as any)?.variants || []
  const totalPages = (variantsData as any)?.totalPages || 1
  const totalCount = (variantsData as any)?.total || 0

  const handleDeleteVariant = async (variant: Variant) => {
    if (window.confirm(`Are you sure you want to delete variant "${variant.sku}"?`)) {
      try {
        await deleteVariant.mutateAsync(variant._id)
        toast.success('Variant deleted successfully')
      } catch (error) {
        toast.error('Failed to delete variant')
      }
    }
  }

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity <= 0) return { label: 'Out of Stock', variant: 'destructive' as const }
    if (quantity <= threshold) return { label: 'Low Stock', variant: 'secondary' as const }
    return { label: 'In Stock', variant: 'default' as const }
  }

  const formatAttributes = (attributes: Record<string, string>) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading variants</h3>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Variants</h1>
          <p className="text-muted-foreground">
            Manage all product variants, pricing, and stock levels
          </p>
        </div>
        <Button onClick={() => router.push('/products')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product & Variants
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search variants by SKU, attributes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.product_id || "all"}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                product_id: value === "all" ? undefined : value,
                page: 1 
              }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {((products as any)?.products || []).map((product: ProductWithVariants) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || "all"}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                status: value === "all" ? undefined : value as any,
                page: 1 
              }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.stock_status || "all"}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                stock_status: value === "all" ? undefined : value as any,
                page: 1 
              }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Variants List */}
      <Card>
        <CardHeader>
          <CardTitle>All Variants</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${totalCount} variants found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No variants found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search or filters' : 'Create products with variants to see them here'}
              </p>
              <Button onClick={() => router.push('/products')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant: Variant) => {
                const stockStatus = getStockStatus(variant.stock_quantity, variant.low_stock_threshold)
                
                return (
                  <div key={variant._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Variant Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {variant.images && variant.images.length > 0 ? (
                          <img 
                            src={variant.images[0]} 
                            alt={variant.sku}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const parent = e.currentTarget.parentElement!
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Layers className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Variant Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold truncate">{variant.sku}</h3>
                          <Badge variant={variant.status === 'active' ? 'default' : 'secondary'}>
                            {variant.status}
                          </Badge>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                        
                        {Object.keys(variant?.attributes || {}).length > 0 && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {formatAttributes(variant.attributes)}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${variant.price.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {variant.stock_quantity} in stock
                          </span>
                          {variant.barcode && (
                            <span>Barcode: {variant.barcode}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/products/${variant.product_id}/variants`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/products/${variant.product_id}/variants/${variant._id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVariant(variant)}
                        disabled={deleteVariant.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{' '}
            {Math.min((filters.page || 1) * (filters.limit || 20), totalCount)} of {totalCount} variants
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={filters.page === totalPages}
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}