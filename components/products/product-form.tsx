'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicForm } from '@/hooks/use-dynamic-form'

import { Button } from '@ui/components/button'
import DynamicForm from '@/ui/components/form'
import {
  useCreateProduct,
  useUpdateProduct,
  useProduct
} from '@/hooks/queries'
import { toast } from 'sonner'
import { handleMutationError } from '@/lib/error-handling'
import { ArrowLeft } from 'lucide-react'
import { ProductStatus } from '@/types'
import CustomFieldsManager from '../../ui/components/form/custom-fields-manager'
import VariantManager from './variant-manager'
import { createProductFormConfig } from './product-form-config'


type ProductFormValues = any // Will be inferred from generated schema

interface ProductFormProps {
  productId?: string
  onSuccess?: (productId?: string, hasVariants?: boolean) => void
  onCancel?: () => void

  // Container mode props
  openInside?: 'drawer' | 'modal'
  open?: boolean
  onOpenChange?: (open: boolean) => void


}

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
  const barcode = `${timestamp}${random}`
  // We'll set this in the form after it's created
  return barcode
}

const handleNameChange = (name: string) => {
  // This will be called after form is created
  return { name, slug: generateSlug(name) }
}

export default function ProductForm({
  productId,
  onSuccess,
  onCancel,

  // Container mode props
  openInside,
  open,
  onOpenChange,


}: ProductFormProps) {
  const router = useRouter()
  const [hasVariants, setHasVariants] = useState(false)
  const [productType, setProductType] = useState<'single' | 'variable'>('single')
  const [variants, setVariants] = useState<any[]>([])
  const [basePrice, setBasePrice] = useState<number>(0)
  const mode = productId ? 'edit' : 'create'

  // Queries
  const { data: product, isLoading: productLoading } = useProduct(productId || '')

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Use dynamic form with auto-generated schema and config defaults
  const { form, config } = useDynamicForm<ProductFormValues>(createProductFormConfig())

  // Register custom field renderers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ; (window as any).__customFieldRenderers = {
        ...(window as any).__customFieldRenderers,
        custom_fields: ({ control, maxCount }: any) => (
          <CustomFieldsManager
            control={control}
            name="custom_fields"
            maxFields={maxCount || 5}
          />
        ),
        variant_manager: () => (
          <VariantManager
            productType={productType}
            onProductTypeChange={(type) => {
              setProductType(type)
              setHasVariants(type === 'variable')
            }}
            onVariantsChange={setVariants}
            defaultVariants={variants}
            basePrice={basePrice || form.getValues('price') || 0}
          />
        )
      }
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && (window as any).__customFieldRenderers) {
        delete (window as any).__customFieldRenderers.custom_fields
        delete (window as any).__customFieldRenderers.variant_manager
      }
    }
  }, [productType, variants, basePrice, form])

  // Watch price field for variant base price
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'price' && value.price) {
        setBasePrice(value.price)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

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
        custom_fields: productData.custom_fields || [],
      })
    }
  }, [mode, product, form])

  // Handle field changes from dynamic form
  const handleFieldChange = (fieldName: string, value: any) => {
    switch (fieldName) {
      case 'name':
        const slugValue = generateSlug(value)
        form.setValue('slug', slugValue)
        break
      case 'brand_id':
        // Handle brand selection with 'none' option
        form.setValue('brand_id', value === 'none' ? '' : value)
        break
      case 'product_type_radio':
        setProductType(value)
        setHasVariants(value === 'variable')
        break
      default:
        break
    }
  }

  // Add barcode generation function for the form
  const handleGenerateBarcode = () => {
    const barcode = generateBarcode()
    form.setValue('barcode', barcode)
    toast.success('Barcode generated')
  }

  // Create final form configuration with custom components
  const finalFormConfig = createProductFormConfig(
    (name: string) => {
      form.setValue('name', name)
      form.setValue('slug', generateSlug(name))
    },
    handleGenerateBarcode
  )

  // Form configuration handles the custom-fields type automatically





  // Mutation-based form handlers
  const handleActionSuccess = (result: any, data: any) => {
    const successMessage = mode === 'create' ? 'Product created successfully' : 'Product updated successfully'
    toast.success(successMessage)

    if (onSuccess) {
      // For update mutation, result contains the updated data directly
      // For create mutation, result is the new product
      const resultProductId = mode === 'create' ? result?._id : productId
      onSuccess(resultProductId, hasVariants)
    } else {
      if (mode === 'create' && hasVariants) {
        router.push(`/products/${result?._id}/variants`)
      } else {
        router.push('/products')
      }
    }
  }

  const handleActionError = (error: any, data: any) => {
    handleMutationError(error)
  }

  const handleContainerCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (onOpenChange) {
      onOpenChange(false)
    } else {
      router.back()
    }
  }

  const containerTitle = mode === 'create' ? 'Create New Product' : 'Update Product'
  const submitLabel = mode === 'create' ? 'Create Product' : 'Update Product'
  if (openInside) {
    return (
      <DynamicForm
        id='product-form'
        className="space-y-6"
        form={form}
        config={finalFormConfig}
        onFieldChange={handleFieldChange}

        // Container props
        openInside={openInside}
        open={open}
        onOpenChange={onOpenChange}
        title={containerTitle}
        submitLabel={submitLabel}
        cancelLabel="Cancel"
        onCancel={handleContainerCancel}

        // Form actions props
        actionsPlacement="top"

        // Content loading for edit mode
        contentLoading={mode === 'edit' && productLoading}

        // Mutation hook
        mutationHook={mode === 'create' ? createProduct : updateProduct}
        onSuccess={handleActionSuccess}
        onFailed={handleActionError}
      />
    )
  }

  // Regular form mode
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}

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

      <div className="space-y-6">
        <DynamicForm
          id='product-form'
          className="space-y-6"
          config={finalFormConfig}
          form={form}
          onFieldChange={handleFieldChange}

          // Form actions props
          cancelLabel="Cancel"
          submitLabel={submitLabel}
          onCancel={() => onCancel ? onCancel() : router.back()}

          // Content loading for edit mode
          contentLoading={mode === 'edit' && productLoading}

          // Mutation hook
          mutationHook={mode === 'create' ? createProduct : updateProduct}
          onSuccess={handleActionSuccess}
          onFailed={handleActionError}
        />
      </div>
    </div>
  )
}