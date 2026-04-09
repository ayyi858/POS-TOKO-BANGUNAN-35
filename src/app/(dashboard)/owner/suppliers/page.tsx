import { createClient } from '@/lib/supabase/server'
import { getSuppliers } from '@/actions/supplier'
import { getProducts } from '@/actions/product'
import { SuppliersClient } from './suppliers-client'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const supabase = await createClient()
  
  const suppliers = await getSuppliers()
  const products = await getProducts()
  
  const { data: supplierProducts } = await supabase.from('supplier_products').select('*')
  
  return (
    <div className="max-w-6xl mx-auto py-8">
       <SuppliersClient 
         suppliers={suppliers || []} 
         products={products || []} 
         supplierProducts={supplierProducts || []} 
       />
    </div>
  )
}
