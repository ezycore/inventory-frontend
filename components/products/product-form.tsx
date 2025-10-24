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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ui/components/collapsible'
import { 
  useCreateProduct, 
  useUpdateProduct, 
  useProduct,
  useCategories, 
  useBrands 
} from '@/hooks/queries'
import { toast } from 'sonner'
import { handleMutationError } from '@/lib/error-handling'
import { ArrowLeft, Plus, X, Upload, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'
import type { CreateProductDto, Product } from '@/types'
import { ProductStatus } from '@/types'

interface ProductFormProps {
  productId?: string
  mode: 'create' | 'edit'
  onSuccess?: (productId?: string, hasVariants?: boolean) => void
  onCancel?: () => void
  isModal?: boolean
}

interface ExtendedProductData extends CreateProductDto {
  store_id?: string
  warehouse_id?: string
  sub_category_id?: string
  unit_id?: string
  barcode_symbology?: string
  barcode?: string
  selling_type?: 'retail' | 'wholesale' | 'both'
  tax_id?: string
  discount_type?: 'fixed' | 'percentage'
  discount_value?: number
  quantity_alert?: number
  warranty_id?: string
  manufacturer?: string
  manufactured_date?: string
  expiry_date?: string
}

export default function ProductForm({ productId, mode, onSuccess, onCancel, isModal = false }: ProductFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<ExtendedProductData>({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    brand_id: '',
    base_sku: '',
    images: [],
    status: ProductStatus.ACTIVE,
    store_id: '',
    warehouse_id: '',
    sub_category_id: '',
    unit_id: '',
    barcode_symbology: 'CODE128',
    barcode: '',
    selling_type: 'retail',
    tax_id: '',
    discount_type: 'fixed',
    discount_value: 0,
    quantity_alert: 10,
    warranty_id: '',
    manufacturer: '',
    manufactured_date: '',
    expiry_date: '',
  })
  const [imageInput, setImageInput] = useState('')
  const [hasVariants, setHasVariants] = useState(false)
  const [productType, setProductType] = useState<'single' | 'variable'>('single')
  
  // Collapsible states
  const [productInfoOpen, setProductInfoOpen] = useState(true)
  const [pricingStocksOpen, setPricingStocksOpen] = useState(true)
  const [imagesOpen, setImagesOpen] = useState(true)
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false)

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
        store_id: productData.store_id || '',
        warehouse_id: productData.warehouse_id || '',
        sub_category_id: productData.sub_category_id || '',
        unit_id: productData.unit_id || '',
        barcode_symbology: productData.barcode_symbology || 'CODE128',
        barcode: productData.barcode || '',
        selling_type: productData.selling_type || 'retail',
        tax_id: productData.tax_id || '',
        discount_type: productData.discount_type || 'fixed',
        discount_value: productData.discount_value || 0,
        quantity_alert: productData.quantity_alert || 10,
        warranty_id: productData.warranty_id || '',
        manufacturer: productData.manufacturer || '',
        manufactured_date: productData.manufactured_date || '',
        expiry_date: productData.expiry_date || '',
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

  // Generate barcode
  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setFormData(prev => ({ ...prev, barcode: `${timestamp}${random}` }))
    toast.success('Barcode generated')
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
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {!isModal && (
            <Button variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {mode === 'create' ? 'Create Product' : 'Edit Product'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create' ? 'Create new product' : 'Update product information'}
            </p>
          </div>
        </div>
        {!isModal && (
          <Button variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
            Back to Product
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information */}
        <Collapsible open={productInfoOpen} onOpenChange={setProductInfoOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">ℹ</span>
                  </div>
                  <CardTitle>Product Information</CardTitle>
                </div>
                {productInfoOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store">Store</Label>
                    <Select
                      value={formData.store_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="store1">Main Store</SelectItem>
                        <SelectItem value="store2">Branch Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select
                      value={formData.warehouse_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, warehouse_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wh1">Main Warehouse</SelectItem>
                        <SelectItem value="wh2">Secondary Warehouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      placeholder="product-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="Enter SKU"
                      value={formData.base_sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_sku: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="selling_type">Selling Type *</Label>
                    <Select
                      value={formData.selling_type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, selling_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          {((categories as any)?.data?.items || []).map((category: any) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sub_category">Sub Category</Label>
                    <Select
                      value={formData.sub_category_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sub_category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sub1">Sub Category 1</SelectItem>
                        <SelectItem value="sub2">Sub Category 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Select
                      value={formData.brand_id || "none"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, brand_id: value === "none" ? "" : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Brand</SelectItem>
                        {((brands as any)?.data?.items || []).map((brand: any) => (
                          <SelectItem key={brand._id} value={brand._id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formData.unit_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pc">Piece (PC)</SelectItem>
                        <SelectItem value="kg">Kilogram (KG)</SelectItem>
                        <SelectItem value="ltr">Liter (LTR)</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcode_symbology">Barcode Symbology</Label>
                    <Select
                      value={formData.barcode_symbology}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, barcode_symbology: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CODE128">CODE128</SelectItem>
                        <SelectItem value="CODE39">CODE39</SelectItem>
                        <SelectItem value="EAN13">EAN13</SelectItem>
                        <SelectItem value="UPC">UPC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Item Barcode</Label>
                    <div className="flex gap-2">
                      <Input
                        id="barcode"
                        placeholder="Enter barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={generateBarcode}>
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                  <p className="text-xs text-muted-foreground">Maximum 60 Words</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Pricing & Stocks */}
        <Collapsible open={pricingStocksOpen} onOpenChange={setPricingStocksOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">$</span>
                  </div>
                  <CardTitle>Pricing & Stocks</CardTitle>
                </div>
                {pricingStocksOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Product Type *</Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="single"
                        name="productType"
                        value="single"
                        checked={productType === 'single'}
                        onChange={(e) => {
                          setProductType('single')
                          setHasVariants(false)
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="single" className="font-normal cursor-pointer">
                        Single Product
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="variable"
                        name="productType"
                        value="variable"
                        checked={productType === 'variable'}
                        onChange={(e) => {
                          setProductType('variable')
                          setHasVariants(true)
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="variable" className="font-normal cursor-pointer">
                        Variable Product
                      </Label>
                    </div>
                  </div>
                </div>

                {productType === 'single' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_type">Tax Type *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inclusive">Inclusive</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax">Tax *</Label>
                        <Select
                          value={formData.tax_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, tax_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Tax</SelectItem>
                            <SelectItem value="vat5">VAT 5%</SelectItem>
                            <SelectItem value="vat10">VAT 10%</SelectItem>
                            <SelectItem value="vat15">VAT 15%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount_type">Discount Type *</Label>
                        <Select
                          value={formData.discount_type}
                          onValueChange={(value: any) => setFormData(prev => ({ ...prev, discount_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount_value">Discount Value *</Label>
                        <Input
                          id="discount_value"
                          type="number"
                          placeholder="0"
                          value={formData.discount_value}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity_alert">Quantity Alert *</Label>
                      <Input
                        id="quantity_alert"
                        type="number"
                        placeholder="10"
                        value={formData.quantity_alert}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity_alert: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>
                  </>
                )}

                {productType === 'variable' && (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <p className="text-muted-foreground">
                      Variable product selected. After creating the product, you'll be able to add variants with different attributes, prices, and stock levels.
                    </p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Images */}
        <Collapsible open={imagesOpen} onOpenChange={setImagesOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">🖼</span>
                  </div>
                  <CardTitle>Images</CardTitle>
                </div>
                {imagesOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Custom Fields */}
        <Collapsible open={customFieldsOpen} onOpenChange={setCustomFieldsOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">⚙</span>
                  </div>
                  <CardTitle>Custom Fields</CardTitle>
                </div>
                {customFieldsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="border-b pb-2 mb-4">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="pb-2 border-b-2 border-orange-500 text-orange-600 font-medium"
                    >
                      Warranties
                    </button>
                    <button
                      type="button"
                      className="pb-2 text-muted-foreground"
                    >
                      Manufacturer
                    </button>
                    <button
                      type="button"
                      className="pb-2 text-muted-foreground"
                    >
                      Expiry
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Warranty *</Label>
                    <Select
                      value={formData.warranty_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, warranty_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Warranty</SelectItem>
                        <SelectItem value="6m">6 Months</SelectItem>
                        <SelectItem value="1y">1 Year</SelectItem>
                        <SelectItem value="2y">2 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer *</Label>
                    <Input
                      id="manufacturer"
                      placeholder="Enter manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufactured_date">Manufactured Date *</Label>
                    <Input
                      id="manufactured_date"
                      type="date"
                      value={formData.manufactured_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, manufactured_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry On *</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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