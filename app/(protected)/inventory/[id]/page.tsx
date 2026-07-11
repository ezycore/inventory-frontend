'use client'
// coding-standard: maintained

import { use } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@ui/components/button'
import { InventoryDetail } from '@/components/inventory/detail/inventory-detail'

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const t = useTranslations('inventory.detail')
  const router = useRouter()

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
      </div>
      <InventoryDetail inventoryId={id} />
    </div>
  )
}
