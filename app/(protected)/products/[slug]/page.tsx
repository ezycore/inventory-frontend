'use client'
// coding-standard: maintained

import { use } from 'react'
import { useTranslations } from 'next-intl'
import { ProductDetail } from '@/components/products/product-detail'
import { Button } from '@ui/components/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const t = useTranslations('products.products.detailPage')

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
      </div>
      <ProductDetail slug={slug} />
    </div>
  )
}
