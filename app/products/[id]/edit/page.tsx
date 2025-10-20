import ProductForm from '@/components/products/product-form'

export default async function EditProductPage({ params }) {
  const { id } = await params
  return <ProductForm mode="edit" productId={id} />
}