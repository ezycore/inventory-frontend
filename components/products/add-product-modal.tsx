'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/components/dialog'
import ProductForm from '@/components/products/product-form'

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AddProductModal({ open, onOpenChange, onSuccess }: AddProductModalProps) {
  const handleSuccess = () => {
    onOpenChange(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <ProductForm 
          mode="create" 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  )
}