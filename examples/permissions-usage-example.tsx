// Example: Using permissions in Product List Page

import { Can } from '@/components/permissions/can'
import { useModulePermissions } from '@/hooks/use-permissions'
import { Button } from '@ui/components/button'

export function ProductsPage() {
  const permissions = useModulePermissions('products')

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Products</h1>
        
        {/* Only show create button if user has create permission */}
        <Can permission="products.create">
          <Button>Create Product</Button>
        </Can>
      </div>

      {/* Only show content if user has view permission */}
      <Can permission="products.view" fallback={<p>You don't have permission to view products.</p>}>
        <ProductList />
      </Can>
    </div>
  )
}

function ProductList() {
  const { canEdit, canDelete } = useModulePermissions('products')

  return (
    <div>
      {/* Product items */}
      <div className="product-item">
        <h3>Product Name</h3>
        
        <div className="actions">
          {/* Show edit button only if user can edit */}
          <Can permission="products.edit">
            <Button variant="ghost">Edit</Button>
          </Can>
          
          {/* Show delete button only if user can delete */}
          <Can permission="products.delete">
            <Button variant="destructive">Delete</Button>
          </Can>
        </div>
      </div>

      {/* Alternative: Using hook directly */}
      <div className="product-item">
        <h3>Another Product</h3>
        <div className="actions">
          {canEdit && <Button variant="ghost">Edit</Button>}
          {canDelete && <Button variant="destructive">Delete</Button>}
        </div>
      </div>
    </div>
  )
}
