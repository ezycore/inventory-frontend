'use client'

import { useRouter } from 'next/navigation'
import ProductForm from '@/components/products/product-form'
import { useState } from 'react'

export default function AddProductSheet() {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const handleClose = (state?: boolean) => {

    setOpen(!!state)

    if (!state) {
      setTimeout(() => {
        router.back();
        // Re-open the drawer after navigation to avoid flicker if user comes back
        setOpen(true)
      }, 500)
    }
  }
  return (
    <ProductForm
      openInside="drawer"
      open={open}
      onOpenChange={handleClose}
      onSuccess={handleClose}
    />
  )
}
