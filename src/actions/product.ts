'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createProduct(data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').insert([data])
  if (error) throw new Error(error.message)
  revalidatePath('/owner/products')
  return { success: true }
}

export async function updateProduct(id: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/owner/products')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/owner/products')
  return { success: true }
}

export async function reduceStock(productId: string, qty: number, reason: string) {
  const supabase = await createClient()
  
  const { data: product, error: getErr } = await supabase
    .from('products').select('stock, name').eq('id', productId).single()
  if (getErr || !product) throw new Error('Produk tidak ditemukan')
  if (product.stock < qty) throw new Error(`Stok saat ini hanya ${product.stock}. Tidak bisa kurangi ${qty}.`)

  const newStock = product.stock - qty
  const { error: updateErr } = await supabase
    .from('products').update({ stock: newStock }).eq('id', productId)
  if (updateErr) throw new Error(updateErr.message)

  revalidatePath('/owner/products')
  return { success: true, newStock }
}

export async function importProducts(records: Array<{
  name: string
  category?: string
  price: number
  stock: number
  min_stock: number
}>) {
  const supabase = await createClient()
  if (!records || records.length === 0) throw new Error('Data kosong')

  const { error } = await supabase.from('products').insert(
    records.map(r => ({
      name: r.name,
      category: r.category,
      price: r.price,
      stock: r.stock,
      min_stock: r.min_stock,
    }))
  )
  if (error) throw new Error(error.message)
  revalidatePath('/owner/products')
  return { success: true, count: records.length }
}
