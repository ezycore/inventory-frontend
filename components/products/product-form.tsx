'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicForm } from '@/hooks/use-dynamic-form'

import { Button } from '@ui/components/button'
import { DynamicForm } from '@ui/components/form'
import {
  useCreateProduct,
  useUpdateProduct,
  useProduct,
  useCategories,
  useBrands
} from '@/hooks/queries'
import { toast } from 'sonner'
import { handleMutationError } from '@/lib/error-handling'
import { ArrowLeft } from 'lucide-react'
import type { CreateProductDto, Product } from '@/types'
import { ProductStatus } from '@/types'
import CustomFieldsManager from './custom-fields-manager'
import { createProductFormConfig } from './product-form-config'
import type { DynamicFormConfig } from '@/types/form'




type ProductFormValues = any // Will be inferred from generated schema

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
  const [hasVariants, setHasVariants] = useState(false)
  const [productType, setProductType] = useState<'single' | 'variable'>('single')

  // Queries
  const { data: product, isLoading: productLoading } = useProduct(productId || '')
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

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

  // Use dynamic form with auto-generated schema first
  const { form } = useDynamicForm<ProductFormValues>(
    createProductFormConfig(
      ((categories as any)?.data?.items || []),
      ((brands as any)?.data?.items || [])
    ), 
    {
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
    custom_fields: [],
    product_type_radio: 'single',
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
    ((categories as any)?.data?.items || []),
    ((brands as any)?.data?.items || []),
    (name: string) => {
      form.setValue('name', name)
      form.setValue('slug', generateSlug(name))
    },
    handleGenerateBarcode
  )

  // Add custom components for custom fields
  const updatedFormConfig = {
    ...finalFormConfig,
    sections: finalFormConfig.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => {
        if (field.name === 'custom_fields') {
          return { 
            ...field, 
            customComponent: ({ value, onChange, error }: any) => (
              <CustomFieldsManager
                control={form.control as any}
                name="custom_fields"
                maxFields={10}
              />
            )
          }
        }
        return field
      })
    }))
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

      <form id={formId} onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <DynamicForm
          config={updatedFormConfig}
          control={form.control}
          formState={form.formState}
          watch={form.watch}
          setValue={form.setValue}
          getValues={form.getValues}
          onFieldChange={handleFieldChange}
        />
      </form>

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

    </div>
  )
}