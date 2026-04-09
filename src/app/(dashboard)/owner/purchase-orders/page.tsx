import { getPurchaseOrders, getPurchaseOrderItems } from '@/actions/purchase-order'
import { getSuppliers } from '@/actions/supplier'
import { getProducts } from '@/actions/product'
import { createClient } from '@/lib/supabase/server'
import { PurchaseOrdersClient } from './po-client'

export const dynamic = 'force-dynamic'

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()

  const pos = await getPurchaseOrders()
  const suppliers = await getSuppliers()
  const products = await getProducts()
  
  // We need to fetch items for each PO to calculate totals and display items
  // Since server side we can't do n+1 efficiently without a view, we'll fetch all items 
  // that belong to the POs currently fetched.
  const poIds = pos.map((p: any) => p.id)
  let allItems: any[] = []
  
  if (poIds.length > 0) {
     const { data: itemsData } = await supabase
        .from('purchase_order_items')
        .select(`*, products(name)`)
        .in('po_id', poIds)
        
     if (itemsData) {
         allItems = itemsData
     }
  }

  // Calculate totals and attach items per PO
  const posWithItems = pos.map((po: any) => {
      const items = allItems.filter(item => item.po_id === po.id)
      const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.cost_price)), 0)
      return {
          ...po,
          items,
          totalAmount
      }
  })

  return (
    <div className="max-w-6xl mx-auto py-8">
       <PurchaseOrdersClient 
         pos={posWithItems} 
         suppliers={suppliers || []} 
         products={products || []} 
       />
    </div>
  )
}
