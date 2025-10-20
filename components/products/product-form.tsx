'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Label } from '@ui/components/label'
import { Textarea } from '@ui/components/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'
import { 
  useCreateProduct, 
  useUpdateProduct, 
  useProduct,
  useCategories, 
  useBrands 
} from '@/hooks/queries'
import { toast } from 'sonner'
import { handleMutationError } from '@/lib/error-handling'
import { ArrowLeft, Plus, X, Upload } from 'lucide-react'
import type { CreateProductDto, Product } from '@/types'
import { ProductStatus } from '@/types'

interface ProductFormProps {
  productId?: string
  mode: 'create' | 'edit'
  onSuccess?: (productId?: string, hasVariants?: boolean) => void
  onCancel?: () => void
  isModal?: boolean
}

export default function ProductForm({ productId, mode, onSuccess, onCancel, isModal = false }: ProductFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    brand_id: '',
    base_sku: '',
    images: [],
    status: ProductStatus.ACTIVE,
  })
  const [imageInput, setImageInput] = useState('')
  const [hasVariants, setHasVariants] = useState(false)

  // Queries
  const { data: product, isLoading: productLoading } = useProduct(productId || '')
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  
  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Load existing product data for editing
  useEffect(() => {
    if (mode === 'edit' && product) {
      const productData = product as any
      setFormData({
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        category_id: productData.category_id,
        brand_id: productData.brand_id || '',
        base_sku: productData.base_sku || '',
        images: productData.images || [],
        status: productData.status,
      })
    }
  }, [mode, product])

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), imageInput.trim()]
      }))
      setImageInput('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (mode === 'create') {
        const result = await createProduct.mutateAsync(formData)
        toast.success('Product created successfully')
        
        if (onSuccess) {
          // Modal mode - use callback
          onSuccess(result as any)
        } else {
          // Regular mode - use router navigation
          if (hasVariants) {
            router.push(`/products/${(result as any)._id}/variants`)
          } else {
            router.push('/products')
          }
        }
      } else if (mode === 'edit' && productId) {
        await updateProduct.mutateAsync({ id: productId, ...formData })
        toast.success('Product updated successfully')
        
        if (onSuccess) {
          // Modal mode - use callback
          onSuccess()
        } else {
          // Regular mode - use router navigation
          router.push('/products')
        }
      }
    } catch (error) {
      handleMutationError(error)
    }
  }

  const isLoading = createProduct.isPending || updateProduct.isPending || productLoading

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {!isModal && (
          <Button variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create' 
              ? 'Create a new product in your catalog'
              : 'Update product information and settings'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential product details and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., T-Shirt"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="t-shirt"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {((categories as any)?.data?.items || []).map((category: any) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={formData.brand_id || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, brand_id: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Brand</SelectItem>
                    {((brands as any)?.data?.items || []).map((brand: any) => (
                      <SelectItem key={brand._id} value={brand._id}>
                        {brand.name}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_sku">Base SKU</Label>
              <Input
                id="base_sku"
                placeholder="PROD-001"
                value={formData.base_sku}
                onChange={(e) => setFormData(prev => ({ ...prev, base_sku: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                Optional base SKU for product family. Variants will extend this.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>
              Add images for your product. First image will be the main image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {(formData.images?.length || 0) > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(formData.images || []).map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Product ${index + 1}`}
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
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variants Option (for create mode) */}
        {mode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>
                Does this product have variants like different colors, sizes, etc.?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasVariants"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="hasVariants">
                  This product has variants (color, size, etc.)
                </Label>
              </div>
              {hasVariants && (
                <p className="text-sm text-muted-foreground mt-2">
                  After creating the product, you'll be taken to the variants page to add different options.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onCancel ? onCancel() : router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}