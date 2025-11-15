'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Label } from '@ui/components/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ui/components/collapsible'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemPreview,
  FileUploadList,
} from '@ui/components/file-upload'
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
import { productFormSchema } from './schema'
import { FormInput, FormTextarea, FormSelect, FormRow, FormRow3, FormSelectWithButton, FormInputWithButton } from './form-fields'
import {
  storeOptions,
  warehouseOptions,
  sellingTypeOptions,
  subCategoryOptions,
  unitOptions,
  barcodeSymbologyOptions,
  taxTypeOptions,
  taxOptions,
  discountTypeOptions,
  warrantyOptions,
} from './product-form-options'



type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormProps {
  productId?: string
  mode: 'create' | 'edit'
  onSuccess?: (productId?: string, hasVariants?: boolean) => void
  onCancel?: () => void
  isSidebar?: boolean
  formId?: string
  hideActions?: boolean
}

export default function ProductForm({ productId, mode, onSuccess, onCancel, isSidebar = false, formId = 'product-form', hideActions = false }: ProductFormProps) {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
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

  // React Hook Form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
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
    },
  })

  // Load existing product data for editing
  useEffect(() => {
    if (mode === 'edit' && product) {
      const productData = product as any
      form.reset({
        name: productData.name,
        slug: productData.slug,
        description: productData.description || '',
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
      
      // Reset uploaded files for edit mode - images will be shown from URLs
      setUploadedFiles([])
    }
  }, [mode, product, form])

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
    form.setValue('barcode', `${timestamp}${random}`)
    toast.success('Barcode generated')
  }

  const handleNameChange = (name: string) => {
    form.setValue('name', name)
    form.setValue('slug', generateSlug(name))
  }

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues('images') || []
    form.setValue('images', currentImages.filter((_, i) => i !== index))
  }

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files)
    // Convert files to URLs for preview (in real app, you'd upload to server)
    const imageUrls = files.map(file => URL.createObjectURL(file))
    form.setValue('images', imageUrls)
  }

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (mode === 'create') {
        const result = await createProduct.mutateAsync(data as any)
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
        await updateProduct.mutateAsync({ id: productId, ...data } as any)
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
      {!isSidebar && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {mode === 'create' ? 'Create Product' : 'Edit Product'}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'create' ? 'Create new product' : 'Update product information'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
            Back to Product
          </Button>
        </div>
      )}

      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormRow>
                  <FormSelect
                    control={form.control}
                    name="store_id"
                    label="Store"
                    options={storeOptions}
                  />
                  <FormSelect
                    control={form.control}
                    name="warehouse_id"
                    label="Warehouse"
                    options={warehouseOptions}
                  />
                </FormRow>

                <FormRow>
                  <FormInput
                    control={form.control}
                    name="name"
                    label="Product Name"
                    required
                    placeholder="Enter product name"
                    onChange={(e) => handleNameChange(e.target.value)}
                    error={form.formState.errors.name?.message}
                  />
                  <FormInput
                    control={form.control}
                    name="slug"
                    label="Slug"
                    required
                    placeholder="product-slug"
                    error={form.formState.errors.slug?.message}
                  />
                </FormRow>

                <FormRow>
                  <FormInput
                    control={form.control}
                    name="base_sku"
                    label="SKU"
                    placeholder="Enter SKU"
                  />
                  <FormSelect
                    control={form.control}
                    name="selling_type"
                    label="Selling Type"
                    required
                    options={sellingTypeOptions}
                  />
                </FormRow>

                <FormRow>
                  <FormSelectWithButton
                    control={form.control}
                    name="category_id"
                    label="Category"
                    required
                    placeholder="Choose"
                    options={((categories as any)?.data?.items || []).map((category: any) => ({
                      value: category._id,
                      label: category.name,
                    }))}
                    buttonIcon={<Plus className="h-4 w-4" />}
                    onButtonClick={() => {
                      toast.info('Add Category feature coming soon')
                    }}
                    buttonLabel="Add Category"
                    error={form.formState.errors.category_id?.message}
                  />
                  <FormSelect
                    control={form.control}
                    name="sub_category_id"
                    label="Sub Category"
                    options={subCategoryOptions}
                  />
                </FormRow>

                <FormRow>
                  <FormSelect
                    control={form.control}
                    name="brand_id"
                    label="Brand"
                    options={[
                      { value: 'none', label: 'No Brand' },
                      ...((brands as any)?.data?.items || []).map((brand: any) => ({
                        value: brand._id,
                        label: brand.name,
                      })),
                    ]}
                    onValueChange={(value) => {
                      form.setValue('brand_id', value === 'none' ? '' : value)
                    }}
                  />
                  <FormSelect
                    control={form.control}
                    name="unit_id"
                    label="Unit"
                    options={unitOptions}
                  />
                </FormRow>

                <FormRow>
                  <FormSelect
                    control={form.control}
                    name="barcode_symbology"
                    label="Barcode Symbology"
                    options={barcodeSymbologyOptions}
                  />
                  <FormInputWithButton
                    control={form.control}
                    name="barcode"
                    label="Item Barcode"
                    placeholder="Enter barcode"
                    buttonIcon={<Wand2 className="h-4 w-4" />}
                    onButtonClick={generateBarcode}
                    buttonLabel="Generate Barcode"
                  />
                </FormRow>

                <FormTextarea
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Describe your product..."
                  rows={4}
                  helperText="Maximum 60 Words"
                />
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
                    <FormRow3>
                      <FormInput
                        control={form.control}
                        name="quantity"
                        label="Quantity"
                        required
                        type="number"
                        placeholder="0"
                        min="0"
                        valueAsNumber
                      />
                      <FormInput
                        control={form.control}
                        name="price"
                        label="Price"
                        required
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        valueAsNumber
                      />
                      <FormSelect
                        control={form.control}
                        name="tax_type"
                        label="Tax Type"
                        required
                        placeholder="Select"
                        options={taxTypeOptions}
                      />
                    </FormRow3>

                    <FormRow3>
                      <FormSelect
                        control={form.control}
                        name="tax_id"
                        label="Tax"
                        required
                        placeholder="Select"
                        options={taxOptions}
                      />
                      <FormSelect
                        control={form.control}
                        name="discount_type"
                        label="Discount Type"
                        required
                        placeholder="Select"
                        options={discountTypeOptions}
                      />
                      <FormInput
                        control={form.control}
                        name="discount_value"
                        label="Discount Value"
                        required
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        valueAsNumber
                      />
                    </FormRow3>

                    <FormInput
                      control={form.control}
                      name="quantity_alert"
                      label="Quantity Alert"
                      required
                      type="number"
                      placeholder="10"
                      min="0"
                      valueAsNumber
                    />
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
                <FileUpload
                  value={uploadedFiles}
                  onValueChange={handleFileUpload}
                  accept="image/*"
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024} // 5MB
                  multiple
                >
                  <FileUploadDropzone className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-semibold text-primary">Click to upload</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 5MB (Max 5 images)
                      </p>
                    </div>
                  </FileUploadDropzone>

                  <FileUploadList className="mt-4">
                    {uploadedFiles.map((file, index) => (
                      <FileUploadItem 
                        key={index} 
                        value={file}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <FileUploadItemPreview className="h-16 w-16 rounded overflow-hidden bg-gray-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {index === 0 && (
                            <span className="inline-block mt-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              Main Image
                            </span>
                          )}
                        </div>
                        <FileUploadItemDelete asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </FileUploadItemDelete>
                      </FileUploadItem>
                    ))}
                  </FileUploadList>

                  {/* Show existing images when in edit mode */}
                  {mode === 'edit' && form.watch('images')?.length > 0 && uploadedFiles.length === 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Current Images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(form.watch('images') || []).map((imageUrl: string, index: number) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={imageUrl} 
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
                    </div>
                  )}
                </FileUpload>
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
                <FormRow>
                  <FormSelect
                    control={form.control}
                    name="warranty_id"
                    label="Warranty"
                    required
                    placeholder="Select"
                    options={warrantyOptions}
                  />
                  <FormInput
                    control={form.control}
                    name="manufacturer"
                    label="Manufacturer"
                    required
                    placeholder="Enter manufacturer"
                  />
                </FormRow>

                <FormRow>
                  <FormInput
                    control={form.control}
                    name="manufactured_date"
                    label="Manufactured Date"
                    required
                    type="date"
                  />
                  <FormInput
                    control={form.control}
                    name="expiry_date"
                    label="Expiry On"
                    required
                    type="date"
                  />
                </FormRow>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Actions */}
        {!hideActions && (
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
        )}
      </form>
    </div>
  )
}