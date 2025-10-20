'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Label } from '@ui/components/label'
import { Badge } from '@ui/components/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'
import { 
  useProduct,
  useVariants, 
  useCreateVariant, 
  useUpdateVariant, 
  useDeleteVariant 
} from '@/hooks/queries'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react'
import type { CreateVariantDto, Variant } from '@/types/products'

interface VariantManagerProps {
  productId: string
}

export default function VariantManager({ productId }: VariantManagerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [formData, setFormData] = useState<CreateVariantDto>({
    product_id: productId,
    sku: '',
    attributes: {},
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    low_stock_threshold: 0,
    barcode: '',
    images: [],
    status: 'active',
  })

  // Queries
  const { data: product } = useProduct(productId)
  const { data: variants } = useVariants({ product_id: productId })
  
  // Mutations
  const createVariant = useCreateVariant()
  const updateVariant = useUpdateVariant()
  const deleteVariant = useDeleteVariant()

  const resetForm = () => {
    setFormData({
      product_id: productId,
      sku: '',
      attributes: {},
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      low_stock_threshold: 0,
      barcode: '',
      images: [],
      status: 'active',
    })
    setEditingVariant(null)
    setShowForm(false)
  }

  const handleEdit = (variant: Variant) => {
    const variantData = variant as any
    setFormData({
      product_id: productId,
      sku: variantData.sku,
      attributes: variantData.attributes || {},
      price: variantData.price || 0,
      cost_price: variantData.cost_price || 0,
      stock_quantity: variantData.stock_quantity || 0,
      low_stock_threshold: variantData.low_stock_threshold || 0,
      barcode: variantData.barcode || '',
      images: variantData.images || [],
      status: variantData.status,
    })
    setEditingVariant(variant)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingVariant) {
        await updateVariant.mutateAsync({ 
          id: (editingVariant as any)._id, 
          data: formData 
        })
        toast.success('Variant updated successfully')
      } else {
        await createVariant.mutateAsync(formData)
        toast.success('Variant created successfully')
      }
      resetForm()
    } catch (error) {
      toast.error(`Failed to ${editingVariant ? 'update' : 'create'} variant`)
    }
  }

  const handleDelete = async (variant: Variant) => {
    if (confirm('Are you sure you want to delete this variant?')) {
      try {
        await deleteVariant.mutateAsync((variant as any)._id)
        toast.success('Variant deleted successfully')
      } catch (error) {
        toast.error('Failed to delete variant')
      }
    }
  }

  const addAttribute = () => {
    const key = prompt('Attribute name (e.g., color, size):')
    const value = prompt('Attribute value:')
    if (key && value) {
      setFormData(prev => ({
        ...prev,
        attributes: { ...prev.attributes, [key]: value }
      }))
    }
  }

  const removeAttribute = (key: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: Object.fromEntries(
        Object.entries(prev.attributes).filter(([k]) => k !== key)
      )
    }))
  }

  const isLoading = createVariant.isPending || updateVariant.isPending || deleteVariant.isPending

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Product Variants</h1>
          <p className="text-muted-foreground">
            {(product as any)?.name} - Manage different variants of this product
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variant Form */}
        {showForm && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {editingVariant ? 'Edit Variant' : 'Add New Variant'}
              </CardTitle>
              <CardDescription>
                Configure variant details and attributes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="PROD-001-RED-L"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">Cost Price ($)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="Optional"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Attributes</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Attribute
                    </Button>
                  </div>
                  
                  {Object.entries(formData.attributes).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(formData.attributes).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {key}: {value}
                            <button
                              type="button"
                              onClick={() => removeAttribute(key)}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No attributes added. Click "Add Attribute" to add color, size, etc.
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingVariant ? 'Update Variant' : 'Create Variant'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Variants List */}
        <Card className={showForm ? '' : 'lg:col-span-3'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Existing Variants ({((variants as any)?.data?.items || []).length})
            </CardTitle>
            <CardDescription>
              All variants for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            {((variants as any)?.data?.items || []).length > 0 ? (
              <div className="space-y-4">
                {((variants as any)?.data?.items || []).map((variant: any) => (
                  <div
                    key={variant._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{variant.sku}</span>
                        <Badge variant={variant.status === 'active' ? 'default' : 'secondary'}>
                          {variant.status}
                        </Badge>
                      </div>
                      
                      {Object.entries(variant.attributes || {}).length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {Object.entries(variant.attributes || {}).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value as string}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        Price: ${variant.price || 0} | Cost: ${variant.cost_price || 0} | Stock: {variant.stock_quantity || 0}
                        {variant.barcode && ` | Barcode: ${variant.barcode}`}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(variant)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(variant)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No variants created yet.</p>
                <p className="text-sm">Add your first variant to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}