'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/components/dialog'
import ProductForm from './product-form'

interface EditProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function EditProductModal({
  open,
  onOpenChange,
  productId,
  onSuccess,
  onCancel
}: EditProductModalProps) {
  const handleSuccess = () => {
    onOpenChange(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    onOpenChange(false)
    onCancel?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <ProductForm 
          mode="edit" 
          productId={productId}
          isModal={true}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}