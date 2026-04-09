'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSuppliers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw error
  return data
}

export async function createSupplier(data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').insert([data])
  if (error) throw new Error(error.message)
  revalidatePath('/owner/suppliers')
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/owner/suppliers')
  return { success: true }
}

export async function addSupplierProduct(data: any) {
    const supabase = await createClient()
    const { error } = await supabase.from('supplier_products').upsert(data, { onConflict: 'supplier_id, product_id' })
    if (error) throw new Error(error.message)
    revalidatePath('/owner/suppliers')
    return { success: true }
}

export async function createStockPurchase(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('stock_purchases').insert([{
        product_id: data.product_id,
        supplier_id: data.supplier_id,
        qty: data.qty,
        total_cost: data.total_cost,
        user_id: user?.id
    }])
    if (error) throw new Error(error.message)
    
    // Trigger is handling the product stock update internally in DB
    revalidatePath('/owner/products')
    revalidatePath('/owner')
    return { success: true }
}
