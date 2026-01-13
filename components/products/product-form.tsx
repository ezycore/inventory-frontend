import { useState, useEffect, useMemo } from 'react'
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
import CustomFieldsManager from '../../ui/components/form/custom-fields-manager'
import VariantManager from './variant-manager'
import { productFormConfig } from './form-config'
import { sanitize } from '@/hooks'


type ProductFormValues = any // Will be inferred from generated schema

interface ProductFormProps {
  productId?: string
  onSuccess?: () => void
  onCancel?: () => void

  // Container mode props
  openInside?: 'drawer' | 'modal'
  open?: boolean
  onOpenChange?: (open: boolean) => void


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
  const [variants, setVariants] = useState<any[]>([])
  const [basePrice, setBasePrice] = useState<number>(0)
  const mode = productId ? 'edit' : 'create'
  console.log("variants:", variants);
  
  // Check if product has variants based on form data
  const hasVariants = variants.length > 0

  // Queries
  const { data: product, isLoading: productLoading } = useProduct(productId || '')

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Use dynamic form with auto-generated schema
  // Config is memoized to prevent recreation on every render
  const { form } = useDynamicForm<ProductFormValues>(productFormConfig)



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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Watch price field for variant base price - optimized subscription
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'price' && value.price !== undefined) {
        setBasePrice(value.price)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Load existing product data for editing
  // useEffect(() => {
  //   if (mode === 'edit' && product) {
  //     const productData = product.data as any
  //     console.log('Loading product data into form:', productData)
  //     form.reset({
  //       name: productData.name,
  //       description: productData.description || '',
  //       categoryId: productData.categoryId,
  //       brandId: productData.brandId || '',
  //       images: productData.images || [],
  //       status: productData.status,
  //       unitId: productData.unitId || '',
  //       sellingType: productData.sellingType,
  //       taxType: productData.taxType,
  //       taxId: productData.taxId || '',
  //       discountType: productData.discountType,
  //       discountValue: productData.discountValue,
  //       hasExpiry: productData.hasExpiry || '',
  //       expiryAlertDays: productData.expiryAlertDays,
  //       productType: productData.productType,
  //       price: productData.price,
  //       costPrice: productData.costPrice,
  //     })
  //   }
  // }, [mode, product, form])

  useEffect(() => {
  if (mode === "edit" && product?.data) {
    const p = product.data as any;

    form.reset(sanitize(p));
  }
}, [mode, product, form]);

  // Use the imported config directly (already memoized at module level)
  // No need to recreate it here


  // Mutation-based form handlers
  // const handleActionSuccess = (result: any, data: any) => {
  //   const successMessage = mode === 'create' ? 'Product created successfully' : 'Product updated successfully'
  //   toast.success(successMessage)

  //   if (onSuccess) {
  //     // For update mutation, result contains the updated data directly
  //     // For create mutation, result is the new product
  //     const resultProductId = mode === 'create' ? result?._id : productId
  //     onSuccess(resultProductId, hasVariants)
  //   } else {
  //     if (mode === 'create' && hasVariants) {
  //       router.push(`/products/${result?._id}/variants`)
  //     } else {
  //       router.push('/products')
  //     }
  //   }
  // }

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
      <>
        <DynamicForm
          id='product-form'
          className="space-y-6"
          form={form}
          config={productFormConfig}
          onSubmit={(data) => {
            // Add variants data if product type is variable (only active variants)
            // if (data.productType_radio === 'variable' && variants.length > 0) {
            //   const activeVariants = variants
            //     .filter(v => v.enabled)
            //     .map(v => ({
            //       attribute_name: v.attributeName,
            //       attribute_value: v.value,
            //       sku: v.sku,
            //       quantity: v.quantity,
            //       price: v.price,
            //     }))

            //   return {
            //     ...data,
            //     variants: activeVariants
            //   }
            // }
            // return data
            const formData = new FormData()
              for (const key in data) {
                if (key !== 'images' && data[key] !== undefined) {
                  formData.append(key, data[key])
                }
              }
              if (mode === 'edit' && productId) {
                formData.append('id', productId)
                if (!data.images || data.images.length === 0) {
                  // User removed the logo
                  formData.append("remove_logo", "true");
                } else if (Array.isArray(data.images) && data.images[0] instanceof File) {
                  // User uploaded NEW file (File object)
                  formData.append("images", data.images[0]);
                }
              } else {
                const images = data.images || []
                if (images.length) {
                  formData.append('images', images[0])
                }
              }
              if(data.productType === "variable" && variants.length > 0) {
                const variantsData = variants
                  .map(v => ({
                    attributes: {
                      [v.attributeName]: v.value
                    },
                    costPrice: v.costPrice,
                    price: v.price,
                    status: v.enabled ? 'active' : 'inactive',
                    // sku: v.sku,
                  }))
                formData.append('variants', JSON.stringify(variantsData))
              }
              return formData
          }}

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
          onSuccess={onSuccess}
          onFailed={handleActionError}
        />
      </>
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
            <h4 className="text-2.5xl font-bold">
              {mode === 'create' ? 'Create Product' : 'Edit Product'}
            </h4>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <DynamicForm
          id='product-form'
          className="space-y-6"
          config={productFormConfig}
          form={form}
          onSubmit={(data) => {

            // Add variants data if product type is variable (only active variants)
            // if (data.productType_radio === 'variable' && variants.length > 0) {
            //   const activeVariants = variants
            //     .filter(v => v.enabled)
            //     .map(v => ({
            //       attribute_name: v.attributeName,
            //       attribute_value: v.value,
            //       sku: v.sku,
            //       quantity: v.quantity,
            //       price: v.price,
            //     }))

            //   return {
            //     ...data,
            //     variants: activeVariants
            //   }
            // }
            // return data
            const formData = new FormData()
            for (const key in data) {
              if (key !== 'images' && data[key] !== undefined) {
                formData.append(key, data[key])
              }
            }
            if (mode === 'edit' && productId) {
              formData.append('id', productId)
              if (!data.images || data.images.length === 0) {
                // User removed the logo
                formData.append("remove_logo", "true");
              } else if (Array.isArray(data.images) && data.images[0] instanceof File) {
                // User uploaded NEW file (File object)
                formData.append("images", data.images[0]);
              }
            } else {
              const images = data.images || []
              if (images.length) {
                formData.append('images', images[0])
              }
            }
            return formData
          }
          }

          // Form actions props
          cancelLabel="Cancel"
          submitLabel={submitLabel}
          onCancel={() => onCancel ? onCancel() : router.back()}

          // Content loading for edit mode
          contentLoading={mode === 'edit' && productLoading}

          // Mutation hook
          mutationHook={mode === 'create' ? createProduct : updateProduct}
          onSuccess={onSuccess}
          onFailed={handleActionError}
        />
      </div>
    </div>
  )
}