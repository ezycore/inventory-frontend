'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/components/dialog'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { Textarea } from '@ui/components/textarea'
import { Badge } from '@ui/components/badge'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'
import { Plus, X, Upload } from 'lucide-react'
import type { CreateVariantDto, Product } from '@/types/products'
import { useCreateVariantAttribute } from '@/hooks'

interface AddVariantModalProps {
  productId: string
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddVariantModal({ productId, product, open, onOpenChange }: AddVariantModalProps) {
  const queryClient = useQueryClient()
  const createVariant = useCreateVariantAttribute()
  
  const [formData, setFormData] = useState<CreateVariantDto>({
    productId: productId,
    sku: '',
    attributes: {},
    price: 0,
    costPrice: 0,
    stock_quantity: 0,
    low_stock_threshold: 5,
    barcode: '',
    images: [],
    status: 'active'
  })
  
  const [imageInput, setImageInput] = useState('')
  const [attributeKey, setAttributeKey] = useState('')
  const [attributeValue, setAttributeValue] = useState('')

  // Generate SKU based on product base_sku and attributes
  const generateSKU = () => {
    const baseSku = product.base_sku || product.name.substring(0, 3).toUpperCase()
    const attributeValues = Object.values(formData.attributes).join('-')
    // Use a counter instead of Date.now() to avoid hydration issues
    const suffix = attributeValues ? `-${attributeValues}` : `-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    return `${baseSku}${suffix}`.replace(/\s+/g, '-').toUpperCase()
  }

  const handleAddAttribute = () => {
    if (attributeKey.trim() && attributeValue.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attributeKey.trim()]: attributeValue.trim()
        }
      }))
      setAttributeKey('')
      setAttributeValue('')
      
      // Auto-generate SKU when attributes change
      if (!formData.sku) {
        setFormData(prev => ({ ...prev, sku: generateSKU() }))
      }
    }
  }

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...formData.attributes }
    delete newAttributes[key]
    setFormData(prev => ({ ...prev, attributes: newAttributes }))
  }

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }))
      setImageInput('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createVariant.mutateAsync(formData)
      toast.success('Variant created successfully')
      onOpenChange(false)
      
      // Reset form
      setFormData({
        productId: productId,
        sku: '',
        attributes: {},
        price: 0,
        costPrice: 0,
        stock_quantity: 0,
        low_stock_threshold: 5,
        barcode: '',
        images: [],
        status: 'active'
      })
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.byProduct(productId) })
    } catch (error) {
      toast.error('Failed to create variant')
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    // Reset form
    setFormData({
      productId: productId,
      sku: '',
      attributes: {},
      price: 0,
      costPrice: 0,
      stock_quantity: 0,
      low_stock_threshold: 5,
      barcode: '',
      images: [],
      status: 'active'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Variant - {product.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKU and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  placeholder="Enter SKU or auto-generate"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  required
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setFormData(prev => ({ ...prev, sku: generateSKU() }))}
                >
                  Auto
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                placeholder="Product barcode"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              />
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-4">
            <Label>Variant Attributes</Label>
            
            {/* Add Attribute */}
            <div className="flex gap-2">
              <Input
                placeholder="Attribute name (e.g., Color)"
                value={attributeKey}
                onChange={(e) => setAttributeKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttribute())}
              />
              <Input
                placeholder="Attribute value (e.g., Red)"
                value={attributeValue}
                onChange={(e) => setAttributeValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAttribute())}
              />
              <Button type="button" onClick={handleAddAttribute}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Attributes */}
            {Object.keys(formData.attributes).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.attributes).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {key}: {value}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(key)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price * ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price ($)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Stock Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock_quantity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                placeholder="5"
                value={formData.low_stock_threshold || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 5 }))}
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <Label>Variant Images</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Image URL"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
              />
              <Button type="button" onClick={handleAddImage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Variant ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEyNSA3NUwxNzUgMTI1SDI1TDc1IDc1TDEwMCAxMDBaIiBmaWxsPSIjREREREREIi8+Cjwvc3ZnPgo='
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'archived' }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createVariant.isPending}>
              {createVariant.isPending ? 'Creating...' : 'Create Variant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}