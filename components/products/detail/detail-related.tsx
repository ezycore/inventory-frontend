// coding-standard: maintained
'use client'

import { Link2 } from 'lucide-react'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { handleMutationSuccess } from '@/services/api/modules/query-helpers'
import {
  RelatedProductsCard,
  useRelatedPicksDraft,
} from '@/components/ecommerce/catalog/related-products-card'

/**
 * "You may also like" picks on the product page — the one place every shop can reach. A stock-free
 * shop has no Products → Online tab, so the listing editor (which also carries this card) is not
 * there for it. Saved on its own, since this page has no form.
 */
export function DetailRelated({ productId }: { productId: string }) {
  const draft = useRelatedPicksDraft(productId)
  const save = async () => {
    await draft.save()
    handleMutationSuccess('Related products saved')
  }
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-emerald-600" />
          You may also like
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <RelatedProductsCard productId={productId} draft={draft} />
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={!draft.dirty || draft.pending}>
            {draft.pending ? 'Saving…' : 'Save related products'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
