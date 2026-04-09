import { getProducts } from '@/actions/product'
import { ProductsClient } from './products-client'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getProducts()
  
  return (
    <div className="max-w-6xl mx-auto py-8">
       <ProductsClient initialProducts={products} />
    </div>
  )
}
