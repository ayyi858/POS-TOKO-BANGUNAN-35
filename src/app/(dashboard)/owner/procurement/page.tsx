import { getProcurementSchedules } from '@/actions/procurement'
import { getSuppliers } from '@/actions/supplier'
import { getProducts } from '@/actions/product'
import { ProcurementClient } from './procurement-client'

export const dynamic = 'force-dynamic'

export default async function ProcurementPage() {
  const schedules = await getProcurementSchedules()
  const suppliers = await getSuppliers()
  const products = await getProducts()

  return (
    <div className="max-w-6xl mx-auto py-8">
       <ProcurementClient 
         schedules={schedules || []} 
         suppliers={suppliers || []} 
         products={products || []} 
       />
    </div>
  )
}
