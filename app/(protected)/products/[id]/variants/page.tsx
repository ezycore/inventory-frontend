'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'
import { 
  useProduct,
  useVariantsByProduct,
  useDeleteVariant 
} from '@/services/api/queries'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, ArrowLeft, Package, AlertTriangle, Layers, DollarSign, Eye } from 'lucide-react'
import type { Variant, Product } from '@/types/products'
import AddVariantModal from '@/components/products/add-variant-modal' 

export default function ProductVariantsPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Queries
  const { data: productData, isLoading: productLoading } = useProduct(productId)
  const { data: variants, isLoading: variantsLoading } = useVariantsByProduct(productId)
  const deleteVariant = useDeleteVariant()

  // Type assertions
  const product = ((productData as any)?.data) as Product

  // Filter variants based on search
  const filteredVariants = (((variants as any)?.data?.items) || [] as Variant[])?.filter((variant: Variant) => 
    variant.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(variant.attributes).some((attr: any) => 
      String(attr).toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || []

  // Delete variant handler
  const handleDeleteVariant = async (variantId: string) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      try {
        await deleteVariant.mutateAsync(variantId)
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

  // Calculate variant stats
  const variantStats = {
    total: filteredVariants.length,
    active: filteredVariants.filter((v: Variant) => v.status === 'active').length,
    totalStock: filteredVariants.reduce((sum: number, v: Variant) => sum + v.stock_quantity, 0),
    lowStock: filteredVariants.filter((v: Variant) => v.stock_quantity <= v.low_stock_threshold).length,
    avgPrice: filteredVariants.length > 0 
      ? filteredVariants.reduce((sum: number, v: Variant) => sum + v.price, 0) / filteredVariants.length 
      : 0
  }

  if (productLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Product not found</h1>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.name} - Variants</h1>
          <p className="text-muted-foreground">
            Manage variants for this product including pricing, stock, and attributes
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variantStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {variantStats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variantStats.totalStock}</div>
            <p className="text-xs text-muted-foreground">
              units across variants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{variantStats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${variantStats.avgPrice.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              per variant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Product</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{product.base_sku || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {product.status}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search variants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Variants List */}
      {variantsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredVariants.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No variants found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No variants match your search.' : 'This product has no variants yet.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Variant
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVariants.map((variant: Variant) => {
            const stockStatus = getStockStatus(variant.stock_quantity, variant.low_stock_threshold)
            
            return (
              <Card key={variant._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{variant.sku}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                        <Badge variant="outline">{variant.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteVariant(variant._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Attributes */}
                  {Object.keys(variant?.attributes || {}).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Attributes</h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">${variant.price.toFixed(2)}</p>
                    </div>
                    {variant.costPrice && variant.costPrice > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-medium">${variant.costPrice.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {/* Stock Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock</p>
                      <p className="font-medium">{variant.stock_quantity} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock Alert</p>
                      <p className="font-medium">{variant.low_stock_threshold} units</p>
                    </div>
                  </div>

                  {/* Barcode */}
                  {variant.barcode && (
                    <div>
                      <p className="text-sm text-muted-foreground">Barcode</p>
                      <p className="font-mono text-sm">{variant.barcode}</p>
                    </div>
                  )}

                  {/* Images */}
                  {variant.images && variant.images.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Images</p>
                      <div className="flex gap-2">
                        {variant.images.slice(0, 3).map((image: string, index: number) => (
                          <div key={index} className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                            <img 
                              src={image} 
                              alt={`Variant ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEyNSA3NUwxNzUgMTI1SDI1TDc1IDc1TDEwMCAxMDBaIiBmaWxsPSIjREREREREIi8+Cjwvc3ZnPgo='
                              }}
                            />
                          </div>
                        ))}
                        {variant.images.length > 3 && (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-muted-foreground">
                            +{variant.images.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Variant Modal */}
      <AddVariantModal
        productId={productId}
        product={product}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  )
}