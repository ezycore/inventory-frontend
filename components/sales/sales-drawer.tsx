'use client'

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@ui/components/sheet'
import { Button } from '@ui/components/button'
import { useState } from 'react'
import SalesForm from './sales-form'

interface ProductDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string
  onSuccess?: () => void
}

export default function SalesDrawer({ open, onOpenChange, productId, onSuccess }: ProductDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!productId

  const handleSuccess = () => {
    setIsSubmitting(false)
    onOpenChange(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    const form = document.getElementById('product-form-drawer') as HTMLFormElement
    form?.requestSubmit()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[80vw] sm:max-w-[880px] p-0 overflow-hidden flex flex-col [&>button]:hidden"
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
          <SheetTitle>{isEditMode ? 'Update Sales Order' : 'Create New Sales Order'}</SheetTitle>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Sales Order' : 'Create Sales Order')}
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <SalesForm 
            mode={isEditMode ? 'edit' : 'create'}
            productId={productId}
            formId="product-form-drawer"
            hideActions={true}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            isModal={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
